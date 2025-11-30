import json
from src.utils import hash_password
from src.models.user import User
from src.models.game import Game


def test_game_get_all(client, base_data):
    response = client.get("/api/game")
    assert response.status_code == 200
    payload = json.loads(response.data)
    assert isinstance(payload, list)


def test_game_create_and_join(client, app, base_data):
    # create game with password
    payload = {"name": "Protected Game", "password": "123", "discipline": base_data["discipline"].id}
    response = client.post("/api/game", json=payload)
    assert response.status_code == 200
    created = json.loads(response.data)
    game_id = created["id"]

    # wrong password
    bad_join = client.get("/api/game/join", query_string={"user_id": base_data["second_user"].id, "game_id": game_id, "pw": "wrong"})
    assert bad_join.status_code == 400

    # correct password, but player is creator and already in game
    join = client.get("/api/game/join", query_string={"user_id": base_data["user"].id, "game_id": game_id, "pw": "123"})
    assert join.status_code == 400

    # correct password
    join = client.get("/api/game/join", query_string={"user_id": base_data["second_user"].id, "game_id": game_id, "pw": "123"})
    assert join.status_code == 200

    joined = json.loads(join.data)
    assert any(p["id"] == base_data["user"].id for p in joined["players"])


def test_game_update_and_delete(client, app, base_data):
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

    delete_resp = client.get("/api/game/delete", query_string={"game_id": game_id})
    assert delete_resp.status_code == 200
