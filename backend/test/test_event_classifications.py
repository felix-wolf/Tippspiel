from datetime import datetime, timedelta
import json
import sqlite3
from unittest.mock import Mock
from types import SimpleNamespace

import pytest
import requests

from backfill_biathlon_event_classifications import (
    apply_classification_updates,
    build_classification_updates,
    get_events_missing_classifications,
    main,
)
from src.database import db_manager
from src.database import migration_runner
from src.ibu_api import IbuApiClient, IbuEvent
from src.models.event import Event
from src.models.game import Game
from src.models.bet import Bet, Prediction
from src.models.result import Result


def make_event(base_data, game_name="Classifications", **kwargs):
    success, game_id = Game.create(base_data["user"].id, game_name, None, "biathlon")
    assert success
    return Event(
        name="Oberhof - Women Sprint", game_id=game_id,
        event_type=base_data["event_type"], dt=datetime.now() + timedelta(days=1),
        allow_partial_points=True, source_provider="ibu", source_event_id="stop-1",
        source_race_id="race-1", season_id="2526", **kwargs,
    )


def test_import_round_trip_and_shared_metadata_preserved_for_older_payload(client, base_data):
    first = make_event(base_data, source_level=1, source_event_classification_id="BTSWRLCP")
    payload = first.to_dict()
    response = client.post("/api/event", json={"events": [json.dumps(payload)]})
    assert response.status_code == 200
    second = make_event(base_data, "Second game")
    old_payload = second.to_dict()
    old_payload.pop("source_level")
    old_payload.pop("source_event_classification_id")
    assert client.post("/api/event", json={"events": [json.dumps(old_payload)]}).status_code == 200

    for event in (first, second):
        data = client.get(f"/api/event?event_id={event.id}").get_json()
        assert data["source_level"] == 1
        assert data["source_event_classification_id"] == "BTSWRLCP"
    assert len(db_manager.query("SELECT * FROM SharedEvents")) == 1
    columns = db_manager.query("PRAGMA table_info(Events)")
    assert "source_level" not in {column["name"] for column in columns}
    db_manager.refresh_analytics_views()
    assert Event.get_by_id(first.id, get_full_object=False).source_level == 1


def test_ibu_candidates_keep_classifications_through_import_and_reload(client, base_data, monkeypatch):
    game_id = make_event(base_data).game_id
    db_manager.execute("UPDATE EventTypes SET name = 'women' WHERE id = ?", [base_data["event_type"].id])
    classifications = {1: ["BTSWRLCP", "BTSWRLOG"], 2: ["BTSIBUCP", "BTSCEUCH"]}

    def get(url, params, timeout):
        if url.endswith("/Events"):
            payload = [{"EventId": code, "Level": params["Level"], "EventClassificationId": code}
                       for code in classifications.get(params["Level"], [])]
        else:
            payload = [{"RaceId": params["EventId"] + "-race", "ShortDescription": "Women Sprint",
                        "StartTime": (datetime.now() + timedelta(days=1)).isoformat(), "Gender": "W"}]
        return SimpleNamespace(text=json.dumps(payload), raise_for_status=lambda: None)

    official_client = IbuApiClient(session=SimpleNamespace(get=get))
    monkeypatch.setattr(official_client, "iter_import_season_ids", lambda now=None: ["2526"])
    monkeypatch.setattr("src.services.disciplines.biathlon.IbuApiClient", lambda: official_client)
    response = client.get("/api/game/events/importable", query_string={"game_id": game_id})
    assert response.status_code == 200
    candidates = response.get_json()
    assert {item["source_event_classification_id"] for item in candidates} == {
        "BTSWRLCP", "BTSWRLOG", "BTSIBUCP", "BTSCEUCH",
    }
    assert client.post("/api/event", json={"events": [json.dumps(item) for item in candidates]}).status_code == 200
    saved = client.get("/api/event", query_string={"game_id": game_id}).get_json()
    assert {(item["source_level"], item["source_event_classification_id"]) for item in saved} == {
        (1, "BTSWRLCP"), (1, "BTSWRLOG"), (2, "BTSIBUCP"), (2, "BTSCEUCH"),
    }


