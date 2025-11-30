from src.models.country import Country


def test_country_save_and_get(base_data, app):
    with app.app_context():
        country = Country(code="USA", name="United States", flag="USA")
        country.save_to_db()

        fetched = Country.get_by_id("USA")
        assert fetched is not None
        assert fetched.name == "United States"
        assert fetched.flag == "USA"


def test_country_to_from_dict(base_data):
    country = Country(code="ITA", name="Italy", flag="ITA")
    c_dict = country.to_dict()
    restored = Country.from_dict(c_dict)
    assert restored.code == country.code
    assert restored.name == country.name
