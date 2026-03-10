import argparse
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_ROOT))

from main import create_app
from src.database import db_manager
from src.ibu_api import IbuApiClient
from src.models.event import Event


def get_future_biathlon_events_missing_source_ids(now=None):
    comparison_time = Event.datetime_to_string(now or Event.current_time())
    sql = f"""
        SELECT
            e.id,
            e.name,
            e.location,
            e.race_format,
            e.datetime,
            et.name AS event_type_name
        FROM {db_manager.TABLE_EVENTS} e
        INNER JOIN {db_manager.TABLE_GAMES} g ON g.id = e.game_id
        INNER JOIN {db_manager.TABLE_EVENT_TYPES} et ON et.id = e.event_type_id
        WHERE g.discipline = 'biathlon'
          AND e.datetime >= ?
          AND COALESCE(TRIM(e.source_race_id), '') = ''
        ORDER BY e.datetime ASC
    """
    return db_manager.query(sql, [comparison_time]) or []


def _event_bucket(event_row):
    event_type_name = (event_row.get("event_type_name") or "").lower()
    if event_type_name == "relay":
        return "relay"
    if event_type_name == "women":
        return "women"
    return "men"


def _race_bucket(race):
    title = " ".join((race.title or "").lower().split())
    gender = (race.gender or "").lower()
    if "relay" in title:
        return "relay"
    if gender in {"w", "women", "female", "ladies"} or "women" in title:
        return "women"
    return "men"


def _normalized_location(event_row):
    return Event.normalize_location(event_row.get("location")) or Event.derive_location_from_name(
        event_row.get("name"),
        "biathlon",
    )


def _normalized_race_format(event_row):
    return Event.normalize_race_format(event_row.get("race_format")) or Event.derive_race_format_from_name(
        event_row.get("name"),
        "biathlon",
    )


def _normalized_race_format_for_race(race):
    return Event.normalize_race_format(race.race_format) or Event.derive_race_format_from_name(
        race.title,
        "biathlon",
    )


def find_matching_races(event_row, races):
    event_datetime = Event.string_to_datetime(event_row["datetime"])
    event_date = event_datetime.date()
    event_location = _normalized_location(event_row)
    event_race_format = _normalized_race_format(event_row)
    event_bucket = _event_bucket(event_row)
    base_matches = [
        race
        for race in races
        if race.starts_at.date() == event_date
        and _race_bucket(race) == event_bucket
        and _normalized_race_format_for_race(race) == event_race_format
    ]
    if not base_matches:
        return []

    exact_datetime_matches = [race for race in base_matches if race.starts_at == event_datetime]
    if len(exact_datetime_matches) == 1:
        return exact_datetime_matches
    if len(exact_datetime_matches) > 1:
        base_matches = exact_datetime_matches

    if event_location:
        exact_location_matches = [
            race
            for race in base_matches
            if Event.normalize_location(race.location) == event_location
        ]
        if exact_location_matches:
            return exact_location_matches

    return base_matches


def build_source_id_updates(event_rows, races):
    updates = []
    ambiguous = []
    unresolved = []
    for event_row in event_rows:
        matches = find_matching_races(event_row, races)
        if len(matches) == 1:
            match = matches[0]
            updates.append(
                {
                    "event_id": event_row["id"],
                    "event_name": event_row["name"],
                    "source_provider": "ibu",
                    "source_event_id": match.event_id,
                    "source_race_id": match.race_id,
                }
            )
            continue
        if len(matches) > 1:
            ambiguous.append(
                {
                    "event_id": event_row["id"],
                    "event_name": event_row["name"],
                    "candidate_race_ids": [race.race_id for race in matches],
                }
            )
            continue
        unresolved.append(
            {
                "event_id": event_row["id"],
                "event_name": event_row["name"],
            }
        )
    return updates, ambiguous, unresolved


def apply_source_id_updates(updates):
    if not updates:
        return 0
    db_manager.execute_many(
        f"""
        UPDATE {db_manager.TABLE_EVENTS}
        SET source_provider = ?, source_event_id = ?, source_race_id = ?
        WHERE id = ?
        """,
        [
            (
                update["source_provider"],
                update["source_event_id"],
                update["source_race_id"],
                update["event_id"],
            )
            for update in updates
        ],
    )
    return len(updates)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Backfill official IBU source ids for future biathlon events.",
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
        event_rows = get_future_biathlon_events_missing_source_ids()
        races = IbuApiClient().get_importable_races()
        updates, ambiguous, unresolved = build_source_id_updates(event_rows, races)

        print(f"Found {len(event_rows)} future biathlon events without official source ids.")
        print(f"Matched {len(updates)} events.")
        print(f"Ambiguous matches: {len(ambiguous)}.")
        print(f"Unresolved matches: {len(unresolved)}.")

        for update in updates:
            print(
                f"{update['event_id']}: {update['source_provider']} "
                f"{update['source_event_id']} / {update['source_race_id']} <- {update['event_name']}"
            )

        if ambiguous:
            print("Ambiguous events:")
            for item in ambiguous:
                print(f"- {item['event_name']} -> {', '.join(item['candidate_race_ids'])}")

        if unresolved:
            print("Unresolved events:")
            for item in unresolved:
                print(f"- {item['event_name']}")

        if args.dry_run:
            print("Dry run enabled. No database changes were written.")
            return

        updated_count = apply_source_id_updates(updates)
        print(f"Updated {updated_count} events.")


if __name__ == "__main__":
    main()
