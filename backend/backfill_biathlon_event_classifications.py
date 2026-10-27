"""Fill missing shared-race classifications using exact IBU event identities."""

import argparse
from collections import defaultdict
from datetime import datetime
import sys

import requests
from flask import Flask

from config import load_config
from src.database import db_manager
from src.database.migration_runner import assert_database_current
from src.ibu_api import IbuApiClient, IbuApiError


def get_events_missing_classifications():
    return db_manager.query(
        f"""
        SELECT id, datetime, season_id, source_event_id, source_level, source_event_classification_id
        FROM {db_manager.TABLE_SHARED_EVENTS}
        WHERE source_provider = 'ibu'
          AND (season_id IS NULL OR source_level IS NULL OR source_event_classification_id IS NULL)
        ORDER BY season_id, source_event_id, id
        """
    )


def candidate_season_id(row):
    if row["season_id"]:
        return row["season_id"]
    try:
        race_date = datetime.fromisoformat(row.get("datetime") or "")
    except (ValueError, TypeError):
        return None
    # This is only a lookup hint: the exact parent event must also be returned
    # by the official API for this season before any metadata is written.
    start_year = race_date.year if race_date.month >= 5 else race_date.year - 1
    return IbuApiClient.format_season_id(start_year)


def build_classification_updates(rows, client):
    """Fetch everything before returning updates verified by official event IDs."""
    official = defaultdict(list)
    seasons = sorted({season for row in rows
                      if row["source_event_id"] and (season := candidate_season_id(row))})
    for season in seasons:
        for event in client.get_events_for_season(season):
            official[(event.season_id, event.event_id)].append(event)

    updates, unresolved, conflicts = [], [], []
    for row in rows:
        season = candidate_season_id(row)
        candidates = official.get((season, row["source_event_id"]), [])
        values = {(event.level, event.event_classification_id) for event in candidates}
        if not values:
            unresolved.append(row["id"])
            continue
        if len(values) != 1:
            conflicts.append(row["id"])
            continue
        level, classification = next(iter(values))
        if any(saved is not None and incoming is not None and saved != incoming for saved, incoming in (
            (row["source_level"], level),
            (row["source_event_classification_id"], classification),
        )):
            conflicts.append(row["id"])
            continue
        if level is None or classification is None:
            unresolved.append(row["id"])
            continue
        updates.append({**row, "season_id": season, "source_level": level,
                        "source_event_classification_id": classification})
    return updates, unresolved, conflicts


def apply_classification_updates(updates):
    if not updates:
        return 0
    conn = db_manager.start_transaction()
    try:
        count = 0
        for update in updates:
            cursor = conn.execute(
                f"""
                UPDATE {db_manager.TABLE_SHARED_EVENTS}
                SET season_id = COALESCE(season_id, ?),
                    source_level = COALESCE(source_level, ?),
                    source_event_classification_id = COALESCE(source_event_classification_id, ?)
                WHERE id = ? AND source_provider = 'ibu'
                  AND (season_id IS NULL OR season_id = ?) AND source_event_id = ?
                  AND (season_id IS NULL OR source_level IS NULL OR source_event_classification_id IS NULL)
                  AND (source_level IS NULL OR source_level = ?)
                  AND (source_event_classification_id IS NULL OR source_event_classification_id = ?)
                """,
                [update["season_id"], update["source_level"], update["source_event_classification_id"], update["id"],
                 update["season_id"], update["source_event_id"], update["source_level"],
                 update["source_event_classification_id"]],
            )
            count += cursor.rowcount
        db_manager.commit_transaction(conn)
        return count
    except Exception:
        db_manager.rollback_transaction(conn)
        raise
    finally:
        conn.close()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--env", default="prod", choices=["dev", "prod", "test"])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args(argv)
    # Avoid application startup writes (admin sync) and Firebase initialization,
    # so --dry-run only reads the database and the IBU API.
    app = Flask(__name__)
    app.config.update(load_config(args.env))
    assert_database_current(app.config["DB_PATH"])
    with app.app_context():
        rows = get_events_missing_classifications()
        try:
            updates, unresolved, conflicts = build_classification_updates(rows, IbuApiClient())
        except (IbuApiError, requests.RequestException) as exc:
            print(f"IBU fetch failed; no classifications written: {exc}", file=sys.stderr)
            return 1
        print(f"Checked {len(rows)} shared races; matched {len(updates)}; "
              f"unresolved {len(unresolved)}; conflicts {len(conflicts)}.")
        for update in updates:
            print(f"{update['id']}: season {update['season_id']}, level {update['source_level']}, "
                  f"classification {update['source_event_classification_id']}")
        rows_by_id = {row["id"]: row for row in rows}
        for shared_id in unresolved:
            row = rows_by_id[shared_id]
            season = candidate_season_id(row)
            if not row["source_event_id"]:
                reason = "missing source_event_id"
            elif not season:
                reason = "missing season_id and no valid race date"
            else:
                reason = f"no complete IBU metadata for event {row['source_event_id']} in season {season}"
            print(f"Unresolved: {shared_id} ({reason})")
        for shared_id in conflicts:
            print(f"Conflict: {shared_id}")
        if args.dry_run:
            print("Dry run; no classifications written.")
        else:
            print(f"Updated {apply_classification_updates(updates)} shared races.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
