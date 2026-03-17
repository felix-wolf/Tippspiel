from datetime import datetime

from src.ibu_api import IbuResultRow
from src.models.athlete import Athlete
from src.models.country import Country
from src.models.discipline import Discipline
from src.models.event import Event
from src.models.event_type import EventType
from src.services.disciplines import get_discipline_services
from src.services.disciplines.base import OfficialResultsNotReady


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
            "src.services.disciplines.biathlon.IbuApiClient.get_results",
            lambda self, race_id: type(
                "FakeResponse",
                (),
                {
                    "kind": "results",
                    "rows": [
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
                },
            )(),
        )

        services = get_discipline_services(discipline.id)
        results, error = services.result_processor.process_official_results(discipline, event)

        assert error is None
        assert len(results) == 2
        assert [(result.place, result.object_id) for result in results] == [
            (1, "FRA"),
            (2, "GER"),
        ]


def test_biathlon_country_start_list_includes_relay_members_in_leg_order(app, base_data, monkeypatch):
    with app.app_context():
        relay_type = EventType(
            name="relay",
            display_name="Relay",
            discipline_id=base_data["discipline"].id,
            betting_on="countries",
        )
        relay_type.save_to_db()

        italy = Country(code="ITA", name="Italy", flag="ITA")
        italy.save_to_db()

        event = Event(
            name="Relay Start List",
            game_id="game-1",
            event_type=relay_type,
            dt=datetime(2026, 3, 15, 13, 40, 0),
            allow_partial_points=True,
            source_provider="ibu",
            source_race_id="race-relay-start-list-1",
        )

        discipline = Discipline.get_by_id(base_data["discipline"].id)

        monkeypatch.setattr(
            "src.services.disciplines.biathlon.IbuApiClient.get_results",
            lambda self, race_id: type(
                "FakeResponse",
                (),
                {
                    "kind": "start_list",
                    "rows": [
                        IbuResultRow(
                            rank=10000,
                            first_name=None,
                            last_name="ITALY",
                            athlete_id="BTITA9",
                            nation_code="ITA",
                            country_name=None,
                            time=None,
                            behind=None,
                            leg=0,
                            is_team=True,
                            display_name="ITALY",
                        ),
                        IbuResultRow(
                            rank=10000,
                            first_name="Patrick",
                            last_name="BRAUNHOFER",
                            athlete_id="BTITA11904199801",
                            nation_code="ITA",
                            country_name=None,
                            time=None,
                            behind=None,
                            leg=1,
                            display_name="BRAUNHOFER Patrick",
                        ),
                        IbuResultRow(
                            rank=10000,
                            first_name="Christoph",
                            last_name="PIRCHER",
                            athlete_id="BTITA10307200301",
                            nation_code="ITA",
                            country_name=None,
                            time=None,
                            behind=None,
                            leg=2,
                            display_name="PIRCHER Christoph",
                        ),
                        IbuResultRow(
                            rank=10000,
                            first_name="Michela",
                            last_name="CARRARA",
                            athlete_id="BTITA21005199701",
                            nation_code="ITA",
                            country_name=None,
                            time=None,
                            behind=None,
                            leg=3,
                            display_name="CARRARA Michela",
                        ),
                        IbuResultRow(
                            rank=10000,
                            first_name="Hannah",
                            last_name="AUCHENTALLER",
                            athlete_id="BTITA22803200101",
                            nation_code="ITA",
                            country_name=None,
                            time=None,
                            behind=None,
                            leg=4,
                            display_name="AUCHENTALLER Hannah",
                        ),
                    ],
                },
            )(),
        )

        services = get_discipline_services(discipline.id)
        start_list, entries, error = services.result_processor.get_start_list(discipline, event)

        assert error is None
        assert start_list == ["ITA"]
        assert entries == [
            {
                "id": "ITA",
                "name": "Italy",
                "members": [
                    {"leg": 1, "name": "Patrick BRAUNHOFER"},
                    {"leg": 2, "name": "Christoph PIRCHER"},
                    {"leg": 3, "name": "Michela CARRARA"},
                    {"leg": 4, "name": "Hannah AUCHENTALLER"},
                ],
            }
        ]


