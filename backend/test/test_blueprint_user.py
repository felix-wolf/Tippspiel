import json


def test_user_get_current(client, base_data):
    resp = client.get("/api/user")
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["id"] == base_data["user"].id


def test_user_get_players_by_game(client, base_data, app):
    # game is created when calling /api/game
    game_resp = client.post(
        "/api/game",
        json={"name": "Player Game", "password": None, "discipline": base_data["discipline"].id},
    )
    game_id = game_resp.get_json()["id"]
    resp = client.get("/api/user", query_string={"game_id": game_id})
    assert resp.status_code == 200
    players = resp.get_json()
    assert any(p["id"] == base_data["user"].id for p in players)


def test_user_update_color(client, base_data):
    resp = client.post("/api/user", json={"user_id": base_data["user"].id, "color": "#abcdef"})
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["color"] == "#abcdef"
