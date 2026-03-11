import json
from datetime import datetime, timedelta

from flask_login import login_user

from src.blueprints.game import join_game
from src.models.event import Event
from src.models.game import Game
from src.models.user import User
from src.utils import hash_game_password, hash_password, password_hash_needs_upgrade


def _login_client(app, name, password="pw"):
    client = app.test_client()
    response = client.post("/api/login", json={"name": name, "password": password})
    assert response.status_code == 200
    return client


def test_game_get_all(app, base_data):
    client = _login_client(app, base_data["user"].name)
    response = client.get("/api/game")
    assert response.status_code == 200
    payload = json.loads(response.data)
    assert isinstance(payload, list)


def test_game_create_and_join(app, base_data):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Protected Game",
            pw_hash=hash_game_password("123"),
            discipline_name=base_data["discipline"].id,
        )
        assert success
        created_game = Game.get_by_id(game_id)
        assert created_game is not None
        assert not password_hash_needs_upgrade(created_game.pw_hash)

        other_user = User.get_by_id(base_data["second_user"].id)
        owner_user = User.get_by_id(base_data["user"].id)

    with app.test_request_context(
        "/api/game/join",
        method="POST",
        json={"game_id": game_id, "password": "wrong"},
    ):
        login_user(other_user)
        bad_join = app.make_response(join_game())
        assert bad_join.status_code == 400

    with app.test_request_context(
        "/api/game/join",
        method="POST",
        json={"game_id": game_id, "password": "123"},
    ):
        login_user(owner_user)
        join = app.make_response(join_game())
        assert join.status_code == 400

    with app.test_request_context(
        "/api/game/join",
        method="POST",
        json={"game_id": game_id, "password": "123"},
    ):
        login_user(other_user)
        join = app.make_response(join_game())
        assert join.status_code == 200
        joined = join.get_json()
        assert any(p["id"] == base_data["user"].id for p in joined["players"])
        assert any(p["id"] == base_data["second_user"].id for p in joined["players"])


def test_join_game_upgrades_legacy_password_hash(app, base_data):
    other_client = _login_client(app, base_data["second_user"].name)

    with app.app_context():
        legacy_hash = hash_password("123", app.config["SALT"])
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Legacy Protected Game",
            pw_hash=legacy_hash,
            discipline_name=base_data["discipline"].id,
        )
        assert success

    join = other_client.post(
        "/api/game/join",
        json={"game_id": game_id, "password": "123"},
    )
    assert join.status_code == 200

    with app.app_context():
        upgraded_game = Game.get_by_id(game_id)
        assert upgraded_game is not None
        assert upgraded_game.pw_hash != legacy_hash
        assert not password_hash_needs_upgrade(upgraded_game.pw_hash)


def test_join_game_ignores_spoofed_user_id(app, base_data):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Spoof Test Game",
            pw_hash=hash_game_password("123"),
            discipline_name=base_data["discipline"].id,
        )
        assert success
        other_user = User.get_by_id(base_data["second_user"].id)

    with app.test_request_context(
        "/api/game/join",
        method="POST",
        json={"user_id": base_data["user"].id, "game_id": game_id, "password": "123"},
    ):
        login_user(other_user)
        join = app.make_response(join_game())
        assert join.status_code == 200
        joined = join.get_json()
        assert any(p["id"] == base_data["second_user"].id for p in joined["players"])


def test_game_update_and_delete(app, base_data):
    client = _login_client(app, base_data["user"].name)

    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Old Name",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success
    update_resp = client.put("/api/game/update", json={"game_id": game_id, "name": "New Name"})
    assert update_resp.status_code == 200
    updated = json.loads(update_resp.data)
    assert updated["name"] == "New Name"

    delete_resp = client.delete("/api/game/delete", json={"game_id": game_id})
    assert delete_resp.status_code == 200


def test_join_game_requires_password_field(client, base_data):
    response = client.post("/api/game", json={"name": "Join Test", "password": "123", "discipline": base_data["discipline"].id})
    assert response.status_code == 200
    game_id = response.get_json()["id"]

    other_client = _login_client(client.application, base_data["second_user"].name)
    join_resp = other_client.post("/api/game/join", json={"game_id": game_id})
    assert join_resp.status_code == 400
    assert join_resp.get_json()["error"] == "Erforderliche Angaben fehlen."


def test_game_events_import_url_route_is_removed(client):
    response = client.get(
        "/api/game/events",
        query_string={"game_id": "missing", "url": "https://example.com/events/world-cup"},
    )

    assert response.status_code == 404


def test_game_importable_events_returns_official_candidates(client, app, base_data, monkeypatch):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Importable Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

    imported_event = Event(
        name="Oberhof - Women Mass Start",
        game_id=game_id,
        event_type=base_data["event_type"],
        dt=datetime.now() + timedelta(days=1),
        allow_partial_points=True,
        source_provider="ibu",
        source_event_id="event-123",
        source_race_id="race-123",
        season_id="2526",
    )

    def fake_fetch_importable_events(self, game_id, now=None):
        assert game_id == imported_event.game_id
        return [imported_event], None

    from src.models.discipline import Biathlon
    monkeypatch.setattr(Biathlon, "fetch_importable_events", fake_fetch_importable_events)

    response = client.get(
        "/api/game/events/importable",
        query_string={"game_id": game_id},
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload[0]["source_provider"] == "ibu"
    assert payload[0]["source_race_id"] == "race-123"
    assert payload[0]["season_id"] == "2526"


def test_admin_can_fetch_importable_events_for_foreign_game(admin_client, app, base_data, monkeypatch):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Foreign Importable Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

    imported_event = Event(
        name="Nove Mesto - Women Sprint",
        game_id=game_id,
        event_type=base_data["event_type"],
        dt=datetime.now() + timedelta(days=1),
        allow_partial_points=True,
        source_provider="ibu",
        source_event_id="event-456",
        source_race_id="race-456",
        season_id="2526",
    )

    def fake_fetch_importable_events(self, game_id, now=None):
        assert game_id == imported_event.game_id
        return [imported_event], None

    from src.models.discipline import Biathlon
    monkeypatch.setattr(Biathlon, "fetch_importable_events", fake_fetch_importable_events)

    response = admin_client.get(
        "/api/game/events/importable",
        query_string={"game_id": game_id},
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload[0]["source_provider"] == "ibu"
    assert payload[0]["source_race_id"] == "race-456"
