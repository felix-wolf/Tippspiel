import json
from datetime import datetime, timedelta

from src.models.event import Event
from src.models.game import Game
from src.models.notification_helper import NotificationHelper


def test_register_device(client, base_data):
    resp = client.post(
        "/api/notification/register_device",
        json={"token": "tok123", "platform": "ios"},
    )
    assert resp.status_code == 200
    payload = json.loads(resp.data)
    assert payload["token"] == "tok123"


def test_notification_settings_roundtrip(client, base_data):
    # try to set before registering device
    bad_set_resp = client.post(
        "/api/notification/settings",
        json={
            "platform": "ios",
            "setting": "results",
            "value": 1,
        },
    )
    assert bad_set_resp.status_code == 400
    # register device
    reg_resp = client.post(
        "/api/notification/register_device",
        json={"token": "tok123", "platform": "ios"},
    )
    assert reg_resp.status_code == 200
    # now set setting
    set_resp = client.post(
        "/api/notification/settings",
        json={
            "platform": "ios",
            "setting": "results",
            "value": 1,
        },
    )
    assert set_resp.status_code == 200

    get_resp = client.get(
        "/api/notification/settings",
        query_string={"platform": "ios"},
    )
    assert get_resp.status_code == 200
    payload = json.loads(get_resp.data)
    assert "results_notification" in payload


def test_register_device_rejects_malformed_json(client):
    resp = client.post(
        "/api/notification/register_device",
        data="{broken",
        content_type="application/json",
    )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Ungültige oder fehlende JSON-Daten."


def test_notification_settings_requires_platform_query(client):
    resp = client.get("/api/notification/settings")
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Die Plattform fehlt."


def test_notification_check_sends_due_reminder(client, app, base_data, monkeypatch):
    sent_notifications = []

    def fake_send_push_notification(token, title, body):
        sent_notifications.append((token, title, body))

    monkeypatch.setattr(NotificationHelper, "send_push_notification", staticmethod(fake_send_push_notification))

    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Reminder Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

        event = Event(
            name="Reminder Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(minutes=61),
            allow_partial_points=True,
        )
        event.save_to_db()

        NotificationHelper.save_to_db("tok123", base_data["user"].id, "ios")
        assert NotificationHelper.save_setting(
            user_id=base_data["user"].id,
            platform="ios",
            setting="reminder",
            value=True,
        )

    response = client.get("/api/notification/check")
    assert response.status_code == 200
    assert response.get_json()["status"] == "success"
    assert len(sent_notifications) == 1
    assert sent_notifications[0][0] == "tok123"
    assert sent_notifications[0][1] == "Reminder Event"
    assert "Rennen startet in einer Stunde" in sent_notifications[0][2]