@pytest.mark.parametrize("changed", [None, "source_event_id", "source_race_id", "season_id", "source_provider"])
def test_admin_source_update_preserves_or_invalidates_metadata(admin_client, base_data, changed):
    event = make_event(base_data, source_level=2, source_event_classification_id="BTSIBUCP")
    assert event.save_to_db()[0]
    payload = {key: getattr(event, key) for key in (
        "source_provider", "source_event_id", "source_race_id", "season_id",
    )}
    if changed:
        payload[changed] = "new-value"
    response = admin_client.put(f"/api/admin/shared-events/{event.shared_event_id}/source", json=payload)
    assert response.status_code == 200
    expected = None if changed else "BTSIBUCP"
    assert response.get_json()["source_event_classification_id"] == expected
    saved = Event.get_by_id(event.id, get_full_object=False)
    assert saved.source_event_classification_id == expected
    assert saved.source_level == (None if changed else 2)


def test_backfill_exact_match_dry_run_repeatability_and_conflicts(app, base_data, monkeypatch, capsys):
    event = make_event(base_data)
    assert event.save_to_db()[0]
    client = Mock()
    client.get_events_for_season.return_value = [IbuEvent("2526", "stop-1", "Oberhof", 2, "BTSIBUCP")]
    monkeypatch.setattr(IbuApiClient, "get_events_for_season", client.get_events_for_season)
    assert main(["--env", "test", "--dry-run"]) == 0
    assert "Dry run" in capsys.readouterr().out
    assert Event.get_by_id(event.id, get_full_object=False).source_level is None

    rows = get_events_missing_classifications()
    updates, unresolved, conflicts = build_classification_updates(rows, client)
    assert not unresolved and not conflicts
    assert apply_classification_updates(updates) == 1
    assert apply_classification_updates(updates) == 0
    assert get_events_missing_classifications() == []
    assert Event.get_by_id(event.id, get_full_object=False).source_event_classification_id == "BTSIBUCP"

    rows[0]["source_level"] = 1
    assert build_classification_updates(rows, client)[2] == [event.shared_event_id]
    rows[0]["season_id"] = None
    assert build_classification_updates(rows, client)[1] == [event.shared_event_id]


def test_backfill_fetch_failure_leaves_classifications_unchanged(app, base_data, monkeypatch):
    event = make_event(base_data)
    assert event.save_to_db()[0]
    client = Mock()
    client.get_events_for_season.side_effect = requests.ConnectionError("offline")
    monkeypatch.setattr(IbuApiClient, "get_events_for_season", client.get_events_for_season)
    assert main(["--env", "test"]) == 1
    assert Event.get_by_id(event.id, get_full_object=False).source_level is None


@pytest.mark.parametrize("already_classified", [False, True])
def test_backfill_missing_season_requires_exact_official_parent_event(base_data, already_classified):
    event = make_event(base_data, source_level=1 if already_classified else None,
                       source_event_classification_id="BTSWRLCP" if already_classified else None)
    event.season_id = None
    event.dt = datetime(2026, 3, 12, 12)
    assert event.save_to_db()[0]
    official = Mock()
    official.get_events_for_season.return_value = [IbuEvent("2526", "stop-1", None, 1, "BTSWRLCP")]
    rows = get_events_missing_classifications()
    updates, unresolved, conflicts = build_classification_updates(rows, official)
    assert not unresolved and not conflicts
    assert len(updates) == 1
    official.get_events_for_season.assert_called_once_with("2526")
    assert Event.get_by_id(event.id, get_full_object=False).season_id is None
    assert apply_classification_updates(updates) == 1
    saved = Event.get_by_id(event.id, get_full_object=False)
    assert saved.season_id == "2526"
    assert saved.source_level == 1
    assert saved.source_event_classification_id == "BTSWRLCP"
    assert get_events_missing_classifications() == []


def test_backfill_does_not_fill_candidate_season_without_official_match():
    official = Mock()
    official.get_events_for_season.return_value = [IbuEvent("2526", "different-stop", None, 1, "BTSWRLCP")]
    row = {"id": "race", "season_id": None, "source_event_id": "stop-1",
           "datetime": "2026-03-12 12:00:00", "source_level": None,
           "source_event_classification_id": None}
    updates, unresolved, conflicts = build_classification_updates([row], official)
    assert updates == [] and unresolved == ["race"] and conflicts == []


