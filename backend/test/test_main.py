import pytest
from main import create_app
import json
from src.models.event import Event
from src.models.game import Game
from src.models.discipline import Discipline
from src.models.user import User
from src.models.result import Result
from src.models.bet import Prediction
from src.models.bet import Bet
from src.models.score_event import ScoreEvent
from datetime import datetime

@pytest.fixture()
def app():
    app = create_app("test")
    app.config.update({
        "TESTING": True,
        "LOGIN_DISABLED": True
    })

    # other setup can go here
    with app.app_context():
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

def test_game_get_all(client):
    response = client.get("/api/game")
    assert response.status_code == 200

def test_game_get_all(client):
    games = Game.get_all() 
    assert games is not None and games != []

def test_events_get_all(client):
    events = Event.get_all() 
    assert events is not None and events != []

def test_event_get_by_game_id(client):
    games = Game.get_all() 
    events = Event.get_all_by_game_id(games[3].id, get_full_objects=True)
    assert events is not None and events != []

def test_init_result(client):
    result = Result(event_id="", place=1, object_id="", object_name="", result_id="")
    assert result is not None

def test_init_prediction():
    pred = Prediction(
        bet_id="",
        object_id="",
        object_name="",
        predicted_place="",
    )
    assert pred is not None

def test_init_bet():
    bet = Bet(
        user_id="",
        event_id=""
        )
    assert bet is not None

def test_init_score_event():
    s_event = ScoreEvent(
        id="",
        game_id="",
        name="",
        dt=datetime.now(),
        scores=[]
    )