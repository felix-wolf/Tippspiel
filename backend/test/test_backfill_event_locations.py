from backfill_event_locations import build_location_updates, collect_unresolved_event_names


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


def test_collect_unresolved_location_names_returns_unique_sorted_names():
    unresolved = collect_unresolved_event_names(
        [
            {"id": "event-1", "name": "Oberhof - Men Sprint"},
            {"id": "event-2", "name": "Custom Event"},
            {"id": "event-3", "name": "Custom Event"},
            {"id": "event-4", "name": "Another Event"},
        ],
        {"event-1"},
    )

    assert unresolved == ["Another Event", "Custom Event"]
