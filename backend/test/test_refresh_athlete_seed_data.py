from refresh_athlete_seed_data import build_seed_rows, write_seed_rows
from src.models.athlete import Athlete


def test_build_seed_rows_replaces_biathlon_csv_with_official_data(monkeypatch):
    monkeypatch.setattr(
        Athlete,
        "get_csv_base_data",
        staticmethod(
            lambda: [
                Athlete(
                    athlete_id=None,
                    ibu_id=None,
                    first_name="Legacy",
                    last_name="Biathlete",
                    country_code="GER",
                    gender="m",
                    discipline="biathlon",
                ),
                Athlete(
                    athlete_id=None,
                    ibu_id=None,
                    first_name="Halvor Egner",
                    last_name="Granerud",
                    country_code="NOR",
                    gender="m",
                    discipline="skispringen",
                ),
            ]
        ),
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

    rows = build_seed_rows()

    assert rows == [
        {
            "ibu_id": "IBU-123",
            "last_name": "Jeanmonnot",
            "first_name": "Lou",
            "country_code": "FRA",
            "gender": "f",
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
    ]


def test_write_seed_rows_persists_ibu_id_header(tmp_path):
    seed_path = tmp_path / "athletes.csv"

    write_seed_rows(
        [
            {
                "ibu_id": "IBU-123",
                "last_name": "Jeanmonnot",
                "first_name": "Lou",
                "country_code": "FRA",
                "gender": "f",
                "discipline": "biathlon",
            }
        ],
        seed_path=seed_path,
    )

    assert seed_path.read_text(encoding="utf-8") == (
        "ibu_id;last_name;first_name;country_code;gender;discipline\n"
        "IBU-123;Jeanmonnot;Lou;FRA;f;biathlon\n"
    )
