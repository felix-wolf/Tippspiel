import json
from datetime import datetime, timedelta

from src.models.bet import Bet, Prediction
from src.models.athlete import Athlete
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


def _create_shared_events_with_bets(app, base_data):
    with app.app_context():
        success, first_game_id = Game.create(
            user_id=base_data["user"].id,
            name="Shared Result Game 1",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success
        success, second_game_id = Game.create(
            user_id=base_data["user"].id,
            name="Shared Result Game 2",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

        first_event = Event(
            name="Shared Result Event",
            game_id=first_game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=5,
            source_provider="ibu",
            source_event_id="event-1",
            source_race_id="race-shared",
        )
        first_event.save_to_db()

        second_event = Event(
            name="Shared Result Event",
            game_id=second_game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=5,
            source_provider="ibu",
            source_event_id="event-2",
            source_race_id="race-shared",
        )
        second_event.save_to_db()

        for event in (first_event, second_event):
            bet = Bet(
                user_id=base_data["user"].id,
                event_id=event.id,
            )
            bet.id = f"bet-{event.id}"
            bet.predictions = [
                Prediction(
                    bet_id=bet.id,
                    object_id=base_data["athlete"].id,
                    object_name=base_data["athlete"].last_name,
                    predicted_place=1,
                )
            ]
            bet.save_to_db()

        return first_game_id, second_game_id, first_event.id, second_event.id


def _create_second_athlete(app, base_data):
    with app.app_context():
        athlete = Athlete(
            athlete_id="athlete-2",
            first_name="Max",
            last_name="Muster",
            country_code=base_data["country"].code,
            gender="m",
            discipline=base_data["discipline"].id,
            ibu_id="IBU-2",
        )
        athlete.save_to_db()
        return athlete


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


def test_process_results_endpoint_allows_admin_override(admin_client, app, base_data):
    game_id, event_id = _create_event_with_bet(app, base_data)

    resp = admin_client.post(
        "/api/results",
        json={
            "event_id": event_id,
            "results": [{"id": base_data["athlete"].id, "place": 1}],
        },
    )

    assert resp.status_code == 200
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


def test_scores_endpoint_aggregates_multiple_events_without_duplicates(client, app, base_data):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Score Aggregation Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

        event_one = Event(
            name="Scored Event One",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=berlin_local_now_naive() + timedelta(hours=1),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=5,
        )
        event_two = Event(
            name="Scored Event Two",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=berlin_local_now_naive() + timedelta(hours=2),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=5,
        )
        event_three = Event(
            name="Unscored Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=berlin_local_now_naive() + timedelta(hours=3),
            allow_partial_points=False,
            num_bets=1,
            points_correct_bet=5,
        )
        for event in (event_one, event_two, event_three):
            event.save_to_db()

        for index, event in enumerate((event_one, event_two, event_three), start=1):
            bet = Bet(
                user_id=base_data["user"].id,
                event_id=event.id,
                predictions=[],
                score=5 if event != event_three else None,
                bet_id=f"bet-{index}",
            )
            bet.save_to_db()

    resp = client.get("/api/scores", query_string={"game_id": game_id})

    assert resp.status_code == 200
    payload = resp.get_json()
    assert [score["name"] for score in payload] == ["Scored Event One", "Scored Event Two"]
    assert payload[0]["scores"] == {base_data["user"].id: 5}
    assert payload[1]["scores"] == {base_data["user"].id: 5}


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
        )
        event.save_to_db()

    response = client.post(
        "/api/results",
        json={"event_id": event.id, "url": "https://example.com/results/world-cup"},
    )
    assert response.status_code == 410
    assert response.get_json()["error"] == "Ergebnis-URLs werden nicht mehr unterstützt."


def test_results_check_ignores_legacy_url_only_event(admin_client, app, base_data):
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
        )
        event.save_to_db()

    response = admin_client.get("/api/results/check")
    assert response.status_code == 200
    assert response.get_json() == {
        "status": "checked",
        "processed_count": 0,
        "deferred_count": 0,
        "failed_count": 0,
        "processed_events": [],
        "deferred_events": [],
        "failed_events": [],
    }


