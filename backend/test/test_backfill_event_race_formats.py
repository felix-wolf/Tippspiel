from backfill_event_race_formats import (
    build_race_format_updates,
    collect_unresolved_event_names,
)


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


def test_collect_unresolved_race_format_names_returns_unique_sorted_names():
    unresolved = collect_unresolved_event_names(
        [
            {"id": "event-1", "name": "Oberhof - Women Sprint"},
            {"id": "event-2", "name": "Unknown Format"},
            {"id": "event-3", "name": "Unknown Format"},
            {"id": "event-4", "name": "Another Unknown Format"},
        ],
        {"event-1"},
    )

    assert unresolved == ["Another Unknown Format", "Unknown Format"]
