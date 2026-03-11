from dataclasses import dataclass
from pathlib import Path
import sqlite3


SCHEMA_MIGRATIONS_TABLE = "SchemaMigrations"
BASELINE_VERSION = "0001"
MIGRATIONS_DIR = Path(__file__).resolve().parent / "migrations"

EXPECTED_BASELINE_TABLE_COLUMNS = {
    "Countries": {"code", "name", "flag"},
    "Athletes": {"id", "ibu_id", "first_name", "last_name", "country_code", "gender", "discipline"},
    "Users": {"id", "name", "pw_hash", "color"},
    "Disciplines": {"id", "name", "result_url", "events_url", "event_import_mode", "result_mode"},
    "Games": {"id", "name", "discipline", "pw_hash", "owner_id", "visible"},
    "GamePlayers": {"player_id", "game_id"},
    "EventTypes": {"id", "name", "display_name", "discipline_id", "betting_on"},
    "Events": {
        "id",
        "name",
        "location",
        "race_format",
        "game_id",
        "event_type_id",
        "datetime",
        "num_bets",
        "points_correct_bet",
        "allow_partial_points",
        "source_provider",
        "source_event_id",
        "source_race_id",
        "url",
    },
    "Results": {"id", "event_id", "place", "object_id", "time", "behind", "shooting", "shooting_time"},
    "Bets": {"id", "event_id", "user_id", "score"},
    "Predictions": {"id", "bet_id", "predicted_place", "object_id", "actual_place", "score"},
    "DeviceTokens": {
        "id",
        "user_id",
        "device_token",
        "platform",
        "results_notification",
        "reminder_notification",
        "created_at",
        "updated_at",
    },
}
EXPECTED_BASELINE_VIEWS = {
    "VIEW_Athletes",
    "VIEW_Results",
    "VIEW_Events",
    "VIEW_Predictions",
    "VIEW_GamePredictionStats",
}


class MigrationError(RuntimeError):
    pass


@dataclass(frozen=True)
class Migration:
    version: str
    name: str
    path: Path


@dataclass(frozen=True)
class MigrationStatus:
    applied_versions: list[str]
    pending_versions: list[str]

    @property
    def is_current(self):
        return not self.pending_versions


def _open_connection(db_path: str):
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = 1")
    return conn


def _load_migrations():
    migrations = []
    for path in sorted(MIGRATIONS_DIR.glob("*.sql")):
        version, _, raw_name = path.stem.partition("_")
        migrations.append(Migration(version=version, name=raw_name or path.stem, path=path))
    if not migrations:
        raise MigrationError("No migration files were found.")
    return migrations


def _table_exists(conn, table_name: str):
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        [table_name],
    ).fetchone()
    return row is not None


def _view_exists(conn, view_name: str):
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'view' AND name = ?",
        [view_name],
    ).fetchone()
    return row is not None


def _column_names(conn, table_name: str):
    return {row[1] for row in conn.execute(f"PRAGMA table_info({table_name})").fetchall()}


def _user_tables(conn):
    rows = conn.execute(
        """
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name NOT LIKE 'sqlite_%'
          AND name != ?
        """,
        [SCHEMA_MIGRATIONS_TABLE],
    ).fetchall()
    return {row[0] for row in rows}


def _ensure_schema_migrations_table(conn):
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS {SCHEMA_MIGRATIONS_TABLE} (
            version TEXT PRIMARY KEY NOT NULL,
            applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    conn.commit()


def _applied_versions(conn):
    if not _table_exists(conn, SCHEMA_MIGRATIONS_TABLE):
        return []
    rows = conn.execute(
        f"SELECT version FROM {SCHEMA_MIGRATIONS_TABLE} ORDER BY version ASC"
    ).fetchall()
    return [row[0] for row in rows]


def _record_applied_migration(conn, version: str):
    conn.execute(
        f"INSERT OR IGNORE INTO {SCHEMA_MIGRATIONS_TABLE} (version) VALUES (?)",
        [version],
    )
    conn.commit()


def _database_matches_baseline(conn):
    for table_name, expected_columns in EXPECTED_BASELINE_TABLE_COLUMNS.items():
        if not _table_exists(conn, table_name):
            return False
        if not expected_columns.issubset(_column_names(conn, table_name)):
            return False
    for view_name in EXPECTED_BASELINE_VIEWS:
        if not _view_exists(conn, view_name):
            return False
    return True


def _bootstrap_legacy_database(conn, migrations: list[Migration]):
    if _table_exists(conn, SCHEMA_MIGRATIONS_TABLE):
        return

    _ensure_schema_migrations_table(conn)
    if not _user_tables(conn):
        return

    if not _database_matches_baseline(conn):
        raise MigrationError(
            "The database has no migration metadata and does not match the expected baseline schema. "
            "Migrate it manually before starting the app."
        )

    baseline = next((migration for migration in migrations if migration.version == BASELINE_VERSION), None)
    if baseline is None:
        raise MigrationError(f"Baseline migration {BASELINE_VERSION} is missing.")
    _record_applied_migration(conn, baseline.version)


def _apply_sql_migration(conn, migration: Migration):
    sql = migration.path.read_text()
    conn.executescript(sql)
    _record_applied_migration(conn, migration.version)


def migrate_to_latest(db_path: str):
    migrations = _load_migrations()
    conn = _open_connection(db_path)
    try:
        _bootstrap_legacy_database(conn, migrations)
        if not _table_exists(conn, SCHEMA_MIGRATIONS_TABLE):
            _ensure_schema_migrations_table(conn)
        applied_versions = set(_applied_versions(conn))
        for migration in migrations:
            if migration.version in applied_versions:
                continue
            _apply_sql_migration(conn, migration)
            applied_versions.add(migration.version)
        return get_status(db_path)
    finally:
        conn.close()


def get_status(db_path: str):
    migrations = _load_migrations()
    db_file = Path(db_path)
    if not db_file.exists():
        return MigrationStatus(
            applied_versions=[],
            pending_versions=[migration.version for migration in migrations],
        )
    conn = _open_connection(db_path)
    try:
        applied_versions = _applied_versions(conn)
    finally:
        conn.close()
    pending_versions = [
        migration.version for migration in migrations if migration.version not in set(applied_versions)
    ]
    return MigrationStatus(
        applied_versions=applied_versions,
        pending_versions=pending_versions,
    )


def assert_database_current(db_path: str):
    db_file = Path(db_path)
    if not db_file.exists():
        raise MigrationError(
            f"Database file '{db_path}' does not exist. Run migrations before starting the backend."
        )
    status = get_status(db_path)
    if not status.applied_versions:
        raise MigrationError(
            "Database has no recorded migrations. Run migrations before starting the backend."
        )
    if status.pending_versions:
        raise MigrationError(
            "Pending database migrations: "
            + ", ".join(status.pending_versions)
            + ". Run migrations before starting the backend."
        )
    return status