def test_results_check_prefers_official_source_ids(admin_client, app, base_data, monkeypatch):
    def fake_process_official_results(self, discipline, event):
        assert event.source_race_id == "race-123"
        return [Result(event.id, 1, base_data["athlete"].id)], None

    from src.services.disciplines.biathlon import BiathlonResultProcessor
    monkeypatch.setattr(BiathlonResultProcessor, "process_official_results", fake_process_official_results)

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

    response = admin_client.get("/api/results/check")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["processed_count"] == 1
    assert payload["deferred_count"] == 0
    assert payload["failed_count"] == 0
    assert payload["processed_events"] == [
        {
            "event_id": event.id,
            "event_name": "Official Auto Result Event",
            "game_id": game_id,
        }
    ]


def test_results_check_processes_all_due_events(admin_client, app, base_data, monkeypatch):
    def fake_process_official_results(self, discipline, event):
        return [Result(event.id, 1, base_data["athlete"].id)], None

    from src.services.disciplines.biathlon import BiathlonResultProcessor
    monkeypatch.setattr(BiathlonResultProcessor, "process_official_results", fake_process_official_results)

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

    response = admin_client.get("/api/results/check")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["processed_count"] == 2
    assert payload["deferred_count"] == 0
    assert payload["failed_count"] == 0
    assert {item["event_id"] for item in payload["processed_events"]} == {
        first_event.id,
        second_event.id,
    }

    with app.app_context():
        assert len(Result.get_by_event_id(first_event.id)) == 1
        assert len(Result.get_by_event_id(second_event.id)) == 1


def test_results_check_continues_after_single_event_failure(admin_client, app, base_data, monkeypatch):
    def fake_process_official_results(self, discipline, event):
        if event.source_race_id == "race-bad":
            return [], "IBU source unavailable"
        return [Result(event.id, 1, base_data["athlete"].id)], None

    from src.services.disciplines.biathlon import BiathlonResultProcessor
    monkeypatch.setattr(BiathlonResultProcessor, "process_official_results", fake_process_official_results)

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

    response = admin_client.get("/api/results/check")
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["processed_count"] == 1
    assert payload["deferred_count"] == 0
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


def test_results_check_requires_admin_or_task_token(app):
    client = app.test_client()

    response = client.get("/api/results/check")

    assert response.status_code == 403
    assert response.get_json()["error"] == "Du bist für diese Aktion nicht berechtigt."


def test_results_check_accepts_task_token(app, monkeypatch):
    app.config["TASK_API_TOKEN"] = "cron-secret"
    monkeypatch.setattr(
        "src.blueprints.result.check_recent_results",
        lambda: ({"status": "checked", "processed_count": 0, "deferred_count": 0, "failed_count": 0, "processed_events": [], "deferred_events": [], "failed_events": []}, None, None),
    )
    client = app.test_client()

    response = client.get("/api/results/check", headers={"X-Task-Token": "cron-secret"})

    assert response.status_code == 200
    assert response.get_json()["status"] == "checked"


def test_results_check_creates_operation_history_for_failures(admin_client, app, monkeypatch):
    monkeypatch.setattr(
        "src.blueprints.result.check_recent_results",
        lambda: (
            {
                "status": "checked",
                "processed_count": 1,
                "deferred_count": 0,
                "failed_count": 1,
                "processed_events": [{"event_id": "ok-event"}],
                "deferred_events": [],
                "failed_events": [{"event_id": "bad-event", "error": "IBU source unavailable"}],
            },
            None,
            None,
        ),
    )

    response = admin_client.get("/api/results/check")

    assert response.status_code == 200

    operations_response = admin_client.get("/api/admin/operations")
    payload = operations_response.get_json()
    matching_entries = [entry for entry in payload["entries"] if entry["action_type"] == "results_check"]
    assert matching_entries
    assert matching_entries[0]["status"] == "failed"
    assert matching_entries[0]["details"]["failed_count"] == 1


