from datetime import datetime, timedelta

import pytest

from src.database import db_manager
from src.models.admin_operation import AdminOperation
from src.models.bet import Bet, Prediction
from src.models.event import Event
from src.models.game import Game
from src.models.score_event import ScoreEvent
from src.blueprints.notification_service import send_due_bet_reminders
from src.utils import hash_game_password


@pytest.fixture()
def game(base_data):
    success, game_id = Game.create(
        user_id=base_data["user"].id, name="Lifecycle Game",
        pw_hash=hash_game_password("123"), discipline_name=base_data["discipline"].id,
    )
    assert success
    game = Game.get_by_id(game_id)
    assert game.add_player(base_data["second_user"])
    return game


def login(app, user):
    client = app.test_client()
    assert client.post("/api/login", json={"name": user.name, "password": "pw"}).status_code == 200
    return client


@pytest.mark.parametrize("as_admin", [False, True])
def test_delete_permissions_and_audit(app, base_data, game, admin_client, as_admin):
    client = admin_client if as_admin else login(app, base_data["user"])
    response = client.delete("/api/game/delete", json={"game_id": game.id})
    assert response.status_code == 200
    assert response.get_json() == {"deleted_id": game.id}
    assert Game.get_by_id(game.id) is None
    assert game.id not in [item.id for item in Game.get_all()]
    assert db_manager.query_one("SELECT visible FROM Games WHERE id = ?", [game.id])["visible"] == 0
    assert len(db_manager.query("SELECT * FROM GamePlayers WHERE game_id = ?", [game.id])) == 2
    entry = AdminOperation.fetch_recent()[0]
    assert entry["action_type"] == "game_delete"
    assert entry["target_id"] == game.id
    assert entry["target_type"] == "game"
    assert entry["status"] == "succeeded"
    assert entry["actor_type"] == ("admin_user" if as_admin else "user")
    assert entry["actor_user_id"]
    assert entry["actor_name"]
    assert entry["created_at"]
    assert entry["details"] == {"game_name": game.name, "owner_id": game.creator.id, "actor_is_owner": not as_admin}
    assert client.delete("/api/game/delete", json={"game_id": game.id}).status_code == 404
    assert len(AdminOperation.fetch_recent()) == 1


def test_member_and_outsider_cannot_delete(app, base_data, game):
    client = login(app, base_data["second_user"])
    assert client.delete("/api/game/delete", json={"game_id": game.id}).status_code == 403
    game.remove_player(base_data["second_user"].id)
    assert client.delete("/api/game/delete", json={"game_id": game.id}).status_code == 403
    assert Game.get_by_id(game.id)
    assert AdminOperation.fetch_recent() == []


@pytest.mark.parametrize("raises", [False, True])
def test_audit_failure_rolls_back_deletion(client, game, monkeypatch, raises):
    def fail(**kwargs):
        if raises:
            raise RuntimeError("audit failure")
        return False
    monkeypatch.setattr(AdminOperation, "record", fail)
    assert client.delete("/api/game/delete", json={"game_id": game.id}).status_code == 500
    assert Game.get_by_id(game.id)
    assert AdminOperation.fetch_recent() == []


@pytest.mark.parametrize("method,path", [("delete", "/api/game/delete"), ("post", "/api/game/leave")])
def test_lifecycle_validation(app, client, base_data, game, method, path):
    assert getattr(app.test_client(), method)(path, json={"game_id": game.id}).status_code in (401, 302)
    client = login(app, base_data["user"])
    assert getattr(client, method)(path, json={}).status_code == 400
    assert getattr(client, method)(path, json={"game_id": "missing"}).status_code == 404
    game.delete()
    assert getattr(client, method)(path, json={"game_id": game.id}).status_code == 404


def test_owner_and_nonmember_cannot_leave(client, admin_client, game):
    assert client.post("/api/game/leave", json={"game_id": game.id}).status_code == 403
    assert admin_client.post("/api/game/leave", json={"game_id": game.id}).status_code == 403


def test_admin_member_can_leave(admin_client, game):
    from flask_login import current_user
    with admin_client:
        admin_client.get("/api/game")
        assert game.add_player(current_user._get_current_object())
    assert admin_client.post("/api/game/leave", json={"game_id": game.id}).status_code == 200
    assert Game.get_by_id(game.id)


def seed_bet_and_result(game, base_data):
    event = Event(name="Future Race", game_id=game.id, event_type=base_data["event_type"],
                  dt=datetime.now() + timedelta(days=1), allow_partial_points=True)
    assert event.save_to_db()[0]
    bet = Bet(user_id=base_data["second_user"].id, event_id=event.id, score=5)
    bet.predictions = [Prediction(bet_id=bet.id, object_id=base_data["athlete"].id,
                                  object_name="Athlete", predicted_place=1)]
    assert bet.save_to_db()
    db_manager.execute("INSERT INTO Results (id, event_id, place, object_id) VALUES (?,?,?,?)",
                       ["lifecycle-result", event.id, 1, base_data["athlete"].id])
    return event, bet


def test_leave_retains_history_blocks_bets_and_allows_rejoin(app, base_data, game, monkeypatch):
    event, bet = seed_bet_and_result(game, base_data)
    user = base_data["second_user"]
    client = login(app, user)
    assert ScoreEvent.get_all_by_game_id(game.id)[0].scores[user.id] == 5
    response = client.post("/api/game/leave", json={"game_id": game.id, "user_id": game.creator.id})
    assert response.status_code == 200
    assert response.get_json() == {"left_game_id": game.id}
    remaining = Game.get_by_id(game.id)
    assert [p.id for p in remaining.players] == [game.creator.id]
    assert db_manager.query_one("SELECT id FROM Bets WHERE id = ?", [bet.id])
    assert db_manager.query_one("SELECT id FROM Predictions WHERE bet_id = ?", [bet.id])
    assert db_manager.query_one("SELECT id FROM Results WHERE event_id = ?", [event.id])
    assert ScoreEvent.get_all_by_game_id(game.id) == []
    assert client.post("/api/event/save_bets", json={"event_id": event.id, "predictions": []}).status_code == 403
    assert client.post("/api/game/leave", json={"game_id": game.id}).status_code == 403

    recipients = []
    from src.models.notification_helper import NotificationHelper
    monkeypatch.setattr(NotificationHelper, "get_tokens_for_users", lambda ids, **kw: recipients.extend(ids) or [])
    send_due_bet_reminders(now=event.dt - timedelta(hours=1))
    assert game.creator.id in recipients
    assert user.id not in recipients

    assert client.post("/api/game/join", json={"game_id": game.id, "password": "123"}).status_code == 200
    assert ScoreEvent.get_all_by_game_id(game.id)[0].scores[user.id] == 5


def test_delete_retains_event_bet_prediction_and_result(client, game, base_data):
    event, bet = seed_bet_and_result(game, base_data)
    assert client.delete("/api/game/delete", json={"game_id": game.id}).status_code == 200
    for table, row_id in [("Events", event.id), ("Bets", bet.id), ("Results", "lifecycle-result")]:
        assert db_manager.query_one(f"SELECT id FROM {table} WHERE id = ?", [row_id])
    assert db_manager.query_one("SELECT id FROM Predictions WHERE bet_id = ?", [bet.id])
