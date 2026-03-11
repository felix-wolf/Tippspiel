import sqlite3
from pathlib import Path

import pytest

from main import create_app
from src.database.migration_runner import MigrationError, assert_database_current, migrate_to_latest


def _configure_test_env(monkeypatch, db_path: Path):
    monkeypatch.setenv("TIPPSPIEL_SECRET_KEY", "test-secret-key")
    monkeypatch.setenv("TIPPSPIEL_PASSWORD_SALT", "test-password-salt")
    monkeypatch.setenv("TIPPSPIEL_TESTING", "1")
    monkeypatch.setenv("TIPPSPIEL_DB_PATH", str(db_path))
    monkeypatch.delenv("TIPPSPIEL_FIREBASE_CREDENTIALS_PATH", raising=False)


def test_migrate_to_latest_initializes_fresh_database(tmp_path):
    db_path = tmp_path / "fresh.db"

    status = migrate_to_latest(str(db_path))

    assert status.applied_versions == ["0001", "0002", "0003", "0004", "0005"]
    assert status.pending_versions == []

    conn = sqlite3.connect(db_path)
    try:
        tables = {
            row[0]
            for row in conn.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
            ).fetchall()
        }
    finally:
        conn.close()

    assert "SchemaMigrations" in tables
    assert "Events" in tables
    assert "SharedEvents" in tables
    assert "Results" in tables

    conn = sqlite3.connect(db_path)
    try:
        event_columns = {
            row[1] for row in conn.execute("PRAGMA table_info(Events)").fetchall()
        }
        indexes = {
            row[1] for row in conn.execute("PRAGMA index_list(Events)").fetchall()
        }
    finally:
        conn.close()

    assert "season_id" in event_columns
    assert "shared_event_id" in event_columns
    assert "idx_events_game_shared_identity" in indexes

    conn = sqlite3.connect(db_path)
    try:
        user_columns = {
            row[1] for row in conn.execute("PRAGMA table_info(Users)").fetchall()
        }
    finally:
        conn.close()

    assert "is_admin" in user_columns