def test_admin_result_refresh_preview_returns_409_for_start_list(admin_client, app, base_data, monkeypatch):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Preview Start List Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success
        event = Event(
            name="Preview Start List Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=True,
            source_provider="ibu",
            source_event_id="event-startlist-preview",
            source_race_id="race-startlist-preview",
        )
        event.save_to_db()
        event_id = event.id

    from src.services.disciplines.biathlon import BiathlonResultProcessor
    from src.services.disciplines.base import OfficialResultsNotReady

    def fake_process_official_results(self, discipline, event):
        return [], OfficialResultsNotReady("Die offizielle IBU-Quelle liefert derzeit nur eine Startliste und noch keine Ergebnisse.")

    monkeypatch.setattr(BiathlonResultProcessor, "process_official_results", fake_process_official_results)

    response = admin_client.post(f"/api/admin/events/{event_id}/results/preview-refresh", json={})

    assert response.status_code == 409
    assert "Startliste" in response.get_json()["error"]


def test_admin_result_refresh_apply_returns_409_for_start_list(admin_client, app, base_data, monkeypatch):
    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Apply Start List Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success
        event = Event(
            name="Apply Start List Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=datetime.now() + timedelta(hours=1),
            allow_partial_points=True,
            source_provider="ibu",
            source_event_id="event-startlist-apply",
            source_race_id="race-startlist-apply",
        )
        event.save_to_db()
        event_id = event.id

    from src.services.disciplines.biathlon import BiathlonResultProcessor
    from src.services.disciplines.base import OfficialResultsNotReady

    def fake_process_official_results(self, discipline, event):
        return [], OfficialResultsNotReady("Die offizielle IBU-Quelle liefert derzeit nur eine Startliste und noch keine Ergebnisse.")

    monkeypatch.setattr(BiathlonResultProcessor, "process_official_results", fake_process_official_results)

    response = admin_client.post(f"/api/admin/events/{event_id}/results/apply-refresh", json={})

    assert response.status_code == 409
    assert "Startliste" in response.get_json()["error"]


def test_results_check_defers_start_list_events(admin_client, app, base_data, monkeypatch):
    from src.services.disciplines.biathlon import BiathlonResultProcessor
    from src.services.disciplines.base import OfficialResultsNotReady

    def fake_process_official_results(self, discipline, event):
        return [], OfficialResultsNotReady("Die offizielle IBU-Quelle liefert derzeit nur eine Startliste und noch keine Ergebnisse.")

    monkeypatch.setattr(BiathlonResultProcessor, "process_official_results", fake_process_official_results)

    with app.app_context():
        success, game_id = Game.create(
            user_id=base_data["user"].id,
            name="Deferred Result Game",
            pw_hash=None,
            discipline_name=base_data["discipline"].id,
        )
        assert success

        event = Event(
            name="Official Running Event",
            game_id=game_id,
            event_type=base_data["event_type"],
            dt=berlin_local_now_naive() - timedelta(hours=2),
            allow_partial_points=True,
            source_provider="ibu",
            source_event_id="event-running",
            source_race_id="race-running",
        )
        event.save_to_db()

    response = admin_client.get("/api/results/check")

    assert response.status_code == 200
    assert response.get_json() == {
        "status": "checked",
        "processed_count": 0,
        "deferred_count": 1,
        "failed_count": 0,
        "processed_events": [],
        "deferred_events": [
            {
                "event_id": event.id,
                "event_name": "Official Running Event",
                "game_id": game_id,
                "status_code": 409,
                "reason": "Die offizielle IBU-Quelle liefert derzeit nur eine Startliste und noch keine Ergebnisse.",
            }
        ],
        "failed_events": [],
    }


def test_admin_result_refresh_preview_returns_diff_for_shared_events(admin_client, app, base_data, monkeypatch):
    _, second_game_id, first_event_id, second_event_id = _create_shared_events_with_bets(app, base_data)
    second_athlete = _create_second_athlete(app, base_data)

    def fake_process_official_results(self, discipline, event):
        return [Result(event.id, 1, second_athlete.id, "Max Muster")], None

    from src.services.disciplines.biathlon import BiathlonResultProcessor
    monkeypatch.setattr(BiathlonResultProcessor, "process_official_results", fake_process_official_results)

    with app.app_context():
        first_event = Event.get_by_id(first_event_id)
        success, error = first_event.process_results(
            [Result(first_event.id, 1, base_data["athlete"].id, "Franz Fischer")]
        )
        assert success, error

    response = admin_client.post(f"/api/admin/events/{first_event_id}/results/preview-refresh", json={})

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["scope"] == "shared_event"
    assert payload["shared_event_id"] == f"official:ibu:race-shared"
    assert len(payload["affected_events"]) == 2
    assert second_game_id in {item["game_id"] for item in payload["affected_events"]}
    assert payload["has_changes"] is True
    assert payload["changes"][0]["place"] == 1
    assert payload["changes"][0]["before"]["object_id"] == base_data["athlete"].id
    assert payload["changes"][0]["after"]["object_id"] == second_athlete.id
    assert {item["event_id"] for item in payload["affected_events"]} == {first_event_id, second_event_id}


