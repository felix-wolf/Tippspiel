import json


def test_athlete_endpoint(client, base_data):
    response = client.get("/api/athletes")
    assert response.status_code == 200
    payload = json.loads(response.data)
    assert any(a["id"] == base_data["athlete"].id for a in payload)


def test_country_endpoint(client, base_data):
    response = client.get("/api/countries")
    assert response.status_code == 200
    payload = json.loads(response.data)
    assert any(c["code"] == base_data["country"].code for c in payload)


def test_discipline_endpoint(client, base_data):
    response = client.get("/api/disciplines")
    assert response.status_code == 200
    payload = json.loads(response.data)
    assert any(d["id"] == base_data["discipline"].id for d in payload)
