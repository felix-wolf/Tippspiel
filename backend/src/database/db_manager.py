import csv
import logging
import sqlite3
import src.utils as utils
from flask import current_app, has_app_context

TABLE_ATHLETES = "Athletes"
TABLE_GAMES = "Games"
TABLE_GAME_PLAYERS = "GamePlayers"
TABLE_COUNTRIES = "Countries"
TABLE_USERS = "Users"
TABLE_EVENTS = "Events"
TABLE_SHARED_EVENTS = "SharedEvents"
TABLE_EVENT_TYPES = "EventTypes"
TABLE_BETS = "Bets"
TABLE_PREDICTIONS = "Predictions"
TABLE_DISCIPLINES = "Disciplines"
TABLE_RESULTS = "Results"
TABLE_DEVICE_TOKENS = "DeviceTokens"
TABLE_ADMIN_OPERATIONS = "AdminOperations"
VIEW_EVENTS_SQL = f"""
CREATE VIEW VIEW_{TABLE_EVENTS} AS
    SELECT
        e.id,
        COALESCE(se.name, e.name) AS name,
        COALESCE(se.location, e.location) AS location,
        COALESCE(se.race_format, e.race_format) AS race_format,
        e.game_id,
        COALESCE(se.event_type_id, e.event_type_id) AS event_type_id,
        COALESCE(se.datetime, e.datetime) AS datetime,
        e.num_bets,
        e.points_correct_bet,
        e.allow_partial_points,
        COALESCE(se.source_provider, e.source_provider) AS source_provider,
        COALESCE(se.source_event_id, e.source_event_id) AS source_event_id,
        COALESCE(se.source_race_id, e.source_race_id) AS source_race_id,
        COALESCE(se.season_id, e.season_id) AS season_id,
        e.shared_event_id,
        g.discipline
    FROM {TABLE_EVENTS} e
    LEFT JOIN {TABLE_SHARED_EVENTS} se ON se.id = e.shared_event_id
    INNER JOIN {TABLE_GAMES} g on e.game_id = g.id
    ORDER BY COALESCE(se.datetime, e.datetime)
"""
VIEW_GAME_PREDICTION_STATS_SQL = f"""
CREATE VIEW VIEW_GamePredictionStats AS
    SELECT
        g.id AS game_id,
        g.name AS game_name,
        g.discipline AS discipline_id,
        e.id AS event_id,
        COALESCE(se.name, e.name) AS event_name,
        COALESCE(se.location, e.location) AS event_location,
        COALESCE(se.race_format, e.race_format) AS event_race_format,
        COALESCE(se.datetime, e.datetime) AS event_datetime,
        e.num_bets,
        e.points_correct_bet,
        e.allow_partial_points,
        COALESCE(se.event_type_id, e.event_type_id) AS event_type_id,
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
    FROM {TABLE_PREDICTIONS} p
    INNER JOIN {TABLE_BETS} b ON b.id = p.bet_id
    INNER JOIN {TABLE_EVENTS} e ON e.id = b.event_id
    LEFT JOIN {TABLE_SHARED_EVENTS} se ON se.id = e.shared_event_id
    INNER JOIN {TABLE_GAMES} g ON g.id = e.game_id
    INNER JOIN {TABLE_USERS} u ON u.id = b.user_id
    INNER JOIN {TABLE_EVENT_TYPES} et ON et.id = COALESCE(se.event_type_id, e.event_type_id)
    LEFT JOIN VIEW_{TABLE_PREDICTIONS} vp ON vp.id = p.id
    WHERE COALESCE(se.source_race_id, e.source_race_id) IS NOT NULL
"""

logger = logging.getLogger(__name__)


def _logger():
    if has_app_context():
        return current_app.logger
    return logger


def _log_database_error(message, exc, sql=None, params=None):
    extra = {}
    if sql is not None:
        extra["sql"] = sql
    if params is not None:
        extra["params"] = params
    _logger().exception("%s: %s", message, exc, extra=extra or None)


def open_connection():
    conn = sqlite3.connect(current_app.config['DB_PATH'])
    conn.execute("PRAGMA foreign_keys = 1")
    return conn


def start():
    from src.database.migration_runner import migrate_to_latest

    migrate_to_latest(current_app.config["DB_PATH"])


def start_transaction():
    """Starts a transaction and returns the connection object."""
    conn = open_connection()
    conn.execute("BEGIN")
    return conn