def test_migrate_to_latest_bootstraps_existing_schema_and_applies_data_migration(tmp_path):
    db_path = tmp_path / "legacy.db"
    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(
            """
            CREATE TABLE Countries (
                code TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                flag TEXT NOT NULL
            );

            CREATE TABLE Athletes (
                 id TEXT PRIMARY KEY NOT NULL,
                 ibu_id TEXT UNIQUE,
                 first_name TEXT NOT NULL,
                 last_name TEXT NOT NULL,
                 country_code TEXT NOT NULL,
                 gender TEXT NOT NULL,
                 discipline TEXT NOT NULL,
                 FOREIGN KEY(discipline) REFERENCES Disciplines(id) ON DELETE CASCADE
            );

            CREATE VIEW VIEW_Athletes AS
                SELECT a.*, c.flag FROM Athletes a
                LEFT JOIN Countries c ON a.country_code = c.code;

            CREATE TABLE Users (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT UNIQUE NOT NULL,
                pw_hash TEXT NOT NULL,
                color TEXT
            );

            CREATE TABLE Disciplines (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                result_url TEXT,
                events_url TEXT,
                event_import_mode TEXT NOT NULL DEFAULT 'manual',
                result_mode TEXT NOT NULL DEFAULT 'manual'
            );

            CREATE TABLE Games (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                discipline TEXT NOT NULL,
                pw_hash TEXT,
                owner_id TEXT NOT NULL,
                visible INTEGER NOT NULL DEFAULT 1,
                FOREIGN KEY(owner_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY(discipline) REFERENCES Disciplines(id) ON DELETE CASCADE
            );

            CREATE TABLE GamePlayers (
                player_id NOT NULL,
                game_id NOT NULL,
                PRIMARY KEY (player_id, game_id),
                FOREIGN KEY(player_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY(game_id) REFERENCES Games(id) ON DELETE CASCADE
            );

            CREATE TABLE EventTypes (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                display_name TEXT NOT NULL,
                discipline_id TEXT NOT NULL,
                betting_on TEXT NOT NULL,
                FOREIGN KEY(discipline_id) REFERENCES Disciplines(id) ON DELETE CASCADE
            );

            CREATE TABLE Events (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                location TEXT,
                race_format TEXT,
                game_id TEXT NOT NULL,
                event_type_id TEXT NOT NULL,
                datetime DATETIME NOT NULL,
                num_bets INTEGER NOT NULL DEFAULT 5,
                points_correct_bet INTEGER NOT NULL DEFAULT 5,
                allow_partial_points INTEGER NOT NULL DEFAULT 1,
                source_provider TEXT,
                source_event_id TEXT,
                source_race_id TEXT,
                url TEXT DEFAULT NULL,
                FOREIGN KEY(event_type_id) REFERENCES EventTypes(id) ON DELETE CASCADE,
                FOREIGN KEY(game_id) REFERENCES Games(id) ON DELETE CASCADE
            );

            CREATE TABLE Results (
                id TEXT PRIMARY KEY NOT NULL,
                event_id NOT NULL,
                place INTEGER NOT NULL,
                object_id TEXT NOT NULL,
                time TEXT DEFAULT NULL,
                behind TEXT DEFAULT NULL,
                shooting TEXT DEFAULT NULL,
                shooting_time TEXT DEFAULT NULL,
                FOREIGN KEY(event_id) REFERENCES Events(id) ON DELETE CASCADE
            );

            CREATE VIEW VIEW_Results AS
                SELECT
                    r.*,
                    CASE
                        WHEN va.id IS NOT NULL THEN va.flag || '  ' || va.first_name || ' ' || va.last_name
                        WHEN c.code IS NOT NULL THEN c.flag || '  ' || c.name
                        ELSE 'unknown'
                    END AS 'object_name'
                FROM Results r
                LEFT JOIN VIEW_Athletes va ON r.object_id = va.id
                LEFT JOIN Countries c ON r.object_id = c.code;

            CREATE TABLE Bets (
                id TEXT PRIMARY KEY NOT NULL,
                event_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                score INTEGER,
                FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE,
                FOREIGN KEY(event_id) REFERENCES Events(id) ON DELETE CASCADE
            );

            CREATE TABLE Predictions (
                id TEXT PRIMARY KEY NOT NULL,
                bet_id TEXT NOT NULL,
                predicted_place INTEGER NOT NULL,
                object_id TEXT NOT NULL,
                actual_place INTEGER,
                score INTEGER,
                FOREIGN KEY(bet_id) REFERENCES Bets(id) ON DELETE CASCADE
            );

            CREATE VIEW VIEW_Predictions AS
                SELECT
                    p.*,
                    CASE
                        WHEN va.id IS NOT NULL THEN va.flag || '  ' || va.first_name || ' ' || va.last_name
                        WHEN c.code IS NOT NULL THEN c.flag || '  ' || c.name
                        ELSE 'unknown'
                    END AS 'object_name'
                FROM Predictions p
                LEFT JOIN VIEW_Athletes va ON p.object_id = va.id
                LEFT JOIN Countries c ON p.object_id = c.code;

            CREATE VIEW VIEW_Events AS
                SELECT e.*, g.discipline, COUNT(b.id) > 0 as has_bets
                FROM Events e
                INNER JOIN Games g on e.game_id = g.id
                LEFT JOIN Bets b ON e.id = b.event_id
                GROUP BY e.id
                ORDER BY e.datetime;

            CREATE VIEW VIEW_GamePredictionStats AS
                SELECT
                    g.id AS game_id,
                    g.name AS game_name,
                    g.discipline AS discipline_id,
                    e.id AS event_id,
                    e.name AS event_name,
                    e.location AS event_location,
                    e.race_format AS event_race_format,
                    e.datetime AS event_datetime,
                    e.num_bets,
                    e.points_correct_bet,
                    e.allow_partial_points,
                    et.id AS event_type_id,
                    et.name AS event_type_name,
                    et.display_name AS event_type_display_name,
                    b.id AS bet_id,
                    b.user_id,
                    u.name AS user_name,
                    COALESCE(b.score, 0) AS bet_score,
                    p.id AS prediction_id,
                    p.object_id,
                    vp.object_name,
                    p.predicted_place,
                    p.actual_place,
                    COALESCE(p.score, 0) AS prediction_score,
                    CASE
                        WHEN p.actual_place IS NOT NULL AND p.actual_place = p.predicted_place THEN 1
                        ELSE 0
                    END AS is_exact_hit,
                    CASE
                        WHEN p.actual_place IS NOT NULL AND COALESCE(p.score, 0) > 0 THEN 1
                        ELSE 0
                    END AS is_scoring_pick
                FROM Predictions p
                INNER JOIN Bets b ON b.id = p.bet_id
                INNER JOIN Events e ON e.id = b.event_id
                INNER JOIN Games g ON g.id = e.game_id
                INNER JOIN Users u ON u.id = b.user_id
                INNER JOIN EventTypes et ON et.id = e.event_type_id
                LEFT JOIN VIEW_Predictions vp ON vp.id = p.id;

            CREATE TABLE DeviceTokens (
                id TEXT PRIMARY KEY NOT NULL,
                user_id TEXT NOT NULL,
                device_token TEXT NOT NULL,
                platform TEXT,
                results_notification INTEGER DEFAULT 0,
                reminder_notification INTEGER DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
            );
            """
        )
        conn.execute(
            """
            INSERT INTO Disciplines (id, name, result_url, events_url, event_import_mode, result_mode)
            VALUES ('biathlon', 'Biathlon', 'legacy-results', 'legacy-events', 'manual', 'manual')
            """
        )
        conn.commit()
    finally:
        conn.close()

    status = migrate_to_latest(str(db_path))

    assert status.applied_versions == ["0001", "0002", "0003", "0004", "0005"]

    conn = sqlite3.connect(db_path)
    try:
        discipline = conn.execute(
            """
            SELECT result_url, events_url, event_import_mode, result_mode
            FROM Disciplines
            WHERE id = 'biathlon'
            """
        ).fetchone()
    finally:
        conn.close()

    assert discipline == ("biathlonworld.com/results", None, "official_api", "official_api")

    conn = sqlite3.connect(db_path)
    try:
        event_columns = {
            row[1] for row in conn.execute("PRAGMA table_info(Events)").fetchall()
        }
    finally:
        conn.close()

    assert "season_id" in event_columns
    assert "shared_event_id" in event_columns