def test_admin_result_refresh_apply_updates_all_linked_events(admin_client, app, base_data, monkeypatch):
    first_game_id, second_game_id, first_event_id, second_event_id = _create_shared_events_with_bets(app, base_data)
    second_athlete = _create_second_athlete(app, base_data)

    def fake_process_official_results(self, discipline, event):
        return [Result(event.id, 1, second_athlete.id, "Max Muster")], None

    from src.services.disciplines.biathlon import BiathlonResultProcessor
    monkeypatch.setattr(BiathlonResultProcessor, "process_official_results", fake_process_official_results)

    response = admin_client.post(f"/api/admin/events/{first_event_id}/results/apply-refresh", json={})

    assert response.status_code == 200
    payload = response.get_json()
    assert payload["status"] == "applied"
    assert payload["processed_count"] == 2
    assert {item["game_id"] for item in payload["processed_events"]} == {first_game_id, second_game_id}

    with app.app_context():
        first_results = Result.get_by_event_id(first_event_id)
        second_results = Result.get_by_event_id(second_event_id)
        assert first_results[0].object_id == second_athlete.id
        assert second_results[0].object_id == second_athlete.id
        assert ScoreEvent.get_all_by_game_id(first_game_id)[0].scores[base_data["user"].id] == 0
        assert ScoreEvent.get_all_by_game_id(second_game_id)[0].scores[base_data["user"].id] == 0


def test_admin_clear_results_resets_scores(admin_client, app, base_data):
    game_id, event_id = _create_event_with_bet(app, base_data)

    with app.app_context():
        event = Event.get_by_id(event_id)
        success, error = event.process_results([Result(event.id, 1, base_data["athlete"].id, "Franz Fischer")])
        assert success, error

    response = admin_client.delete(f"/api/admin/events/{event_id}/results", json={})

    assert response.status_code == 200
    assert response.get_json()["status"] == "cleared"

    with app.app_context():
        event = Event.get_by_id(event_id)
        assert event.results == []
        bet = Bet.get_by_event_id_user_id(event_id, base_data["user"].id)
        assert bet is not None
        assert bet.score is None
        assert bet.predictions[0].actual_place is None
        assert bet.predictions[0].score == 0
        assert ScoreEvent.get_all_by_game_id(game_id) == []


def test_admin_rescore_reuses_existing_results(admin_client, app, base_data):
    game_id, event_id = _create_event_with_bet(app, base_data)

    with app.app_context():
        event = Event.get_by_id(event_id)
        success, error = event.process_results([Result(event.id, 1, base_data["athlete"].id, "Franz Fischer")])
        assert success, error

    response = admin_client.post(f"/api/admin/events/{event_id}/results/rescore", json={})

    assert response.status_code == 200
    assert response.get_json()["status"] == "rescored"
    with app.app_context():
        assert ScoreEvent.get_all_by_game_id(game_id)[0].scores[base_data["user"].id] == 5


def test_admin_result_endpoints_require_admin(client, app, base_data):
    _, event_id = _create_event_with_bet(app, base_data)

    preview_response = client.post(f"/api/admin/events/{event_id}/results/preview-refresh", json={})
    apply_response = client.post(f"/api/admin/events/{event_id}/results/apply-refresh", json={})
    clear_response = client.delete(f"/api/admin/events/{event_id}/results", json={})
    rescore_response = client.post(f"/api/admin/events/{event_id}/results/rescore", json={})

    assert preview_response.status_code == 403
    assert apply_response.status_code == 403
    assert clear_response.status_code == 403
    assert rescore_response.status_code == 403
