from datetime import datetime

from backfill_biathlon_source_ids import (
    build_source_id_updates,
    find_matching_races,
    season_ids_for_event_rows,
)
from src.ibu_api import IbuRace


def test_find_matching_races_uses_date_location_format_and_bucket():
    event_row = {
        "id": "event-1",
        "name": "Oberhof - Women Mass Start",
        "location": "Oberhof",
        "race_format": "mass start",
        "datetime": "2026-01-11 15:45:00",
        "event_type_name": "women",
    }
    races = [
        IbuRace(
            season_id="2526",
            event_id="source-event-1",
            race_id="race-1",
            location="Oberhof",
            title="Women Mass Start",
            starts_at=datetime(2026, 1, 11, 14, 0, 0),
            gender="W",
            race_format="Mass Start",
        ),
        IbuRace(
            season_id="2526",
            event_id="source-event-2",
            race_id="race-2",
            location="Oberhof",
            title="Men Mass Start",
            starts_at=datetime(2026, 1, 11, 12, 0, 0),
            gender="M",
            race_format="Mass Start",
        ),
    ]

    matches = find_matching_races(event_row, races)

    assert [race.race_id for race in matches] == ["race-1"]


def test_find_matching_races_can_match_when_official_location_differs_but_datetime_is_exact():
    event_row = {
        "id": "event-1",
        "name": "Otepaa (EST) - Men 10 km Sprint",
        "location": "Otepaa (EST)",
        "race_format": "sprint",
        "datetime": "2026-03-12 15:15:00",
        "event_type_name": "men",
    }
    races = [
        IbuRace(
            season_id="2526",
            event_id="source-event-1",
            race_id="race-1",
            location="Tehvandi Sport Center",
            title="Men 10km Sprint",
            starts_at=datetime(2026, 3, 12, 15, 15, 0),
            gender="SM",
            race_format=None,
        )
    ]

    matches = find_matching_races(event_row, races)

    assert [race.race_id for race in matches] == ["race-1"]


def test_build_source_id_updates_separates_matches_ambiguous_and_unresolved():
    event_rows = [
        {
            "id": "event-1",
            "name": "Oberhof - Women Mass Start",
            "location": "Oberhof",
            "race_format": "mass start",
            "datetime": "2026-01-11 15:45:00",
            "event_type_name": "women",
        },
        {
            "id": "event-2",
            "name": "Oberhof - Men Sprint",
            "location": "Oberhof",
            "race_format": "sprint",
            "datetime": "2026-01-10 14:15:00",
            "event_type_name": "men",
        },
        {
            "id": "event-3",
            "name": "Unknown Event",
            "location": "Nove Mesto",
            "race_format": "pursuit",
            "datetime": "2026-01-12 12:00:00",
            "event_type_name": "women",
        },
    ]
    races = [
        IbuRace(
            season_id="2526",
            event_id="source-event-1",
            race_id="race-1",
            location="Oberhof",
            title="Women Mass Start",
            starts_at=datetime(2026, 1, 11, 15, 45, 0),
            gender="W",
            race_format="Mass Start",
        ),
        IbuRace(
            season_id="2526",
            event_id="source-event-2",
            race_id="race-2",
            location="Oberhof",
            title="Men Sprint",
            starts_at=datetime(2026, 1, 10, 14, 15, 0),
            gender="M",
            race_format="Sprint",
        ),
        IbuRace(
            season_id="2526",
            event_id="source-event-3",
            race_id="race-3",
            location="Oberhof",
            title="Men Sprint",
            starts_at=datetime(2026, 1, 10, 14, 15, 0),
            gender="M",
            race_format="Sprint",
        ),
    ]

    updates, ambiguous, unresolved = build_source_id_updates(event_rows, races)

    assert updates == [
        {
            "event_id": "event-1",
            "event_name": "Oberhof - Women Mass Start",
            "source_provider": "ibu",
            "season_id": "2526",
            "source_event_id": "source-event-1",
            "source_race_id": "race-1",
        }
    ]
    assert ambiguous == [
        {
            "event_id": "event-2",
            "event_name": "Oberhof - Men Sprint",
            "candidate_race_ids": ["race-2", "race-3"],
        }
    ]
    assert unresolved == [
        {
            "event_id": "event-3",
            "event_name": "Unknown Event",
        }
    ]


def test_season_ids_for_event_rows_includes_past_and_future_seasons_in_order():
    season_ids = season_ids_for_event_rows(
        [
            {"datetime": "2025-03-23 15:00:00"},
            {"datetime": "2026-01-10 14:15:00"},
            {"datetime": "2026-11-30 12:00:00"},
            {"datetime": "2026-01-11 15:45:00"},
        ]
    )

    assert season_ids == ["2425", "2526", "2627"]
