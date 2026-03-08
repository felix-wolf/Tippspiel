import json


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
