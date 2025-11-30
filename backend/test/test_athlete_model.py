from src.models.athlete import Athlete
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
