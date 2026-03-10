from datetime import datetime

from backfill_biathlon_athlete_ids import (
    build_athlete_id_updates,
    official_athletes_from_race_results,
    season_ids_for_backfill,
)
from src.ibu_api import IbuAthleteRow, IbuRace, IbuResultRow
from src.models.athlete import Athlete


def test_build_athlete_id_updates_matches_on_name_country_and_gender():
    local_athletes = [
        Athlete(
            athlete_id="athlete-1",
            first_name="Lou",
            last_name="Jeanmonnot",
            country_code="FRA",
            gender="f",
            discipline="biathlon",
        ),
        Athlete(
            athlete_id="athlete-2",
            first_name="Sebastian",
            last_name="Samuelsson",
            country_code="SWE",
            gender="m",
            discipline="biathlon",
        ),
    ]
    official_athletes = [
        IbuAthleteRow(
            athlete_id="IBU-123",
            first_name="Lou",
            last_name="Jeanmonnot",
            nation_code="FRA",
            gender="W",
        ),
    ]

    updates, unresolved = build_athlete_id_updates(local_athletes, official_athletes)

    assert updates == [("IBU-123", "athlete-1", "Lou", "Jeanmonnot")]
    assert [athlete.id for athlete in unresolved] == ["athlete-2"]


def test_season_ids_for_backfill_uses_previous_and_current_season():
    season_ids = season_ids_for_backfill(now=datetime(2026, 3, 10, 12, 0, 0))

    assert season_ids == ["2425", "2526"]


def test_official_athletes_from_race_results_merges_export_and_results():
    class _FakeClient:
        def get_athletes(self, season_id):
            return [
                IbuAthleteRow(
                    athlete_id="IBU-1",
                    first_name="Lou",
                    last_name="Jeanmonnot",
                    nation_code="FRA",
                    gender="W",
                )
            ]

        def get_races_for_season(self, season_id):
            return [
                IbuRace(
                    season_id="2526",
                    event_id="event-1",
                    race_id="race-1",
                    location="Oberhof",
                    title="Women Sprint",
                    starts_at=datetime(2026, 1, 1, 12, 0, 0),
                    gender="W",
                ),
                IbuRace(
                    season_id="2526",
                    event_id="event-2",
                    race_id="race-2",
                    location="Oberhof",
                    title="Mixed Relay",
                    starts_at=datetime(2026, 1, 2, 12, 0, 0),
                    gender="W",
                ),
            ]

        def get_results(self, race_id):
            if race_id == "race-2":
                raise AssertionError("relay races should be skipped")
            return [
                IbuResultRow(
                    rank=1,
                    first_name="Maren",
                    last_name="Kirkeeide",
                    athlete_id="IBU-2",
                    nation_code="NOR",
                    country_name=None,
                    time="32:53.2",
                    behind="0.0",
                )
            ]

    official_athletes = official_athletes_from_race_results(_FakeClient(), ["2526"])

    assert {athlete.athlete_id for athlete in official_athletes} == {"IBU-1", "IBU-2"}
