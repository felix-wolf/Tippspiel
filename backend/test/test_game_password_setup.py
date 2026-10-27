import pytest

from src.database import db_manager
from src.models.game import Game
from src.utils import hash_game_password, password_hash_needs_upgrade


@pytest.fixture()
def legacy_game(base_data):
    success, game_id = Game.create(base_data["user"].id, "Legacy Game", None, base_data["discipline"].id)
    assert success
    return Game.get_by_id(game_id)


def other_client(app, base_data):
    client = app.test_client()
    assert client.post("/api/login", json={"name": base_data["second_user"].name, "password": "pw"}).status_code == 200
    return client


@pytest.mark.parametrize("password_payload", [{}, {"password": None}, {"password": ""}, {"password": " \t "},
                                               {"password": 123}, {"password": False}, {"password": []}, {"password": {}}])
def test_create_requires_valid_password(client, base_data, password_payload):
    response = client.post("/api/game", json={"name": "Invalid Game", "discipline": base_data["discipline"].id, **password_payload})
    assert response.status_code == 400
    assert db_manager.query("SELECT id FROM Games") == []


def test_new_game_requires_exact_password_for_joining(app, client, base_data):
    password = "  secret  "
    response = client.post("/api/game", json={"name": "Protected Game", "discipline": base_data["discipline"].id, "password": password})
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["pw_set"] is True
    assert "password" not in payload and "pw_hash" not in payload
    game = Game.get_by_id(payload["id"])
    assert not password_hash_needs_upgrade(game.pw_hash)
    assert game.pw_hash != password
    joiner = other_client(app, base_data)
    assert joiner.post("/api/game/join", json={"game_id": game.id, "password": password.strip()}).status_code == 400
    assert joiner.post("/api/game/join", json={"game_id": game.id, "password": password}).status_code == 200


@pytest.mark.parametrize("rename", [False, True])
def test_creator_can_set_initial_password(app, client, base_data, legacy_game, rename):
    legacy_game.add_player(base_data["second_user"])
    name = "Renamed Game" if rename else legacy_game.name
    response = client.put("/api/game/update", json={"game_id": legacy_game.id, "name": name, "password": "  new-secret  "})
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["pw_set"] is True
    assert payload["name"] == name
    assert "password" not in payload and "pw_hash" not in payload
    assert set(p["id"] for p in payload["players"]) == {base_data["user"].id, base_data["second_user"].id}
    updated = Game.get_by_id(legacy_game.id)
    assert updated.verify_password("  new-secret  ", app.config["SALT"])
    assert not updated.verify_password("new-secret", app.config["SALT"])
    listed = next(g for g in client.get("/api/game").get_json() if g["id"] == legacy_game.id)
    assert listed["pw_set"] is True


@pytest.mark.parametrize("password", [None, "", " \t ", 123, [], {}])
def test_invalid_setup_cannot_rename_game(client, legacy_game, password):
    response = client.put("/api/game/update", json={"game_id": legacy_game.id, "name": "Must Not Rename", "password": password})
    assert response.status_code == 400
    unchanged = Game.get_by_id(legacy_game.id)
    assert unchanged.name == legacy_game.name
    assert unchanged.pw_hash is None


@pytest.mark.parametrize("as_admin", [False, True])
def test_only_creator_can_set_password(app, client, admin_client, base_data, legacy_game, as_admin):
    actor = admin_client if as_admin else other_client(app, base_data)
    response = actor.put("/api/game/update", json={"game_id": legacy_game.id, "name": legacy_game.name, "password": "secret"})
    assert response.status_code == 403
    assert Game.get_by_id(legacy_game.id).pw_hash is None


def test_name_only_update_preserves_password(client, legacy_game):
    for protected in [False, True]:
        if protected:
            legacy_game.update_password_hash(hash_game_password("existing"))
        original_hash = Game.get_by_id(legacy_game.id).pw_hash
        response = client.put("/api/game/update", json={"game_id": legacy_game.id, "name": "Name Only"})
        assert response.status_code == 200
        assert Game.get_by_id(legacy_game.id).pw_hash == original_hash


def test_existing_password_cannot_be_replaced(client, legacy_game):
    original_hash = hash_game_password("existing")
    legacy_game.update_password_hash(original_hash)
    response = client.put("/api/game/update", json={"game_id": legacy_game.id, "name": "Must Not Rename", "password": "replacement"})
    assert response.status_code == 409
    unchanged = Game.get_by_id(legacy_game.id)
    assert unchanged.pw_hash == original_hash
    assert unchanged.name == legacy_game.name


def test_concurrent_setup_cannot_overwrite_password(client, legacy_game, monkeypatch):
    original_hash = hash_game_password("first-request")
    original_update = Game.update
    def race(self, name, pw_hash=None):
        # Simulate another request winning after the route loaded the game.
        self.update_password_hash(original_hash)
        return original_update(self, name, pw_hash=pw_hash)
    monkeypatch.setattr(Game, "update", race)
    response = client.put("/api/game/update", json={"game_id": legacy_game.id, "name": "Losing Name", "password": "second-request"})
    assert response.status_code == 409
    unchanged = Game.get_by_id(legacy_game.id)
    assert unchanged.pw_hash == original_hash
    assert unchanged.name == legacy_game.name


def test_migration_changes_future_joins(app, client, base_data, legacy_game):
    assert client.put("/api/game/update", json={"game_id": legacy_game.id, "name": legacy_game.name, "password": "secret"}).status_code == 200
    joiner = other_client(app, base_data)
    for payload in [{}, {"password": "wrong"}]:
        assert joiner.post("/api/game/join", json={"game_id": legacy_game.id, **payload}).status_code == 400
    assert joiner.post("/api/game/join", json={"game_id": legacy_game.id, "password": "secret"}).status_code == 200
