from backfill_event_race_formats import build_race_format_updates


def test_build_race_format_updates_extracts_known_biathlon_formats():
    updates = build_race_format_updates(
        [
            {
                "id": "event-1",
                "name": "Oberhof - Women Sprint",
                "race_format": None,
                "discipline_id": "biathlon",
            },
            {
                "id": "event-2",
                "name": "Antholz - Men Mass Start",
                "race_format": None,
                "discipline_id": "biathlon",
            },
            {
                "id": "event-3",
                "name": "Stage - Final",
                "race_format": None,
                "discipline_id": "cycling",
            },
        ]
    )

    assert updates == [
        ("sprint", "event-1", "Oberhof - Women Sprint"),
        ("mass start", "event-2", "Antholz - Men Mass Start"),
    ]
