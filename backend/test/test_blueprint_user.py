import json


def test_user_get_current(client, base_data):
    resp = client.get("/api/user")
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["id"] == base_data["user"].id
    assert payload["is_admin"] is False
    assert payload["email"] is None


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
    resp = client.post("/api/user", json={"color": "#abcdef"})
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["color"] == "#abcdef"


def test_admin_user_get_current(admin_client, admin_user):
    resp = admin_client.get("/api/user")
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["id"] == admin_user.id
    assert payload["is_admin"] is True


def test_user_update_email(client, app, base_data):
    resp = client.post("/api/user/email", json={"email": " Tester@Example.com "})
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["email"] == "tester@example.com"

    with app.app_context():
        updated = base_data["user"].get_by_id(base_data["user"].id)
        assert updated.email == "tester@example.com"
