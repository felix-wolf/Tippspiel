import json

from src.models.user import User
from src.utils import hash_password, password_hash_needs_upgrade


def test_register_endpoint_creates_user(client, app):
    payload = {"name": "newuser", "password": "secret"}
    response = client.post("/api/register", json=payload)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["name"] == "newuser"
    with app.app_context():
        user = User.get_by_name("newuser")
        assert user is not None
        assert not password_hash_needs_upgrade(user.pw_hash)


def test_login_endpoint_success(client, app):
    with app.app_context():
        legacy_hash = hash_password("pw", app.config["SALT"])
        pw_hash = legacy_hash
        User.create("loginuser", pw_hash)
    response = client.post("/api/login", json={"name": "loginuser", "password": "pw"})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["name"] == "loginuser"
    with app.app_context():
        upgraded = User.get_by_name("loginuser")
        assert upgraded is not None
        assert upgraded.pw_hash != legacy_hash
        assert not password_hash_needs_upgrade(upgraded.pw_hash)


def test_login_endpoint_invalid_credentials(client):
    response = client.post("/api/login", json={"name": "invalid", "password": "pw"})
    assert response.status_code == 401
    assert response.get_json()["error"] == "Benutzername oder Passwort ist falsch."


def test_login_rejects_malformed_json(client):
    response = client.post(
        "/api/login",
        data="{invalid",
        content_type="application/json",
    )
    assert response.status_code == 400
    assert response.get_json()["error"] == "Ungültige oder fehlende JSON-Daten."


def test_login_endpoint_returns_admin_flag_for_admin_user(admin_client, app):
    with app.app_context():
        response = admin_client.post("/api/login", json={"name": "admin_user", "password": "pw"})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["name"] == "admin_user"
    assert data["is_admin"] is True
