import json
from datetime import datetime, timedelta

from src.models.bet import Bet, Prediction
from src.models.event import Event
from src.models.game import Game
from src.models.result import Result
from src.models.score_event import ScoreEvent


def _create_event_with_bet(app, base_data):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Result Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success
        event = Event(
            name="Result Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
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
            Prediction(
                bet_id=bet.id,
                object_id=base_data["athlete"].id,
                object_name="Athlete",
                predicted_place=1,
            )
        ]
        bet.save_to_db()
        event.bets = [bet]
        return game_id, event.id


def test_process_results_endpoint_updates_scores(client, app, base_data):
    game_id, event_id = _create_event_with_bet(app, base_data)

    resp = client.post(
        "/api/results",
        json={
            "event_id": event_id,
            "results": [{"id": base_data["athlete"].id, "place": 1}],
        },
    )
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload["results"][0]["place"] == 1

    with app.app_context():
        scores = ScoreEvent.get_all_by_game_id(game_id)
        assert len(scores) == 1
        assert list(scores[0].scores.values()) == [5]


def test_process_results_missing_event_returns_error(client):
    resp = client.post(
        "/api/results",
        json={"event_id": "unknown", "results": [{"id": "a", "place": 1}]},
    )
    assert resp.status_code == 400
