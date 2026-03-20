import json
from datetime import timedelta

from src.models.event import Event
from src.models.game import Game
from src.models.user import User
from src.models.bet import Bet
from src.models.result import Result
from src.utils import hash_password


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
    return (Event.current_time() + timedelta(hours=hours_from_now)).strftime("%d.%m.%Y, %H:%M:%S")


def _create_admin_client(app):
    with app.app_context():
        success, admin_user_id = User.create("event_admin", hash_password("pw", app.config["SALT"]))
        assert success
        admin_user = User.get_by_id(admin_user_id)
        assert admin_user is not None
        assert admin_user.update_admin_flag(True)
    admin_client = app.test_client()
    with admin_client.session_transaction() as sess:
        sess.clear()
        sess["_user_id"] = admin_user_id
    whoami = admin_client.get("/api/user")
    assert whoami.status_code == 200
    assert whoami.get_json()["is_admin"] is True
    return admin_client


def test_event_get_by_game(client, app, base_data):
    game_id = _create_game(app, base_data)
    # create an event directly
    with app.app_context():
        event = Event(
            name="Test Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=Event.current_time() + timedelta(hours=2),
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


def test_event_get_by_game_includes_users_with_bets(client, app, base_data):
    game_id = _create_game(app, base_data)
    with app.app_context():
        event = Event(
            name="Event With Bets",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=Event.current_time() + timedelta(hours=2),
            allow_partial_points=True,
            num_bets=1,
            points_correct_bet=5,
        )
        event.save_to_db()
        success, _ = event.save_bet(
            base_data["user"].id,
            [{"object_id": base_data["athlete"].id, "predicted_place": 1, "object_name": "Franz Fischer"}],
        )
        assert success

    resp = client.get(f"/api/event?game_id={game_id}")

    assert resp.status_code == 200
    payload = resp.get_json()
    assert len(payload) == 1
    assert payload[0]["has_bets_for_users"] == [base_data["user"].id]


def test_event_create_and_update_are_admin_only(client, base_data):
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
    assert create_resp.status_code == 403
    assert create_resp.get_json()["error"] == "Du bist für diese Aktion nicht berechtigt."

    update_resp = client.put(
        "/api/event",
        json={
            "name": "Event 1 Updated",
            "game_id": game_id,
            "type": base_data["event_type"].id,
            "datetime": _dt_string(2),
            "event_id": "event-1",
            "num_bets": 1,
            "points_correct_bet": 3,
            "allow_partial_points": False,
        },
    )
    assert update_resp.status_code == 403
    assert update_resp.get_json()["error"] == "Du bist für diese Aktion nicht berechtigt."

    delete_resp = client.delete("/api/event/delete", json={"event_id": "event-1"})
    assert delete_resp.status_code == 403
    assert delete_resp.get_json()["error"] == "Du bist für diese Aktion nicht berechtigt."


def test_event_import_is_idempotent_for_existing_official_event(client, app, base_data):
    game_id = client.post(
        "/api/game",
        json={"name": "Import Game", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]

    with app.app_context():
        imported_event = Event(
            name="Oberhof (GER) - Women Sprint",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=Event.current_time() + timedelta(hours=2),
            allow_partial_points=True,
            location="Oberhof (GER)",
            race_format="sprint",
            source_provider="ibu",
            source_event_id="event-123",
            source_race_id="race-123",
            season_id="2526",
            url="https://www.biathlonworld.com/results/race-123",
        )
        payload = imported_event.to_dict()

    first_resp = client.post("/api/event", json={"events": [json.dumps(payload)]})
    assert first_resp.status_code == 200

    second_resp = client.post("/api/event", json={"events": [json.dumps(payload)]})
    assert second_resp.status_code == 200

    events_resp = client.get(f"/api/event?game_id={game_id}")
    assert events_resp.status_code == 200
    events_payload = events_resp.get_json()
    assert len(events_payload) == 1
    assert events_payload[0]["source_race_id"] == "race-123"
    assert events_payload[0]["season_id"] == "2526"
    assert events_payload[0]["shared_event_id"] == "official:ibu:race-123"


def test_official_event_import_is_shared_across_games(client, app, base_data):
    first_game_id = client.post(
        "/api/game",
        json={"name": "Import Game 1", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]
    second_game_id = client.post(
        "/api/game",
        json={"name": "Import Game 2", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]

    with app.app_context():
        payloads = []
        for game_id in [first_game_id, second_game_id]:
            imported_event = Event(
                name="Oberhof (GER) - Women Sprint",
                game_id=game_id,
                event_type=base_data["event_type"],
                dt=Event.current_time() + timedelta(hours=2),
                allow_partial_points=True,
                location="Oberhof (GER)",
                race_format="sprint",
                source_provider="ibu",
                source_event_id="event-123",
                source_race_id="race-123",
                season_id="2526",
                url="https://www.biathlonworld.com/results/race-123",
            )
            payloads.append(json.dumps(imported_event.to_dict()))

    for payload in payloads:
        response = client.post("/api/event", json={"events": [payload]})
        assert response.status_code == 200

    first_events = client.get(f"/api/event?game_id={first_game_id}").get_json()
    second_events = client.get(f"/api/event?game_id={second_game_id}").get_json()

    assert len(first_events) == 1
    assert len(second_events) == 1
    assert first_events[0]["shared_event_id"] == second_events[0]["shared_event_id"]
    assert first_events[0]["id"] != second_events[0]["id"]


def test_admin_can_create_update_and_delete_event(client, app, base_data):
    admin_client = _create_admin_client(app)
    game_id = client.post(
        "/api/game",
        json={"name": "Admin Managed Game", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]

    create_resp = admin_client.post(
        "/api/event",
        json={
            "name": "Admin Event",
            "game_id": game_id,
            "type": base_data["event_type"].id,
            "datetime": _dt_string(),
            "num_bets": 2,
            "points_correct_bet": 7,
            "allow_partial_points": True,
        },
    )
    assert create_resp.status_code == 200
    created = create_resp.get_json()
    assert created["name"] == "Admin Event"

    update_resp = admin_client.put(
        "/api/event",
        json={
            "name": "Admin Event Updated",
            "game_id": game_id,
            "type": base_data["event_type"].id,
            "datetime": _dt_string(2),
            "event_id": created["id"],
            "num_bets": 3,
            "points_correct_bet": 9,
            "allow_partial_points": False,
        },
    )
    assert update_resp.status_code == 200
    updated = update_resp.get_json()
    assert updated["name"] == "Admin Event Updated"
    assert updated["num_bets"] == 3
    assert updated["points_correct_bet"] == 9
    assert updated["allow_partial_points"] is False

    delete_resp = admin_client.delete("/api/event/delete", json={"event_id": created["id"]})
    assert delete_resp.status_code == 200
    assert delete_resp.get_json()["deleted_id"] == created["id"]

    events_resp = client.get(f"/api/event?game_id={game_id}")
    assert events_resp.status_code == 200
    assert events_resp.get_json() == []


def test_admin_can_import_official_event_into_foreign_game(client, app, base_data):
    admin_client = _create_admin_client(app)
    game_id = client.post(
        "/api/game",
        json={"name": "Foreign Game", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]

    with app.app_context():
        imported_event = Event(
            name="Nove Mesto - Men Sprint",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=Event.current_time() + timedelta(hours=2),
            allow_partial_points=True,
            location="Nove Mesto",
            race_format="sprint",
            source_provider="ibu",
            source_event_id="event-foreign",
            source_race_id="race-foreign",
            season_id="2526",
            url="https://www.biathlonworld.com/results/race-foreign",
        )
        payload = json.dumps(imported_event.to_dict())

    response = admin_client.post("/api/event", json={"events": [payload]})
    assert response.status_code == 200

    events_resp = client.get(f"/api/event?game_id={game_id}")
    assert events_resp.status_code == 200
    assert len(events_resp.get_json()) == 1


def test_admin_update_of_shared_event_affects_all_linked_game_events(client, app, base_data):
    admin_client = _create_admin_client(app)
    first_game_id = client.post(
        "/api/game",
        json={"name": "Shared Edit Game 1", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]
    second_game_id = client.post(
        "/api/game",
        json={"name": "Shared Edit Game 2", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]

    with app.app_context():
        event_ids = []
        for game_id in [first_game_id, second_game_id]:
            imported_event = Event(
                name="Original Name",
                game_id=game_id,
                event_type=base_data["event_type"],
                dt=Event.current_time() + timedelta(hours=2),
                allow_partial_points=True,
                location="Oberhof",
                race_format="sprint",
                source_provider="ibu",
                source_event_id="event-shared",
                source_race_id="race-shared",
                season_id="2526",
                url="https://www.biathlonworld.com/results/race-shared",
            )
            imported_event.save_to_db()
            event_ids.append(imported_event.id)

    update_resp = admin_client.put(
        "/api/event",
        json={
            "name": "Updated Shared Name",
            "game_id": first_game_id,
            "type": base_data["event_type"].id,
            "datetime": _dt_string(3),
            "event_id": event_ids[0],
            "num_bets": 5,
            "points_correct_bet": 5,
            "allow_partial_points": True,
            "location": "Antholz",
            "race_format": "individual",
        },
    )
    assert update_resp.status_code == 200

    first_events = client.get(f"/api/event?game_id={first_game_id}").get_json()
    second_events = client.get(f"/api/event?game_id={second_game_id}").get_json()

    assert first_events[0]["name"] == "Updated Shared Name"
    assert second_events[0]["name"] == "Updated Shared Name"
    assert first_events[0]["location"] == "Antholz"
    assert second_events[0]["location"] == "Antholz"
    assert first_events[0]["race_format"] == "individual"
    assert second_events[0]["race_format"] == "individual"


def test_event_save_bets_validation(client, base_data):
    game_id = client.post(
        "/api/game",
        json={"name": "Bet Game", "password": None, "discipline": base_data["discipline"].id},
    ).get_json()["id"]
    with client.application.app_context():
        event = Event(
            name="Bet Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=Event.current_time() + timedelta(hours=1),
            allow_partial_points=False,
            num_bets=2,
            points_correct_bet=5,
        )
        event.save_to_db()
        event_id = event.id

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
            dt=Event.current_time() - timedelta(hours=1),
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
            dt=Event.current_time() - timedelta(hours=1),
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
            dt=Event.current_time() + timedelta(hours=1),
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
            dt=Event.current_time() - timedelta(hours=2),
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