def test_backfill_reports_missing_identifiers_without_guessing():
    official = Mock()
    rows = [{"id": "missing-date", "season_id": None, "source_event_id": "stop-1", "datetime": "invalid"},
            {"id": "missing-stop", "season_id": None, "source_event_id": None, "datetime": "2026-03-12"}]
    updates, unresolved, conflicts = build_classification_updates(rows, official)
    assert updates == [] and unresolved == ["missing-date", "missing-stop"] and conflicts == []
    official.get_events_for_season.assert_not_called()


def test_backfill_uses_one_fetch_per_season_and_rolls_back_batch(base_data):
    first = make_event(base_data)
    second = make_event(base_data, "Second game")
    second.source_race_id = "race-2"
    assert first.save_to_db()[0]
    assert second.save_to_db()[0]
    client = Mock()
    client.get_events_for_season.return_value = [IbuEvent("2526", "stop-1", None, 1, "BTSWRLCP")]
    updates, unresolved, conflicts = build_classification_updates(get_events_missing_classifications(), client)
    client.get_events_for_season.assert_called_once_with("2526")
    assert not unresolved and not conflicts
    db_manager.execute("""
        CREATE TRIGGER reject_second_classification BEFORE UPDATE ON SharedEvents
        WHEN OLD.source_race_id = 'race-2'
        BEGIN SELECT RAISE(ABORT, 'test rollback'); END
    """)
    with pytest.raises(sqlite3.IntegrityError, match="test rollback"):
        apply_classification_updates(updates)
    assert Event.get_by_id(first.id, get_full_object=False).source_level is None
    assert Event.get_by_id(second.id, get_full_object=False).source_level is None


def test_classification_migration_preserves_existing_data_and_old_version_history(app, base_data, tmp_path):
    event = make_event(base_data, source_level=1, source_event_classification_id="BTSWRLCP")
    assert event.save_to_db()[0]
    bet = Bet(user_id=base_data["user"].id, event_id=event.id)
    bet.predictions = [Prediction(bet.id, base_data["athlete"].id, "Franz Fischer", 1)]
    assert bet.save_to_db()
    assert Result(event_id=event.id, place=1, object_id=base_data["athlete"].id).save_to_db()[0]
    # Copy the fixture database and reconstruct the immediately preceding schema.
    target = tmp_path / "pre_classifications.db"
    with sqlite3.connect(app.config["DB_PATH"]) as source, sqlite3.connect(target) as conn:
        source.backup(conn)
        conn.execute("DROP VIEW VIEW_Events")
        conn.execute("ALTER TABLE SharedEvents DROP COLUMN source_level")
        conn.execute("ALTER TABLE SharedEvents DROP COLUMN source_event_classification_id")
        # Some existing databases recorded 0013 for an unrelated migration.
        # Keep that history intact and require a forward migration to repair it.
        conn.execute("DELETE FROM SchemaMigrations WHERE version = '0014'")
        conn.execute("INSERT INTO SchemaMigrations (version, applied_at) VALUES ('0013', '2026-03-23 16:24:06')")
        old_record = conn.execute("SELECT * FROM SchemaMigrations WHERE version = '0013'").fetchone()
        old_view = (migration_runner.MIGRATIONS_DIR / "0012_remove_event_has_bets_view_field.sql").read_text()
        conn.executescript(old_view)
        before = {table: conn.execute(f"SELECT * FROM {table}").fetchall()
                  for table in ("Events", "Bets", "Predictions", "Results")}
    assert migration_runner.migrate_to_latest(str(target)).is_current
    with sqlite3.connect(target) as conn:
        assert conn.execute("SELECT source_level, source_event_classification_id FROM VIEW_Events").fetchone() == (None, None)
        assert conn.execute("SELECT * FROM SchemaMigrations WHERE version = '0013'").fetchone() == old_record
        for table, data in before.items():
            assert conn.execute(f"SELECT * FROM {table}").fetchall() == data
    assert migration_runner.migrate_to_latest(str(target)).is_current
