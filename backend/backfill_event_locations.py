import argparse
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_ROOT))

from main import create_app
from src.database import db_manager
from src.models.event import Event


def get_events_missing_location():
    sql = f"""
        SELECT
            e.id,
            e.name,
            e.location,
            et.discipline_id
        FROM {db_manager.TABLE_EVENTS} e
        INNER JOIN {db_manager.TABLE_EVENT_TYPES} et ON et.id = e.event_type_id
        WHERE COALESCE(TRIM(e.location), '') = ''
        ORDER BY e.datetime ASC
    """
    return db_manager.query(sql) or []


def build_location_updates(event_rows):
    updates = []
    for row in event_rows:
        location = Event.derive_location_from_name(
            row.get("name"),
            row.get("discipline_id"),
        )
        if location:
            updates.append((location, row["id"], row["name"]))
    return updates


def collect_unresolved_event_names(event_rows, resolved_event_ids):
    return sorted(
        {
            row["name"]
            for row in event_rows
            if row["id"] not in resolved_event_ids
        }
    )


def apply_location_updates(updates):
    if not updates:
        return 0
    db_manager.execute_many(
        f"UPDATE {db_manager.TABLE_EVENTS} SET location = ? WHERE id = ?",
        [(location, event_id) for location, event_id, _ in updates],
    )
    return len(updates)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Backfill event.location from existing event names.",
    )
    parser.add_argument(
        "--env",
        default="prod",
        choices=["dev", "prod", "test"],
        help="Backend environment configuration to load.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show the updates that would be applied without writing to the database.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    app = create_app(args.env)

    with app.app_context():
        db_manager.ensure_event_schema()
        event_rows = get_events_missing_location()
        updates = build_location_updates(event_rows)
        unresolved_names = collect_unresolved_event_names(
            event_rows,
            {event_id for _, event_id, _ in updates},
        )

        print(f"Found {len(event_rows)} events without a location.")
        print(f"Derived a location for {len(updates)} events.")
        print(f"Could not derive a location for {len(unresolved_names)} unique event names.")

        for location, event_id, event_name in updates:
            print(f"{event_id}: {location} <- {event_name}")

        if unresolved_names:
            print("Unresolved event names:")
            for event_name in unresolved_names:
                print(f"- {event_name}")

        if args.dry_run:
            print("Dry run enabled. No database changes were written.")
            return

        updated_count = apply_location_updates(updates)
        print(f"Updated {updated_count} events.")


if __name__ == "__main__":
    main()
