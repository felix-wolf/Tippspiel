import pytest
from datetime import datetime

from src.models.notification_helper import NotificationHelper


def test_save_and_get_token(client, base_data):
    resp = client.post(
        "/api/notification/register_device",
        json={"token": "tok123", "user_id": base_data["user"].id, "platform": "ios"},
    )
    assert resp.status_code == 200

    fetched = NotificationHelper.get_token(user_id=base_data["user"].id, platform="ios")
    assert fetched is not None
    assert fetched["device_token"] == "tok123"


def test_save_setting_updates_row(client, base_data):
    # ensure token exists
    client.post(
        "/api/notification/register_device",
        json={"token": "tok123", "user_id": base_data["user"].id, "platform": "ios"},
    )

    success = NotificationHelper.save_setting(user_id=base_data["user"].id, platform="ios", setting="results", value=True)
    assert success

    settings = NotificationHelper.get_notification_settings_for_user(user_id=base_data["user"].id, platform="ios")
    assert settings["results_notification"] == 1


def test_get_tokens_for_users_filters_by_flags(client, base_data):
    # register two tokens with different flags
    client.post(
        "/api/notification/register_device",
        json={"token": "tokA", "user_id": base_data["user"].id, "platform": "ios"},
    )
    other_user_id = base_data["second_user"].id
    # manually insert a second token with reminder flag on
    result = NotificationHelper.save_to_db(token="tokB", user_id=other_user_id, platform="android")
    assert result
    result = NotificationHelper.save_setting(user_id=other_user_id, platform="android", setting="reminder", value=True)
    assert result

    # only reminder-enabled tokens
    tokens = NotificationHelper.get_tokens_for_users([base_data["user"].id, other_user_id], check_reminder=True)
    assert len(tokens) == 1
    assert tokens[0]["device_token"] == "tokB"


def test_save_to_db_replaces_existing_token(client, base_data):
    client.post(
        "/api/notification/register_device",
        json={"token": "tok123", "user_id": base_data["user"].id, "platform": "ios"},
    )
    NotificationHelper.save_to_db(token="tok456", user_id=base_data["user"].id, platform="ios")

    tokens = NotificationHelper.get_tokens_for_users([base_data["user"].id])
    assert len(tokens) == 1
    assert tokens[0]["device_token"] == "tok456"