def test_process_athletes_reloads_existing_row_after_ignored_save(app, base_data, monkeypatch):
    with app.app_context():
        existing_athlete = Athlete(
            athlete_id="existing-athlete",
            ibu_id="IBU-EXISTING",
            first_name="Darya",
            last_name="Dolidovich",
            country_code=base_data["country"].code,
            gender="f",
            discipline=base_data["discipline"].id,
        )
        existing_athlete.save_to_db()

        discipline = Discipline.get_by_id(base_data["discipline"].id)
        imported_athlete = Athlete(
            athlete_id=None,
            ibu_id="IBU-EXISTING",
            first_name="Darya",
            last_name="Dolidovich",
            country_code=base_data["country"].code,
            gender="f",
            discipline=base_data["discipline"].id,
        )

        original_get_by_ibu_id = Athlete.get_by_ibu_id
        call_counts = {"get_by_ibu_id": 0}

        def flaky_get_by_ibu_id(ibu_id):
            call_counts["get_by_ibu_id"] += 1
            if call_counts["get_by_ibu_id"] <= 2:
                return None
            return original_get_by_ibu_id(ibu_id)

        monkeypatch.setattr(Athlete, "get_by_ibu_id", staticmethod(flaky_get_by_ibu_id))

        services = get_discipline_services(discipline.id)
        resolved = services.athlete_resolver.resolve_athletes([imported_athlete])

        assert len(resolved) == 1
        assert resolved[0].id == existing_athlete.id
        assert Athlete.get_by_id(existing_athlete.id) is not None


def test_biathlon_athlete_results_create_placeholder_country_for_unknown_code(app, base_data, monkeypatch):
    with app.app_context():
        event = Event(
            name="Sprint Event",
            game_id="game-1",
            event_type=base_data["event_type"],
            dt=datetime(2026, 1, 1, 12, 0, 0),
            allow_partial_points=True,
            source_provider="ibu",
            source_race_id="race-athlete-1",
        )

        discipline = Discipline.get_by_id(base_data["discipline"].id)

        monkeypatch.setattr(
            "src.services.disciplines.biathlon.IbuApiClient.get_results",
            lambda self, race_id: type(
                "FakeResponse",
                (),
                {
                    "kind": "results",
                    "rows": [
                        IbuResultRow(
                            rank=30,
                            first_name="Darya",
                            last_name="Dolidovich",
                            athlete_id="IBU-DARYA",
                            nation_code="BRT",
                            country_name="Belarus",
                            time="45:00.0",
                            behind="5:00.0",
                        ),
                    ],
                },
            )(),
        )

        services = get_discipline_services(discipline.id)
        results, error = services.result_processor.process_official_results(discipline, event)

        assert error is None
        assert len(results) == 1
        saved_athlete = Athlete.get_by_id(results[0].object_id)
        assert saved_athlete is not None
        assert saved_athlete.country_code == "BRT"
        placeholder_country = Country.get_by_id("BRT")
        assert placeholder_country is not None
        assert placeholder_country.flag == "🏴‍☠️"


def test_registry_returns_noop_services_for_unsupported_discipline():
    services = get_discipline_services("unknown-discipline")
    discipline = Discipline(
        discipline_id="unknown-discipline",
        name="Unknown",
        event_types=[],
    )

    events, import_error = services.event_importer.fetch_importable_events(discipline, game_id="game-1")
    results, result_error = services.result_processor.process_official_results(discipline, event=None)

    assert events == []
    assert results == []
    assert import_error == "Disziplin nicht auswertbar"
    assert result_error == "Disziplin nicht auswertbar"


def test_biathlon_results_report_start_list_as_not_ready(app, base_data, monkeypatch):
    with app.app_context():
        event = Event(
            name="Sprint Event",
            game_id="game-1",
            event_type=base_data["event_type"],
            dt=datetime(2026, 3, 12, 14, 15, 0),
            allow_partial_points=True,
            source_provider="ibu",
            source_race_id="race-running-1",
        )
        discipline = Discipline.get_by_id(base_data["discipline"].id)

        monkeypatch.setattr(
            "src.services.disciplines.biathlon.IbuApiClient.get_results",
            lambda self, race_id: type("FakeResponse", (), {"kind": "start_list", "rows": []})(),
        )

        services = get_discipline_services(discipline.id)
        results, error = services.result_processor.process_official_results(discipline, event)

        assert results == []
        assert isinstance(error, OfficialResultsNotReady)
        assert error.kind == "start_list"
