import json


def test_status_endpoint(client):
    response = client.get("/api/status")
    assert response.status_code == 200
    payload = json.loads(response.data)
    assert "Time" in payload
