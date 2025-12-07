from datetime import datetime, timedelta

from src.models.bet import Bet
from src.models.event import Event
from src.models.event_type import EventType
from src.models.game import Game


def _create_game(app, base_data):
    game = Game(
        name="Event Game",
        pw_hash=None,
        discipline=base_data["discipline"],
        creator=base_data["user"],
        players=[base_data["user"]],
    )
    game.save_to_db()
    return game


def test_event_create_and_get(base_data, app):
    with app.app_context():
        game = _create_game(app, base_data)
        success, event_id, event_obj = Event.create(
            name="Qualifier",
            game_id=game.id,
            event_type_id=base_data["event_type"].id,
            dt=datetime.now() + timedelta(hours=2),
            num_bets=1,
            points_correct_bet=5,
            allow_partial_points=True,
            url="http://example.com/event"
        )
        assert success
        fetched = Event.get_by_id(event_id, get_full_object=False)
        assert fetched is not None
        assert fetched.name == "Qualifier"
        assert fetched.url == "http://example.com/event"
        assert isinstance(fetched.event_type, EventType)


def test_event_save_bet_and_has_bets(base_data, app):
    with app.app_context():
        game = _create_game(app, base_data)
        event = Event(
            name="Final",
            game_id=game.id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=3),
            allow_partial_points=True,
            num_bets=1,
            points_correct_bet=5,
        )
        event.save_to_db()

        success, _ = event.save_bet(
            user_id=base_data["user"].id,
            predictions=[{"object_id": "athlete-123", "predicted_place": 1, "object_name": "Unknown"}],
        )
        assert success

        refreshed = Event.get_by_id(event.id)
        assert refreshed is not None
        assert len(refreshed.bets) == 1
        assert refreshed.has_bets_for_users == [base_data["user"].id]
