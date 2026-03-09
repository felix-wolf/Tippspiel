import json
from datetime import datetime, timedelta

from src.models.event import Event
from src.models.game import Game
from src.models.user import User
from src.models.bet import Bet
from src.models.result import Result


def _create_game(app, base_data):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Event Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success
        return game_id


def _dt_string(hours_from_now=1):
    return (datetime.now() + timedelta(hours=hours_from_now)).strftime("%d.%m.%Y, %H:%M:%S")


def test_event_get_by_game(client, app, base_data):
    game_id = _create_game(app, base_data)
    # create an event directly
    with app.app_context():
        event = Event(
            name="Test Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=2),
            allow_partial_points=True,
            num_bets=1,
            points_correct_bet=5,
        )
        event.save_to_db()

    resp = client.get(f"/api/event?game_id={game_id}")
    assert resp.status_code == 200
    payload = json.loads(resp.data)
    assert len(payload) == 1
    assert payload[0]["name"] == "Test Event"


def test_event_create_and_update(client, base_data):
    game_id = client.post(
        "/api/game",
        json={"name": "Ev Game", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]

    create_resp = client.post(
        "/api/event",
        json={
            "name": "Event 1",
            "game_id": game_id,
            "type": base_data["event_type"].id,
            "datetime": _dt_string(),
            "num_bets": 1,
            "points_correct_bet": 5,
            "allow_partial_points": True,
        },
    )
    assert create_resp.status_code == 200
    created = create_resp.get_json()

    update_resp = client.put(
        "/api/event",
        json={
            "name": "Event 1 Updated",
            "game_id": game_id,
            "type": base_data["event_type"].id,
            "datetime": _dt_string(2),
            "event_id": created["id"],
            "num_bets": 1,
            "points_correct_bet": 3,
            "allow_partial_points": False,
        },
    )
    assert update_resp.status_code == 200
    updated = update_resp.get_json()
    assert updated["name"] == "Event 1 Updated"


def test_event_save_bets_validation(client, base_data):
    game_id = client.post(
        "/api/game",
        json={"name": "Bet Game", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]
    create_resp = client.post(
        "/api/event",
        json={
            "name": "Bet Event",
            "game_id": game_id,
            "type": base_data["event_type"].id,
            "datetime": _dt_string(),
            "num_bets": 2,
            "points_correct_bet": 5,
            "allow_partial_points": False,
        },
    )
    event_id = create_resp.get_json()["id"]

    # wrong number of predictions
    fail_resp = client.post(
        "/api/event/save_bets",
        json={"event_id": event_id, "predictions": [{"object_id": "a", "predicted_place": 1}]},
    )
    assert fail_resp.status_code == 400

    # correct number
    ok_resp = client.post(
        "/api/event/save_bets",
        json={
            "event_id": event_id,
            "predictions": [
                {"object_id": "a1", "predicted_place": 1, "object_name": "A"},
                {"object_id": "a2", "predicted_place": 2, "object_name": "B"},
            ],
        },
    )
    assert ok_resp.status_code == 200
    payload = ok_resp.get_json()
    assert payload["has_bets_for_users"] == [base_data["user"].id]


def test_creator_can_add_missing_bet_for_player_after_start(client, app, base_data):
    game_id = client.post(
        "/api/game",
        json={"name": "Sleepers Game", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]

    with app.app_context():
        game = Game.get_by_id(game_id)
        assert game is not None
        second_user = User.get_by_id(base_data["second_user"].id)
        assert second_user is not None
        assert game.add_player(second_user)
        event = Event(
            name="Started Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() - timedelta(hours=1),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=5,
        )
        event.save_to_db()
        event_id = event.id

    resp = client.post(
        "/api/event/save_bets",
        json={
            "event_id": event_id,
            "user_id": base_data["second_user"].id,
            "predictions": [{"object_id": "athlete-1", "predicted_place": 1, "object_name": "Franz Fischer"}],
        },
    )

    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["has_bets_for_users"] == [base_data["second_user"].id]

    with app.app_context():
        saved_bet = Bet.get_by_event_id_user_id(event_id, base_data["second_user"].id)
        assert saved_bet is not None
        assert [prediction.object_id for prediction in saved_bet.predictions] == ["athlete-1"]


def test_creator_cannot_edit_added_missing_bet(client, app, base_data):
    game_id = client.post(
        "/api/game",
        json={"name": "Locked Sleepers Game", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]

    with app.app_context():
        game = Game.get_by_id(game_id)
        assert game is not None
        second_user = User.get_by_id(base_data["second_user"].id)
        assert second_user is not None
        assert game.add_player(second_user)
        event = Event(
            name="Locked Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() - timedelta(hours=1),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=5,
        )
        event.save_to_db()
        event_id = event.id

    first_resp = client.post(
        "/api/event/save_bets",
        json={
            "event_id": event_id,
            "user_id": base_data["second_user"].id,
            "predictions": [{"object_id": "athlete-1", "predicted_place": 1, "object_name": "Franz Fischer"}],
        },
    )
    assert first_resp.status_code == 200

    second_resp = client.post(
        "/api/event/save_bets",
        json={
            "event_id": event_id,
            "user_id": base_data["second_user"].id,
            "predictions": [{"object_id": "changed-athlete", "predicted_place": 1, "object_name": "Changed Athlete"}],
        },
    )

    assert second_resp.status_code == 400

    with app.app_context():
        saved_bet = Bet.get_by_event_id_user_id(event_id, base_data["second_user"].id)
        assert saved_bet is not None
        assert [prediction.object_id for prediction in saved_bet.predictions] == ["athlete-1"]


def test_creator_cannot_add_missing_bet_before_start(client, app, base_data):
    game_id = client.post(
        "/api/game",
        json={"name": "Too Early Game", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]

    with app.app_context():
        game = Game.get_by_id(game_id)
        assert game is not None
        second_user = User.get_by_id(base_data["second_user"].id)
        assert second_user is not None
        assert game.add_player(second_user)
        event = Event(
            name="Upcoming Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=5,
        )
        event.save_to_db()
        event_id = event.id

    resp = client.post(
        "/api/event/save_bets",
        json={
            "event_id": event_id,
            "user_id": base_data["second_user"].id,
            "predictions": [{"object_id": "athlete-1", "predicted_place": 1, "object_name": "Franz Fischer"}],
        },
    )

    assert resp.status_code == 400


def test_creator_can_add_missing_bet_after_results_exist(client, app, base_data):
    game_id = client.post(
        "/api/game",
        json={"name": "Results Already Uploaded Game", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]

    with app.app_context():
        game = Game.get_by_id(game_id)
        assert game is not None
        second_user = User.get_by_id(base_data["second_user"].id)
        assert second_user is not None
        assert game.add_player(second_user)
        event = Event(
            name="Finished Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() - timedelta(hours=2),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=5,
        )
        event.save_to_db()
        result = Result(
            event_id=event.id,
            place=1,
            object_id="athlete-1",
            object_name="Franz Fischer",
        )
        result.save_to_db()
        event_id = event.id

    resp = client.post(
        "/api/event/save_bets",
        json={
            "event_id": event_id,
            "user_id": base_data["second_user"].id,
            "predictions": [{"object_id": "athlete-1", "predicted_place": 1, "object_name": "Franz Fischer"}],
        },
    )

    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["has_bets_for_users"] == [base_data["second_user"].id]
    assert payload["bets"][0]["score"] == 5
