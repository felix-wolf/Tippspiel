import logging

from src.models.athlete import Athlete
from src.models.bet import Bet, Prediction
from src.models.country import Country
from src.models.discipline import Discipline
from src.models.event import Event
from src.models.event_type import EventType
from src.models.game import Game
from src.models.score_event import ScoreEvent
from src.models.user import User


def test_from_dict_logging_for_invalid_payloads(caplog):
    caplog.set_level(logging.WARNING)

    assert Athlete.from_dict({"id": "a1"}) is None
    assert Country.from_dict({"code": "DE"}) is None
    assert ScoreEvent.from_dict({"id": "s1"}) is None
    assert EventType.from_dict({"id": "et1"}) is None
    assert Prediction.from_dict({"id": "p1"}) is None
    assert Bet.from_dict({"id": "b1"}, predictions=[]) is None
    assert Discipline.from_dict({"id": "biathlon"}, event_types=[]) is None
    assert User.from_dict({"id": "u1"}) is None
    assert Game.from_dict({"id": "g1"}, discipline=None, creator=None, players=[]) is None
    assert Event.from_dict({"id": "e1"}, event_type=None) is None

    assert "Could not instantiate athlete" in caplog.text
    assert "Could not instantiate country" in caplog.text
    assert "Could not instantiate ScoreEvent" in caplog.text
    assert "Could not instantiate event type" in caplog.text
    assert "Could not instantiate prediction" in caplog.text
    assert "Could not instantiate bet" in caplog.text
    assert "Could not instantiate discipline" in caplog.text
    assert "Could not instantiate user" in caplog.text
    assert "Could not instantiate game" in caplog.text
    assert "Could not instantiate event" in caplog.text
