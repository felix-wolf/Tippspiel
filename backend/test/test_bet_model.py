from datetime import datetime, timedelta

from src.models.bet import Bet, Prediction
from src.models.event import Event
from src.models.result import Result
from src.models.game import Game


def _create_event(base_data):
    game = Game(
        name="Bet Game",
        pw_hash=None,
        discipline=base_data["discipline"],
        creator=base_data["user"],
        players=[base_data["user"]],
    )
    game.save_to_db()
    event = Event(
        name="Bet Event",
        game_id=game.id,
        event_type=base_data["event_type"],
        dt=datetime.now() + timedelta(hours=1),
        allow_partial_points=False,
        num_bets=1,
        points_correct_bet=5,
    )
    event.save_to_db()
    return event


def test_bet_save_and_score(base_data, app):
    with app.app_context():
        event = _create_event(base_data)
        athlete = base_data["athlete"]
        bet = Bet(
            user_id=base_data["user"].id,
            event_id=event.id,
            predictions=[],
            score=None,
        )
        bet.predictions = [
            Prediction(
                bet_id=bet.id,
                object_id=athlete.id,
                object_name=athlete.last_name,
                predicted_place=1,
            )
        ]
        bet.save_to_db()

        results = [
            Result(
                event_id=event.id,
                place=1,
                object_id="athlete-1",
                object_name="Athlete",
            )
        ]
        # Save results so view can join
        for res in results:
            res.save_to_db()

        calc_success = bet.calc_score(results, points_correct_bet=5, allow_partial_points=False)
        assert calc_success

        persisted = Bet.get_by_event_id_user_id(event.id, base_data["user"].id)
        assert persisted.score == 5
        assert persisted.predictions[0].actual_place == 1
