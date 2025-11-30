from datetime import datetime

import pytest

from src.models.bet import Bet, Prediction
from src.models.event import Event
from src.models.event_type import EventType
from src.models.result import Result
from src.models.score_event import ScoreEvent
from src.models.user import User


def test_unimplemented_user_methods_raise(base_data):
    user = base_data["user"]
    with pytest.raises(NotImplementedError):
        user.save_to_db()
    with pytest.raises(NotImplementedError):
        User.get_all()
    with pytest.raises(NotImplementedError):
        User.get_base_data()


def test_unimplemented_bet_prediction_methods_raise():
    with pytest.raises(NotImplementedError):
        Prediction.get_all()
    with pytest.raises(NotImplementedError):
        Prediction.get_base_data()
    with pytest.raises(NotImplementedError):
        Bet.get_all()
    with pytest.raises(NotImplementedError):
        Bet.get_base_data()
    with pytest.raises(NotImplementedError):
        Bet.get_by_id()


def test_unimplemented_event_type_methods_raise(base_data):
    etype = base_data["event_type"]
    with pytest.raises(NotImplementedError):
        EventType.get_all()
    # ensure dataclass validation is strict for missing fields
    with pytest.raises(ValueError):
        EventType(name="", display_name="", discipline_id="", betting_on="")


def test_unimplemented_result_methods_raise():
    with pytest.raises(NotImplementedError):
        Result.get_base_data()
    with pytest.raises(NotImplementedError):
        Result.get_by_id()


def test_unimplemented_event_methods_raise():
    with pytest.raises(NotImplementedError):
        Event.get_base_data()


def test_unimplemented_score_event_methods_raise():
    score_event = ScoreEvent(id="1", game_id="g1", name="n", dt=datetime.now())
    with pytest.raises(NotImplementedError):
        ScoreEvent.get_all()
    with pytest.raises(NotImplementedError):
        ScoreEvent.get_base_data()
    with pytest.raises(NotImplementedError):
        ScoreEvent.get_by_id()
    with pytest.raises(NotImplementedError):
        score_event.save_to_db()
