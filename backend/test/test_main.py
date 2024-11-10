import pytest
from main import create_app
from src.models.event import Event
from src.models.game import Game

@pytest.fixture()
def app():
    app = create_app("test")
    app.config.update({
        "TESTING": True,
        "LOGIN_DISABLED": True
    })

    # other setup can go here
    yield app
    # clean up / reset resources here

@pytest.fixture()
def client(app):
    return app.test_client()

def test_athlete_endpoint(client):
    response = client.get("/api/athletes")
    assert response.status_code == 200

def test_countries_endpoint(client):
    response = client.get("/api/countries")
    assert response.status_code == 200

def test_disciplines_endpoint(client):
    response = client.get("/api/disciplines")
    assert response.status_code == 200

def test_game_get_all():
    assert Game.get_all() is not None

def test_event_get_by_id():
    games = Game.get_all()
    events = Event.get_all_by_game_id(games[0].id, get_full_objects=True)
    assert events is not None

def test_event_endpoint(client):
    games = Game.get_all()
    events = Event.get_all_by_game_id(games[0].id, get_full_objects=True)
    response = client.get(f"/api/event?event_id={events[0].id}")
    assert response.status_code == 200