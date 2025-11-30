from datetime import datetime, timedelta

import pytest

from src.models.game import Game
from src.models.event import Event
from src.models.user import User
from src.utils import hash_password


def _client_for(app, user_id):
    client = app.test_client()
    with client.session_transaction() as sess:
        sess["_user_id"] = user_id
    return client


def _create_game(app, owner_id, discipline_id, name="Authz Game"):
    with app.app_context():
        success, game_id = Game.create(user_id=owner_id, name=name, pw_hash=None, discipline_name=discipline_id)
        assert success
        return game_id


def _create_event(app, game_id, event_type, name="Authz Event"):
    with app.app_context():
        event = Event(
            name=name,
            game_id=game_id,
            event_type=event_type,
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=True,
            num_bets=1,
            points_correct_bet=5,
        )
        event.save_to_db()
        return event.id


@pytest.fixture()
def other_user(app):
    with app.app_context():
        success, user_id = User.create("other", hash_password("pw", app.config["SALT"]))
        assert success
        return user_id


def test_game_update_requires_owner(app, base_data, other_user):
    game_id = _create_game(app, base_data["user"].id, base_data["discipline"].id)
    other_client = _client_for(app, other_user)

    resp = other_client.put("/api/game/update", json={"game_id": game_id, "name": "Hacked"})
    assert resp.status_code == 403


def test_game_delete_requires_owner(app, base_data, other_user):
    game_id = _create_game(app, base_data["user"].id, base_data["discipline"].id)
    other_client = _client_for(app, other_user)

    resp = other_client.get("/api/game/delete", query_string={"game_id": game_id})
    assert resp.status_code == 403


def test_event_create_requires_owner(app, base_data, other_user):
    game_id = _create_game(app, base_data["user"].id, base_data["discipline"].id)
    other_client = _client_for(app, other_user)

    resp = other_client.post(
        "/api/event",
        json={
            "name": "E1",
            "game_id": game_id,
            "type": base_data["event_type"].id,
            "datetime": (datetime.now() + timedelta(hours=2)).strftime("%d.%m.%Y, %H:%M:%S"),
            "num_bets": 1,
            "points_correct_bet": 5,
            "allow_partial_points": True,
        },
    )
    assert resp.status_code == 403


def test_event_update_delete_require_owner(app, base_data, other_user):
    game_id = _create_game(app, base_data["user"].id, base_data["discipline"].id)
    event_id = _create_event(app, game_id, base_data["event_type"])

    other_client = _client_for(app, other_user)

    update_resp = other_client.put(
        "/api/event",
        json={
            "name": "Updated",
            "game_id": game_id,
            "type": base_data["event_type"].id,
            "datetime": (datetime.now() + timedelta(hours=3)).strftime("%d.%m.%Y, %H:%M:%S"),
            "event_id": event_id,
            "num_bets": 1,
            "points_correct_bet": 5,
            "allow_partial_points": True,
        },
    )
    assert update_resp.status_code == 403

    delete_resp = other_client.post("/api/event/delete", json={"event_id": event_id})
    assert delete_resp.status_code == 403


def test_save_bets_requires_membership(app, base_data, other_user):
    game_id = _create_game(app, base_data["user"].id, base_data["discipline"].id)
    event_id = _create_event(app, game_id, base_data["event_type"])
    non_member_client = _client_for(app, other_user)

    resp = non_member_client.post(
        "/api/event/save_bets",
        json={
            "event_id": event_id,
            "user_id": other_user,
            "predictions": [{"object_id": "a1", "predicted_place": 1, "object_name": "A"}],
        },
    )
    assert resp.status_code == 403


def test_process_results_requires_owner(app, base_data, other_user):
    game_id = _create_game(app, base_data["user"].id, base_data["discipline"].id)
    event_id = _create_event(app, game_id, base_data["event_type"])
    other_client = _client_for(app, other_user)

    resp = other_client.post(
        "/api/results",
        json={"event_id": event_id, "results": [{"id": "a1", "place": 1}]},
    )
    assert resp.status_code == 403
