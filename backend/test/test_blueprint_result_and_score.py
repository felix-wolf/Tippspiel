import json
from datetime import datetime, timedelta

from src.models.bet import Bet, Prediction
from src.models.event import Event
from src.models.game import Game
from src.models.result import Result
from src.models.score_event import ScoreEvent
from src.time_utils import berlin_local_now_naive


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
                object_name=base_data["athlete"].last_name,
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
    assert resp.status_code == 404
    assert resp.get_json()["error"] == "Das Event wurde nicht gefunden."


def test_process_results_rejects_malformed_json(client):
    resp = client.post(
        "/api/results",
        data="{broken",
        content_type="application/json",
    )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Ungültige oder fehlende JSON-Daten."


def test_process_results_requires_result_payload(client, app, base_data):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Missing Results Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

        event = Event(
            name="Missing Results Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=True,
        )
        event.save_to_db()

    resp = client.post("/api/results", json={"event_id": event.id})
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Es wurden keine Ergebnisse übermittelt."


def test_scores_requires_game_id(client):
    resp = client.get("/api/scores")
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Die Spiel-ID fehlt."


def test_process_results_rejects_result_url_upload(client, app, base_data):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Legacy Result Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

        event = Event(
            name="Legacy Result Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=True,
            url="https://example.com/results/world-cup",
        )
        event.save_to_db()

    response = client.post(
        "/api/results",
        json={"event_id": event.id, "url": "https://example.com/results/world-cup"},
    )
    assert response.status_code == 410
    assert response.get_json()["error"] == "Ergebnis-URLs werden nicht mehr unterstützt."


def test_results_check_ignores_legacy_url_only_event(client, app, base_data):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Legacy Auto Result Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

        event = Event(
            name="Legacy Auto Result Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=berlin_local_now_naive() - timedelta(hours=2),
            allow_partial_points=True,
            url="https://example.com/results/world-cup",
        )
        event.save_to_db()

    response = client.get("/api/results/check")
    assert response.status_code == 200
    assert response.get_json() == {
        "status": "checked",
        "processed_count": 0,
        "failed_count": 0,
        "processed_events": [],
        "failed_events": [],
    }


def test_results_check_prefers_official_source_ids(client, app, base_data, monkeypatch):
    def fake_process_official_results(self, event):
        assert event.source_race_id == "race-123"
        return [Result(event.id, 1, base_data["athlete"].id)], None

    from src.models.discipline import Biathlon
    monkeypatch.setattr(Biathlon, "process_official_results", fake_process_official_results)

    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Official Auto Result Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

        event = Event(
            name="Official Auto Result Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=berlin_local_now_naive() - timedelta(hours=2),
            allow_partial_points=True,
            source_provider="ibu",
            source_event_id="event-123",
            source_race_id="race-123",
        )
        event.save_to_db()

    response = client.get("/api/results/check")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["processed_count"] == 1
    assert payload["failed_count"] == 0
    assert payload["processed_events"] == [
        {
            "event_id": event.id,
            "event_name": "Official Auto Result Event",
            "game_id": game_id,
        }
    ]


def test_results_check_processes_all_due_events(client, app, base_data, monkeypatch):
    def fake_process_official_results(self, event):
        return [Result(event.id, 1, base_data["athlete"].id)], None

    from src.models.discipline import Biathlon
    monkeypatch.setattr(Biathlon, "process_official_results", fake_process_official_results)

    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Batch Result Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

        first_event = Event(
            name="Official Auto Result Event 1",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=berlin_local_now_naive() - timedelta(hours=2),
            allow_partial_points=True,
            source_provider="ibu",
            source_event_id="event-123",
            source_race_id="race-123",
        )
        first_event.save_to_db()

        second_event = Event(
            name="Official Auto Result Event 2",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=berlin_local_now_naive() - timedelta(hours=3),
            allow_partial_points=True,
            source_provider="ibu",
            source_event_id="event-456",
            source_race_id="race-456",
        )
        second_event.save_to_db()

    response = client.get("/api/results/check")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["processed_count"] == 2
    assert payload["failed_count"] == 0
    assert {item["event_id"] for item in payload["processed_events"]} == {
        first_event.id,
        second_event.id,
    }

    with app.app_context():
        assert len(Result.get_by_event_id(first_event.id)) == 1
        assert len(Result.get_by_event_id(second_event.id)) == 1


def test_results_check_continues_after_single_event_failure(client, app, base_data, monkeypatch):
    def fake_process_official_results(self, event):
        if event.source_race_id == "race-bad":
            return [], "IBU source unavailable"
        return [Result(event.id, 1, base_data["athlete"].id)], None

    from src.models.discipline import Biathlon
    monkeypatch.setattr(Biathlon, "process_official_results", fake_process_official_results)

    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Partial Failure Result Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

        bad_event = Event(
            name="Official Auto Result Event Bad",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=berlin_local_now_naive() - timedelta(hours=2),
            allow_partial_points=True,
            source_provider="ibu",
            source_event_id="event-bad",
            source_race_id="race-bad",
        )
        bad_event.save_to_db()

        good_event = Event(
            name="Official Auto Result Event Good",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=berlin_local_now_naive() - timedelta(hours=3),
            allow_partial_points=True,
            source_provider="ibu",
            source_event_id="event-good",
            source_race_id="race-good",
        )
        good_event.save_to_db()

    response = client.get("/api/results/check")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["processed_count"] == 1
    assert payload["failed_count"] == 1
    assert payload["processed_events"] == [
        {
            "event_id": good_event.id,
            "event_name": "Official Auto Result Event Good",
            "game_id": game_id,
        }
    ]
    assert payload["failed_events"] == [
        {
            "event_id": bad_event.id,
            "event_name": "Official Auto Result Event Bad",
            "game_id": game_id,
            "status_code": 500,
            "error": "IBU source unavailable",
        }
    ]

    with app.app_context():
        assert len(Result.get_by_event_id(bad_event.id)) == 0
        assert len(Result.get_by_event_id(good_event.id)) == 1
