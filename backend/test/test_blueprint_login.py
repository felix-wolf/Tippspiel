import json

from src.models.password_reset_token import PasswordResetToken
from src.models.user import User
from src.utils import hash_password, password_hash_needs_upgrade


def test_register_endpoint_creates_user(client, app):
    payload = {"name": "newuser", "password": "secret", "email": "NewUser@Example.com "}
    response = client.post("/api/register", json=payload)
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["name"] == "newuser"
    assert data["email"] == "newuser@example.com"
    with app.app_context():
        user = User.get_by_name("newuser")
        assert user is not None
        assert not password_hash_needs_upgrade(user.pw_hash)
        assert user.email == "newuser@example.com"


def test_login_endpoint_success(client, app):
    with app.app_context():
        legacy_hash = hash_password("pw", app.config["SALT"])
        pw_hash = legacy_hash
        User.create("loginuser", pw_hash, email="login@example.com")
    response = client.post("/api/login", json={"name": "loginuser", "password": "pw"})
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["name"] == "loginuser"
    assert data["email"] == "login@example.com"
    with app.app_context():
        upgraded = User.get_by_name("loginuser")
        assert upgraded is not None
        assert upgraded.pw_hash != legacy_hash
        assert not password_hash_needs_upgrade(upgraded.pw_hash)


def test_login_endpoint_invalid_credentials(client):
    response = client.post("/api/login", json={"name": "invalid", "password": "pw"})
    assert response.status_code == 401
    assert response.get_json()["error"] == "Benutzername, E-Mail oder Passwort ist falsch."


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


def test_login_endpoint_accepts_email(client, app):
    with app.app_context():
        User.create("mail-login", hash_password("pw", app.config["SALT"]), email="mail-login@example.com")

    response = client.post("/api/login", json={"name": "mail-login@example.com", "password": "pw"})

    assert response.status_code == 200
    data = response.get_json()
    assert data["name"] == "mail-login"
    assert data["email"] == "mail-login@example.com"


def test_password_reset_request_creates_token_and_sends_email(client, app, base_data, monkeypatch):
    sent_messages = []

    def fake_send_password_reset_email(to_email, reset_token):
        sent_messages.append((to_email, reset_token))

    with app.app_context():
        assert base_data["user"].update_email("tester@example.com")

    app.config.update(
        {
            "RESEND_API_KEY": "re_test",
            "EMAIL_FROM": "Tippspiel <no-reply@example.com>",
            "APP_BASE_URL": "https://tippspiel.example.com",
        }
    )
    monkeypatch.setattr(
        "src.models.email_sender.EmailSender.send_password_reset_email",
        staticmethod(fake_send_password_reset_email),
    )

    response = client.post("/api/password-reset/request", json={"email": "Tester@Example.com"})

    assert response.status_code == 200
    assert len(sent_messages) == 1
    assert sent_messages[0][0] == "tester@example.com"
    assert len(sent_messages[0][1]) > 20


def test_password_reset_request_is_generic_for_unknown_email(client, app, monkeypatch):
    app.config.update(
        {
            "RESEND_API_KEY": "re_test",
            "EMAIL_FROM": "Tippspiel <no-reply@example.com>",
            "APP_BASE_URL": "https://tippspiel.example.com",
        }
    )

    called = {"count": 0}

    def fake_send_password_reset_email(to_email, reset_token):
        called["count"] += 1

    monkeypatch.setattr(
        "src.models.email_sender.EmailSender.send_password_reset_email",
        staticmethod(fake_send_password_reset_email),
    )

    response = client.post("/api/password-reset/request", json={"email": "unknown@example.com"})

    assert response.status_code == 200
    assert called["count"] == 0


def test_password_reset_confirm_updates_password(client, app, base_data):
    with app.app_context():
        token = PasswordResetToken.create_for_user(base_data["user"].id, ttl_minutes=30)

    response = client.post("/api/password-reset/confirm", json={"token": token, "password": "new-secret"})

    assert response.status_code == 200
    with app.app_context():
        assert User.authenticate("tester", "new-secret", app.config["SALT"]) is not None
        assert User.authenticate("tester", "pw", app.config["SALT"]) is None


def test_password_reset_confirm_rejects_invalid_or_used_token(client, app, base_data):
    with app.app_context():
        token = PasswordResetToken.create_for_user(base_data["user"].id, ttl_minutes=30)
        assert PasswordResetToken.consume(token, hash_password("new", app.config["SALT"])) is True

    response = client.post("/api/password-reset/confirm", json={"token": token, "password": "new-secret"})

    assert response.status_code == 400
    assert response.get_json()["error"] == "Der Reset-Link ist ungueltig oder abgelaufen."
