from datetime import datetime, timedelta

from src.models.bet import Bet, Prediction
from src.models.event import Event
from src.models.game import Game
from src.models.result import Result
from src.models.score_event import ScoreEvent


def test_score_event_returns_scored_events(base_data, app):
    with app.app_context():
        game = Game(
            name="Score Game",
            pw_hash=None,
            discipline=base_data["discipline"],
            creator=base_data["user"],
            players=[base_data["user"]],
        )
        game.save_to_db()
        event = Event(
            name="Scored Event",
            game_id=game.id,
            event_type=base_data["event_type"],
            dt=datetime.now() - timedelta(hours=1),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=5,
        )
        event.save_to_db()

        bet = Bet(
            user_id=base_data["user"].id,
            event_id=event.id,
            predictions=[],
            score=None,
        )
        bet.predictions = [
            Prediction(bet_id=bet.id, object_id="athlete-1", object_name="Athlete", predicted_place=1)
        ]
        bet.save_to_db()

        result = Result(event_id=event.id, place=1, object_id="athlete-1", object_name="Athlete")
        result.save_to_db()

        bet.calc_score([result], points_correct_bet=5, allow_partial_points=False)

        score_events = ScoreEvent.get_all_by_game_id(game.id)
        assert len(score_events) == 1
        assert list(score_events[0].scores.values()) == [5]
