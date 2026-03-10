import argparse
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_ROOT))

from main import create_app
from src.database import db_manager
from src.ibu_api import IbuApiClient, IbuApiError, IbuAthleteRow
from src.models.athlete import Athlete


def get_biathlon_athletes_missing_ibu_id():
    sql = f"""
        SELECT *
        FROM {db_manager.TABLE_ATHLETES}
        WHERE discipline = 'biathlon'
          AND COALESCE(TRIM(ibu_id), '') = ''
        ORDER BY last_name ASC, first_name ASC
    """
    rows = db_manager.query(sql) or []
    return [Athlete.from_dict(row) for row in rows]


def normalize_gender(value: str | None):
    normalized = (value or "").strip().lower()
    if normalized in {"w", "women", "female", "f"} or normalized.startswith("w") or normalized.endswith("w"):
        return "f"
    if normalized in {"m", "men", "male"} or normalized.startswith("m") or normalized.endswith("m"):
        return "m"
    return "?"


def build_athlete_id_updates(local_athletes, official_athletes):
    official_by_key = {}
    official_by_identity = {}
    for official_athlete in official_athletes:
        identity_key = (
            (official_athlete.first_name or "").strip().lower(),
            (official_athlete.last_name or "").strip().lower(),
            (official_athlete.nation_code or "").strip().upper(),
        )
        key = (
            *identity_key,
            normalize_gender(official_athlete.gender),
        )
        official_by_key[key] = official_athlete
        official_by_identity.setdefault(identity_key, []).append(official_athlete)

    updates = []
    unresolved = []
    for athlete in local_athletes:
        key = (
            athlete.first_name.strip().lower(),
            athlete.last_name.strip().lower(),
            athlete.country_code.strip().upper(),
            athlete.gender.strip().lower(),
        )
        official_match = official_by_key.get(key)
        if official_match is None and athlete.gender == "?":
            identity_matches = official_by_identity.get(key[:-1], [])
            if len(identity_matches) == 1:
                official_match = identity_matches[0]
        if official_match is None or not official_match.athlete_id:
            unresolved.append(athlete)
            continue
        updates.append((official_match.athlete_id, athlete.id, athlete.first_name, athlete.last_name))
    return updates, unresolved


def season_ids_for_backfill(now=None):
    current_season_id = IbuApiClient.current_season_id(now=now)
    current_start_year = 2000 + int(current_season_id[:2])
    return [
        IbuApiClient.format_season_id(current_start_year - 1),
        current_season_id,
    ]


def official_athletes_from_race_results(client: IbuApiClient, season_ids):
    athletes_by_id = {}
    for season_id in season_ids:
        for official_athlete in client.get_athletes(season_id):
            if official_athlete.athlete_id:
                athletes_by_id[official_athlete.athlete_id] = official_athlete

        for race in client.get_races_for_season(season_id):
            if "relay" in (race.title or "").lower():
                continue
            try:
                results = client.get_results(race.race_id)
            except IbuApiError:
                continue
            race_gender = normalize_gender(race.gender)
            for result in results:
                if not result.athlete_id or not result.first_name or not result.last_name or not result.nation_code:
                    continue
                existing_athlete = athletes_by_id.get(result.athlete_id)
                updated_athlete = IbuAthleteRow(
                    athlete_id=result.athlete_id,
                    first_name=result.first_name,
                    last_name=result.last_name,
                    nation_code=result.nation_code,
                    gender=race_gender,
                )
                if existing_athlete and normalize_gender(existing_athlete.gender) != "?" and race_gender == "?":
                    updated_athlete = existing_athlete
                athletes_by_id[result.athlete_id] = updated_athlete
    return list(athletes_by_id.values())


def apply_athlete_id_updates(updates):
    if not updates:
        return 0
    db_manager.execute_many(
        f"UPDATE {db_manager.TABLE_ATHLETES} SET ibu_id = ? WHERE id = ?",
        [(ibu_id, athlete_id) for ibu_id, athlete_id, _, _ in updates],
    )
    return len(updates)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Backfill official IBU athlete ids for local biathlon athletes.",
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
        db_manager.ensure_athlete_schema()
        local_athletes = get_biathlon_athletes_missing_ibu_id()
        client = IbuApiClient()
        official_athletes = official_athletes_from_race_results(
            client,
            season_ids_for_backfill(),
        )
        updates, unresolved = build_athlete_id_updates(local_athletes, official_athletes)

        print(f"Found {len(local_athletes)} local biathlon athletes without an official IBU id.")
        print(f"Matched {len(updates)} athletes.")
        print(f"Unresolved matches: {len(unresolved)}.")

        for ibu_id, athlete_id, first_name, last_name in updates:
            print(f"{athlete_id}: {ibu_id} <- {first_name} {last_name}")

        if unresolved:
            print("Unresolved athletes:")
            for athlete in unresolved:
                print(f"- {athlete.first_name} {athlete.last_name} ({athlete.country_code})")

        if args.dry_run:
            print("Dry run enabled. No database changes were written.")
            return

        updated_count = apply_athlete_id_updates(updates)
        print(f"Updated {updated_count} athletes.")


if __name__ == "__main__":
    main()
