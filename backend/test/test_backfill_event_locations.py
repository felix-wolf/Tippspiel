from backfill_event_locations import build_location_updates


def test_build_location_updates_only_uses_supported_name_patterns():
    updates = build_location_updates(
        [
            {
                "id": "event-1",
                "name": "Oberhof - Men Sprint",
                "location": None,
                "discipline_id": "biathlon",
            },
            {
                "id": "event-2",
                "name": "Custom Event",
                "location": None,
                "discipline_id": "biathlon",
            },
            {
                "id": "event-3",
                "name": "Stage - Final",
                "location": None,
                "discipline_id": "cycling",
            },
        ]
    )

    assert updates == [("Oberhof", "event-1", "Oberhof - Men Sprint")]