def test_create_app_fails_when_migrations_are_pending(tmp_path, monkeypatch):
    db_path = tmp_path / "pending.db"
    _configure_test_env(monkeypatch, db_path)

    migrate_to_latest(str(db_path))

    conn = sqlite3.connect(db_path)
    try:
        conn.execute("DELETE FROM SchemaMigrations WHERE version = '0002'")
        conn.commit()
    finally:
        conn.close()

    with pytest.raises(MigrationError, match="Pending database migrations: 0002"):
        create_app("test")


def test_assert_database_current_accepts_fully_migrated_database(tmp_path):
    db_path = tmp_path / "current.db"

    migrate_to_latest(str(db_path))
    status = assert_database_current(str(db_path))

    assert status.is_current is True


def test_shared_official_event_identity_is_enforced_globally_but_attachable_to_multiple_games(tmp_path):
    db_path = tmp_path / "unique.db"

    migrate_to_latest(str(db_path))

    conn = sqlite3.connect(db_path)
    try:
        conn.execute("INSERT INTO Disciplines (id, name) VALUES ('biathlon', 'Biathlon')")
        conn.execute(
            """
            INSERT INTO EventTypes (id, name, display_name, discipline_id, betting_on)
            VALUES ('event-type-1', 'women', 'Women', 'biathlon', 'athletes')
            """
        )
        conn.execute("INSERT INTO Users (id, name, pw_hash) VALUES ('user-1', 'user-1', 'hash')")
        conn.execute(
            """
            INSERT INTO Games (id, name, discipline, owner_id, visible)
            VALUES ('game-1', 'Game 1', 'biathlon', 'user-1', 1)
            """
        )
        conn.execute(
            """
            INSERT INTO Games (id, name, discipline, owner_id, visible)
            VALUES ('game-2', 'Game 2', 'biathlon', 'user-1', 1)
            """
        )
        conn.execute(
            """
            INSERT INTO SharedEvents (
                id, name, event_type_id, datetime, source_provider, source_event_id, source_race_id, season_id
            )
            VALUES ('official:ibu:race-source-1', 'Race 1', 'event-type-1', '2026-01-01 12:00:00', 'ibu', 'event-source-1', 'race-source-1', '2526')
            """
        )
        conn.execute(
            """
            INSERT INTO Events (
                id, name, game_id, event_type_id, datetime, source_provider, source_event_id, source_race_id, season_id, shared_event_id
            )
            VALUES ('event-1', 'Race 1', 'game-1', 'event-type-1', '2026-01-01 12:00:00', 'ibu', 'event-source-1', 'race-source-1', '2526', 'official:ibu:race-source-1')
            """
        )
        conn.execute(
            """
            INSERT INTO Events (
                id, name, game_id, event_type_id, datetime, source_provider, source_event_id, source_race_id, season_id, shared_event_id
            )
            VALUES ('event-2', 'Race 1', 'game-2', 'event-type-1', '2026-01-01 12:00:00', 'ibu', 'event-source-1', 'race-source-1', '2526', 'official:ibu:race-source-1')
            """
        )
        with pytest.raises(sqlite3.IntegrityError):
            conn.execute(
                """
                INSERT INTO SharedEvents (
                    id, name, event_type_id, datetime, source_provider, source_event_id, source_race_id, season_id
                )
                VALUES ('official:ibu:race-source-2', 'Race 2', 'event-type-1', '2026-01-02 12:00:00', 'ibu', 'event-source-2', 'race-source-1', '2526')
                """
            )
        with pytest.raises(sqlite3.IntegrityError):
            conn.execute(
                """
                INSERT INTO Events (
                    id, name, game_id, event_type_id, datetime, source_provider, source_event_id, source_race_id, season_id, shared_event_id
                )
                VALUES ('event-3', 'Race 1', 'game-1', 'event-type-1', '2026-01-01 12:00:00', 'ibu', 'event-source-1', 'race-source-1', '2526', 'official:ibu:race-source-1')
                """
            )
    finally:
        conn.close()
