import argparse
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_ROOT))

from config import load_config
from src.database.migration_runner import MigrationError, assert_database_current, get_status, migrate_to_latest


def parse_args():
    parser = argparse.ArgumentParser(description="Run backend SQLite migrations.")
    parser.add_argument(
        "--env",
        default="prod",
        choices=["dev", "prod", "test"],
        help="Backend environment configuration to load.",
    )
    parser.add_argument(
        "command",
        choices=["up", "status", "check"],
        help="Migration command to execute.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    config = load_config(args.env)
    db_path = config["DB_PATH"]

    try:
        if args.command == "up":
            status = migrate_to_latest(db_path)
            print("Applied migrations. Current state is up to date.")
            print(f"Applied: {', '.join(status.applied_versions) if status.applied_versions else 'none'}")
            return
        if args.command == "status":
            status = get_status(db_path)
            print(f"Applied: {', '.join(status.applied_versions) if status.applied_versions else 'none'}")
            print(f"Pending: {', '.join(status.pending_versions) if status.pending_versions else 'none'}")
            return
        assert_database_current(db_path)
        print("Database migrations are current.")
    except MigrationError as exc:
        print(str(exc))
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
