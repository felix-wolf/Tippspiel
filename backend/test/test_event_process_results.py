from datetime import datetime

import pytest

from main import create_app
from src.database import db_manager
from src.models.bet import Bet, Prediction
from src.models.discipline import Biathlon, Discipline
from src.models.event import Event
from src.models.event_type import EventType
from src.models.game import Game
from src.models.result import Result
from src.models.user import User
from src.utils import hash_password


def test_process_results_rolls_back_on_error(app):
    with app.app_context():
        discipline = Biathlon(
            discipline_id="biathlon",
            name="Biathlon",
            event_types=[],
            result_url="http://example.com/results",
            events_url="http://example.com/events",
        )
        discipline.save_to_db()

        event_type = EventType(
            name="sprint",
            display_name="Sprint",
            discipline_id=discipline.id,
            betting_on="athletes",
        )
        event_type.save_to_db()

        success, user_id = User.create("alice", hash_password("pw", app.config["SALT"]))
        assert success
        user = User.get_by_id(user_id)

        game = Game(name="Test Game", pw_hash=None, discipline=discipline, creator=user, players=[user])
        game.save_to_db()

        event = Event(
            name="Test Event",
            game_id=game.id,
            event_type=event_type,
            dt=datetime.now(),
            allow_partial_points=True,
            num_bets=1,
            points_correct_bet=5,
        )
        event.save_to_db()

        bet = Bet(user_id=user.id, event_id=event.id)
        prediction = Prediction(bet_id=bet.id, object_id="athlete-1", object_name="Athlete 1", predicted_place=1)
        bet.predictions = [prediction]
        bet.save_to_db()
        event.bets = [bet]

        original_result = Result(event_id=event.id, place=1, object_id="athlete-1", object_name="Athlete 1")
        original_result.save_to_db()

        invalid_result = Result(event_id=event.id, place=None, object_id="athlete-2", object_name="Broken Result")

        success, error = event.process_results([invalid_result])

        persisted_results = Result.get_by_event_id(event.id)
        persisted_bet = Bet.get_by_event_id_user_id(event.id, user.id)

        assert success is False
        assert error is not None
        assert len(persisted_results) == 1
        assert persisted_results[0].object_id == "athlete-1"
        assert persisted_bet.score is None
        assert all(pred.actual_place is None for pred in persisted_bet.predictions)
