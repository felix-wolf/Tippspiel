from datetime import datetime

from src.models.athlete import Athlete
from src.ibu_api import IbuAthleteRow, IbuRace, IbuResultRow
from src.database import db_manager
from src.utils import generate_id


def test_athlete_save_and_get(base_data, app):
    with app.app_context():
        athlete = Athlete(
            athlete_id=None,
            first_name="Anna",
            last_name="Alp",
            country_code=base_data["country"].code,
            gender="f",
            discipline=base_data["discipline"].id,
        )
        athlete.save_to_db()

        fetched = Athlete.get_by_id(athlete.id)
        assert fetched is not None
        assert fetched.first_name == "Anna"
        assert fetched.country_code == base_data["country"].code


def test_athlete_equality_hash(base_data):
    athlete_id = generate_id(["Doe", "Jane", base_data["country"].code])
    a1 = Athlete(
        athlete_id=athlete_id,
        first_name="Jane",
        last_name="Doe",
        country_code=base_data["country"].code,
        gender="f",
        discipline=base_data["discipline"].id,
    )
    a2 = Athlete(
        athlete_id=athlete_id,
        first_name="Jane",
        last_name="Doe",
        country_code=base_data["country"].code,
        gender="f",
        discipline=base_data["discipline"].id,
    )

    assert a1 == a2
    assert len({a1, a2}) == 1


def test_get_biathlon_base_data_combines_export_and_results():
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
                    season_id=season_id,
                    event_id="event-1",
                    race_id="race-1",
                    location="Oberhof",
                    title="Women Sprint",
                    starts_at=datetime(2026, 1, 1, 12, 0, 0),
                    gender="W",
                ),
                IbuRace(
                    season_id=season_id,
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

    athletes = Athlete.get_biathlon_base_data(
        client=_FakeClient(),
        now=datetime(2026, 3, 10, 12, 0, 0),
    )

    assert {(athlete.first_name, athlete.last_name, athlete.gender) for athlete in athletes} == {
        ("Lou", "Jeanmonnot", "f"),
        ("Maren", "Kirkeeide", "f"),
    }
    assert {athlete.ibu_id for athlete in athletes} == {"IBU-1", "IBU-2"}


def test_get_base_data_prefers_official_biathlon_seed(monkeypatch):
    monkeypatch.setattr(
        db_manager,
        "load_csv",
        lambda file_name, generate_id=False: [
            {
                "ibu_id": "",
                "last_name": "Legacy",
                "first_name": "Biathlete",
                "country_code": "GER",
                "gender": "m",
                "discipline": "biathlon",
            },
            {
                "ibu_id": "",
                "last_name": "Granerud",
                "first_name": "Halvor Egner",
                "country_code": "NOR",
                "gender": "m",
                "discipline": "skispringen",
            },
        ],
    )
    monkeypatch.setattr(
        Athlete,
        "get_biathlon_base_data",
        staticmethod(
            lambda client=None, now=None: [
                Athlete(
                    athlete_id=None,
                    ibu_id="IBU-123",
                    first_name="Lou",
                    last_name="Jeanmonnot",
                    country_code="FRA",
                    gender="f",
                    discipline="biathlon",
                )
            ]
        ),
    )

    athletes = Athlete.get_base_data()

    assert {(athlete.first_name, athlete.last_name, athlete.discipline) for athlete in athletes} == {
        ("Lou", "Jeanmonnot", "biathlon"),
        ("Halvor Egner", "Granerud", "skispringen"),
    }


def test_get_base_data_falls_back_to_csv_when_official_seed_is_unavailable(monkeypatch):
    monkeypatch.setattr(
        db_manager,
        "load_csv",
        lambda file_name, generate_id=False: [
            {
                "ibu_id": "IBU-LEGACY",
                "last_name": "Legacy",
                "first_name": "Biathlete",
                "country_code": "GER",
                "gender": "m",
                "discipline": "biathlon",
            }
        ],
    )
    monkeypatch.setattr(
        Athlete,
        "get_biathlon_base_data",
        staticmethod(lambda client=None, now=None: []),
    )

    athletes = Athlete.get_base_data()

    assert [(athlete.first_name, athlete.last_name, athlete.discipline) for athlete in athletes] == [
        ("Biathlete", "Legacy", "biathlon")
    ]
    assert athletes[0].ibu_id == "IBU-LEGACY"


def test_get_csv_base_data_never_fetches_official_biathlon_seed(monkeypatch):
    monkeypatch.setattr(
        db_manager,
        "load_csv",
        lambda file_name, generate_id=False: [
            {
                "ibu_id": "IBU-123",
                "last_name": "Legacy",
                "first_name": "Biathlete",
                "country_code": "GER",
                "gender": "m",
                "discipline": "biathlon",
            }
        ],
    )
    monkeypatch.setattr(
        Athlete,
        "get_biathlon_base_data",
        staticmethod(lambda client=None, now=None: (_ for _ in ()).throw(AssertionError("should not fetch"))),
    )

    athletes = Athlete.get_csv_base_data()

    assert [(athlete.first_name, athlete.last_name, athlete.ibu_id) for athlete in athletes] == [
        ("Biathlete", "Legacy", "IBU-123")
    ]
