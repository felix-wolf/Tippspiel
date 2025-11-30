import json
from datetime import datetime, timedelta

from src.models.event import Event
from src.models.game import Game


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
        json={"event_id": event_id, "user_id": base_data["user"].id, "predictions": [{"object_id": "a", "predicted_place": 1}]},
    )
    assert fail_resp.status_code == 400

    # correct number
    ok_resp = client.post(
        "/api/event/save_bets",
        json={
            "event_id": event_id,
            "user_id": base_data["user"].id,
            "predictions": [
                {"object_id": "a1", "predicted_place": 1, "object_name": "A"},
                {"object_id": "a2", "predicted_place": 2, "object_name": "B"},
            ],
        },
    )
    assert ok_resp.status_code == 200
    payload = ok_resp.get_json()
    assert payload["has_bets_for_users"] == [base_data["user"].id]
