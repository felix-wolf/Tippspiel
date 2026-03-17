import argparse
import csv
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_ROOT))

from src.models.athlete import Athlete

ATHLETE_SEED_PATH = BACKEND_ROOT / "src" / "resources" / "athletes.csv"
CSV_FIELDNAMES = ["ibu_id", "last_name", "first_name", "country_code", "gender", "discipline"]


def sorted_seed_rows(athletes):
    rows = []
    for athlete in athletes:
        rows.append(
            {
                "ibu_id": athlete.ibu_id or "",
                "last_name": athlete.last_name,
                "first_name": athlete.first_name,
                "country_code": athlete.country_code,
                "gender": athlete.gender,
                "discipline": athlete.discipline,
            }
        )
    return sorted(
        rows,
        key=lambda row: (
            row["discipline"],
            row["gender"],
            row["last_name"].casefold(),
            row["first_name"].casefold(),
            row["country_code"],
        ),
    )


def build_seed_rows():
    csv_athletes = Athlete.get_csv_base_data()
    non_biathlon_athletes = [athlete for athlete in csv_athletes if athlete.discipline != "biathlon"]

    official_biathlon_athletes = Athlete.get_biathlon_base_data()
    if not official_biathlon_athletes:
        raise RuntimeError("Could not refresh athlete seeds because no official biathlon athletes were loaded.")

    return sorted_seed_rows(non_biathlon_athletes + official_biathlon_athletes)


def write_seed_rows(rows, seed_path: Path = ATHLETE_SEED_PATH):
    with seed_path.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=CSV_FIELDNAMES, delimiter=";")
        writer.writeheader()
        writer.writerows(rows)


def parse_args():
    parser = argparse.ArgumentParser(
        description="Refresh backend athlete seed data from the official biathlon source plus local non-biathlon rows.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate and preview the refresh without writing athletes.csv.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    rows = build_seed_rows()

    print(f"Prepared {len(rows)} athlete seed rows.")
    biathlon_count = sum(1 for row in rows if row["discipline"] == "biathlon")
    print(f"Biathlon rows: {biathlon_count}")
    print(f"Other rows: {len(rows) - biathlon_count}")

    if args.dry_run:
        print("Dry run enabled. No file changes were written.")
        return

    write_seed_rows(rows)
    print(f"Wrote refreshed athlete seeds to {ATHLETE_SEED_PATH}.")


if __name__ == "__main__":
    main()