def commit_transaction(conn):
    """Commits the transaction."""
    try:
        conn.commit()
    except Exception as exc:
        _log_database_error("Database transaction commit failed.", exc)
        try:
            conn.rollback()
        except Exception as rollback_exc:
            _log_database_error("Database transaction rollback after failed commit also failed.", rollback_exc)
        raise

def rollback_transaction(conn):
    """Rolls back the transaction."""
    try:
        conn.rollback()
    except Exception as exc:
        _log_database_error("Database transaction rollback failed.", exc)
        raise


def query(sql, params=None):
    """Executes a query and returns all results as a list of dictionaries."""
    conn = None
    try:
        conn = open_connection()
        cur = conn.cursor()
        if params is None:
            cur.execute(sql)
        else:
            cur.execute(sql, params)
        columns = [descript[0] for descript in cur.description]
        return [dict(zip(columns, result)) for result in cur.fetchall()]
    except Exception as exc:
        _log_database_error("Database query failed.", exc, sql=sql, params=params)
        raise
    finally:
        if conn is not None:
            conn.close()


def query_one(sql, params=None):
    """Executes a query and returns the first result as a dictionary."""
    conn = None
    try:
        conn = open_connection()
        cur = conn.cursor()
        if params is None:
            cur.execute(sql)
        else:
            cur.execute(sql, params)
        columns = [descript[0] for descript in cur.description]
        res = cur.fetchone()
        if res:
            return dict(zip(columns, res))
        else:
            return None
    except Exception as exc:
        _log_database_error("Database query failed.", exc, sql=sql, params=params)
        raise
    finally:
        if conn is not None:
            conn.close()


def table_exists(table_name):
    return query_one(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
        [table_name],
    ) is not None


def column_exists(table_name, column_name):
    conn = None
    try:
        conn = open_connection()
        cur = conn.cursor()
        cur.execute(f"PRAGMA table_info({table_name})")
        return any(row[1] == column_name for row in cur.fetchall())
    finally:
        if conn is not None:
            conn.close()


def execute(sql, params=None, commit=True):
    """Executes a statement (INSERT, UPDATE, DELETE)."""
    conn = None
    try:
        conn = open_connection()
        cursor = conn.cursor()
        if params is None:
            cursor.execute(sql)
        else:
            cursor.execute(sql, params)
        if commit:
            conn.commit()
        return True
    except Exception as exc:
        if conn is not None:
            conn.rollback()
        _log_database_error("Database statement execution failed.", exc, sql=sql, params=params)
        raise
    finally:
        if conn is not None:
            conn.close()


def execute_many(sql, params=None, commit=True):
    """Executes a statement (INSERT, UPDATE, DELETE) for multiple parameter sets."""
    conn = None
    try:
        conn = open_connection()
        cursor = conn.cursor()
        if params is None:
            cursor.execute(sql)
        else:
            cursor.executemany(sql, params)
        if commit:
            conn.commit()
        return True
    except Exception as exc:
        if conn is not None:
            conn.rollback()
        _log_database_error("Database batch statement execution failed.", exc, sql=sql, params=params)
        raise
    finally:
        if conn is not None:
            conn.close()


def refresh_analytics_views():
    if not all(
        table_exists(table_name)
        for table_name in [
            TABLE_EVENTS,
            TABLE_SHARED_EVENTS,
            TABLE_GAMES,
            TABLE_BETS,
            TABLE_PREDICTIONS,
            TABLE_USERS,
            TABLE_EVENT_TYPES,
        ]
    ):
        return
    conn = None
    try:
        conn = open_connection()
        cursor = conn.cursor()
        cursor.execute(f"DROP VIEW IF EXISTS VIEW_{TABLE_EVENTS}")
        cursor.execute(VIEW_EVENTS_SQL)
        cursor.execute("DROP VIEW IF EXISTS VIEW_GamePredictionStats")
        cursor.execute(VIEW_GAME_PREDICTION_STATS_SQL)
        conn.commit()
    finally:
        if conn is not None:
            conn.close()

def load_csv(file_name, generate_id=False):
    """Loads a CSV file from the resources folder and returns a list of dictionaries."""
    values = []
    with open(f'src/resources/{file_name}', newline='') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=";")
        for row in reader:
            if generate_id:
                concat_string = "".join(row.values())
                # generate ID
                row['id'] = utils.generate_id([concat_string])
            values.append(row)
        return values
