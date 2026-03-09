import argparse
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_ROOT))

from main import create_app
from src.database import db_manager
from src.models.event import Event


def get_events_missing_race_format():
    sql = f"""
        SELECT
            e.id,
            e.name,
            e.race_format,
            et.discipline_id
        FROM {db_manager.TABLE_EVENTS} e
        INNER JOIN {db_manager.TABLE_EVENT_TYPES} et ON et.id = e.event_type_id
        WHERE COALESCE(TRIM(e.race_format), '') = ''
        ORDER BY e.datetime ASC
    """
    return db_manager.query(sql) or []


def build_race_format_updates(event_rows):
    updates = []
    for row in event_rows:
        race_format = Event.derive_race_format_from_name(
            row.get("name"),
            row.get("discipline_id"),
        )
        if race_format:
            updates.append((race_format, row["id"], row["name"]))
    return updates


def apply_race_format_updates(updates):
    if not updates:
        return 0
    db_manager.execute_many(
        f"UPDATE {db_manager.TABLE_EVENTS} SET race_format = ? WHERE id = ?",
        [(race_format, event_id) for race_format, event_id, _ in updates],
    )
    return len(updates)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Backfill event.race_format from existing event names.",
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
        event_rows = get_events_missing_race_format()
        updates = build_race_format_updates(event_rows)

        print(f"Found {len(event_rows)} events without a race_format.")
        print(f"Derived a race format for {len(updates)} events.")

        for race_format, event_id, event_name in updates:
            print(f"{event_id}: {race_format} <- {event_name}")

        if args.dry_run:
            print("Dry run enabled. No database changes were written.")
            return

        updated_count = apply_race_format_updates(updates)
        print(f"Updated {updated_count} events.")


if __name__ == "__main__":
    main()
