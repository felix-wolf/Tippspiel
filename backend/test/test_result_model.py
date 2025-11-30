from datetime import datetime, timedelta

from src.models.event import Event
from src.models.game import Game
from src.models.result import Result


def _create_event(base_data):
    game = Game(
        name="Result Game",
        pw_hash=None,
        discipline=base_data["discipline"],
        creator=base_data["user"],
        players=[base_data["user"]],
    )
    game.save_to_db()
    event = Event(
        name="Result Event",
        game_id=game.id,
        event_type=base_data["event_type"],
        dt=datetime.now() + timedelta(hours=1),
        allow_partial_points=True,
        num_bets=1,
        points_correct_bet=5,
    )
    event.save_to_db()
    return event


def test_result_save_and_get(base_data, app):
    with app.app_context():
        event = _create_event(base_data)
        result = Result(event_id=event.id, place=1, object_id="athlete-1", object_name="Athlete")
        result.save_to_db()

        results = Result.get_by_event_id(event.id)
        assert len(results) == 1
        assert results[0].object_id == "athlete-1"


def test_result_delete_by_event(base_data, app):
    with app.app_context():
        event = _create_event(base_data)
        result = Result(event_id=event.id, place=1, object_id="athlete-1", object_name="Athlete")
        result.save_to_db()

        deleted = Result.delete_by_event_id(event.id)
        assert deleted
        assert Result.get_by_event_id(event.id) == []
