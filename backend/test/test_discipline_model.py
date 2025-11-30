from src.models.discipline import Discipline


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
