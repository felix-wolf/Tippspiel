import json

from src.utils import hash_password
from src.models.user import User


def test_register_endpoint_creates_user(client, app):
    payload = {"name": "newuser", "password": "secret"}
    response = client.post("/api/register", json=payload)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["name"] == "newuser"


def test_login_endpoint_success(client, app):
    with app.app_context():
        pw_hash = hash_password("pw", app.config["SALT"])
        User.create("loginuser", pw_hash)
    response = client.post("/api/login", json={"name": "loginuser", "password": "pw"})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["name"] == "loginuser"


def test_login_endpoint_invalid_credentials(client):
    response = client.post("/api/login", json={"name": "invalid", "password": "pw"})
    assert response.status_code == 404
