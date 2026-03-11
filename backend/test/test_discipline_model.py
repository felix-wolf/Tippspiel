from datetime import datetime

from src.ibu_api import IbuResultRow
from src.models.country import Country
from src.models.discipline import Discipline
from src.models.event import Event
from src.models.event_type import EventType


def test_discipline_save_and_get(base_data, app):
    with app.app_context():
        fetched = Discipline.get_by_id(base_data["discipline"].id)
        assert fetched is not None
        assert fetched.name == base_data["discipline"].name
        assert any(et.name == base_data["event_type"].name for et in fetched.event_types)


def test_discipline_get_all(base_data, app):
    with app.app_context():
        disciplines = Discipline.get_all()
        ids = [d.id for d in disciplines]
        assert "biathlon" in ids


def test_biathlon_country_results_dedupe_repeated_relay_rows(app, base_data, monkeypatch):
    with app.app_context():
        relay_type = EventType(
            name="relay",
            display_name="Relay",
            discipline_id=base_data["discipline"].id,
            betting_on="countries",
        )
        relay_type.save_to_db()

        france = Country(code="FRA", name="France", flag="FRA")
        france.save_to_db()

        event = Event(
            name="Relay Event",
            game_id="game-1",
            event_type=relay_type,
            dt=datetime(2026, 1, 1, 12, 0, 0),
            allow_partial_points=True,
            source_provider="ibu",
            source_race_id="race-relay-1",
        )

        discipline = Discipline.get_by_id(base_data["discipline"].id)

        monkeypatch.setattr(
            "src.models.discipline.IbuApiClient.get_results",
            lambda self, race_id: [
                IbuResultRow(
                    rank=1,
                    first_name="A",
                    last_name="Athlete",
                    athlete_id="ibu-1",
                    nation_code="FRA",
                    country_name="France",
                    time="1:00:00",
                    behind="0.0",
                ),
                IbuResultRow(
                    rank=1,
                    first_name="B",
                    last_name="Athlete",
                    athlete_id="ibu-2",
                    nation_code="FRA",
                    country_name="France",
                    time="1:00:00",
                    behind="0.0",
                ),
                IbuResultRow(
                    rank=2,
                    first_name="C",
                    last_name="Athlete",
                    athlete_id="ibu-3",
                    nation_code="GER",
                    country_name="Germany",
                    time="1:01:00",
                    behind="1:00",
                ),
                IbuResultRow(
                    rank=2,
                    first_name="D",
                    last_name="Athlete",
                    athlete_id="ibu-4",
                    nation_code="GER",
                    country_name="Germany",
                    time="1:01:00",
                    behind="1:00",
                ),
            ],
        )

        results, error = discipline.process_official_results(event)

        assert error is None
        assert len(results) == 2
        assert [(result.place, result.object_id) for result in results] == [
            (1, "FRA"),
            (2, "GER"),
        ]
