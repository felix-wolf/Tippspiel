from src.models.event_type import EventType


def test_event_type_save_and_get(base_data, app):
    with app.app_context():
        etype = EventType(
            name="relay",
            display_name="Relay",
            discipline_id=base_data["discipline"].id,
            betting_on="countries",
        )
        etype.save_to_db()

        fetched = EventType.get_by_id(etype.id)
        assert fetched is not None
        assert fetched.name == "relay"
        assert fetched.betting_on == "countries"


def test_event_type_to_dict_roundtrip(base_data):
    etype = base_data["event_type"]
    restored = EventType.from_dict(etype.to_dict())
    assert restored.id == etype.id
    assert restored.display_name == etype.display_name
