import sqlite3

from populate_db import populate_db


def test_populate_db_inserts_seed_athletes_into_target_database(monkeypatch, tmp_path):
    db_path = tmp_path / "seed.db"

    class _StubDiscipline:
        id = "biathlon"
        name = "Biathlon"
        event_import_mode = "official_api"
        result_mode = "official_api"

    class _StubCountry:
        code = "FRA"
        name = "France"
        flag = "FRA"

    class _StubAthlete:
        id = "athlete-1"
        ibu_id = "IBU-1"
        first_name = "Lou"
        last_name = "Jeanmonnot"
        country_code = "FRA"
        gender = "f"
        discipline = "biathlon"

    monkeypatch.setattr("populate_db.EventType.get_base_data", staticmethod(lambda: []))
    monkeypatch.setattr("populate_db.Discipline.get_base_data", staticmethod(lambda: [_StubDiscipline()]))
    monkeypatch.setattr("populate_db.Country.get_base_data", staticmethod(lambda: [_StubCountry()]))
    monkeypatch.setattr("populate_db.Athlete.get_base_data", staticmethod(lambda: [_StubAthlete()]))

    populate_db(str(db_path))

    conn = sqlite3.connect(db_path)
    try:
        row = conn.execute(
            """
            SELECT id, ibu_id, first_name, last_name, country_code, gender, discipline
            FROM Athletes
            """
        ).fetchone()
    finally:
        conn.close()

    assert row == ("athlete-1", "IBU-1", "Lou", "Jeanmonnot", "FRA", "f", "biathlon")
