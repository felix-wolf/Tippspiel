import csv
import sqlite3
import src.utils as utils
from flask import current_app

TABLE_ATHLETES = "Athletes"
TABLE_GAMES = "Games"
TABLE_GAME_PLAYERS = "GamePlayers"
TABLE_COUNTRIES = "Countries"
TABLE_USERS = "Users"
TABLE_EVENTS = "Events"
TABLE_EVENT_TYPES = "EventTypes"
TABLE_BETS = "Bets"
TABLE_PREDICTIONS = "Predictions"
TABLE_DISCIPLINES = "Disciplines"
TABLE_RESULTS = "Results"
TABLE_DEVICE_TOKENS = "DeviceTokens"
VIEW_EVENTS_SQL = f"""
CREATE VIEW VIEW_{TABLE_EVENTS} AS
    SELECT e.*, g.discipline, COUNT(b.id) > 0 as has_bets
    FROM {TABLE_EVENTS} e
    INNER JOIN {TABLE_GAMES} g on e.game_id = g.id
    LEFT JOIN {TABLE_BETS} b ON e.id = b.event_id
    GROUP BY e.id
    ORDER BY e.datetime
"""
VIEW_GAME_PREDICTION_STATS_SQL = f"""
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
    FROM {TABLE_PREDICTIONS} p
    INNER JOIN {TABLE_BETS} b ON b.id = p.bet_id
    INNER JOIN {TABLE_EVENTS} e ON e.id = b.event_id
    INNER JOIN {TABLE_GAMES} g ON g.id = e.game_id
    INNER JOIN {TABLE_USERS} u ON u.id = b.user_id
    INNER JOIN {TABLE_EVENT_TYPES} et ON et.id = e.event_type_id
    LEFT JOIN VIEW_{TABLE_PREDICTIONS} vp ON vp.id = p.id
"""


def open_connection():
    conn = sqlite3.connect(current_app.config['DB_PATH'])
    conn.execute("PRAGMA foreign_keys = 1")
    return conn


def start():
    # get connect, create db if not exist
    execute_script("create.sql")


def start_transaction():
    """Starts a transaction and returns the connection object."""
    conn = open_connection()
    conn.execute("BEGIN")
    return conn


def commit_transaction(conn):
    """Commits the transaction."""
    try:
        conn.commit()
    except Exception as e:
        print(e)
        conn.rollback()

def rollback_transaction(conn):
    """Rolls back the transaction."""
    try:
        conn.rollback()
    except Exception as e:
        print(e)


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
    except Exception as e:
        print(e)
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
    except Exception as e:
        print(e)
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
        conn.close()
        return True
    except Exception as e:
        print(e, sql, params)
        raise e
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
    except Exception as e:
        print(e, sql, params)
        raise e
    finally:
        if conn is not None:
            conn.close()


def refresh_analytics_views():
    if not all(table_exists(table_name) for table_name in [TABLE_EVENTS, TABLE_GAMES, TABLE_BETS, TABLE_PREDICTIONS, TABLE_USERS, TABLE_EVENT_TYPES]):
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


def ensure_event_location_schema():
    ensure_event_schema()


def ensure_event_schema():
    if not table_exists(TABLE_EVENTS):
        return
    if not column_exists(TABLE_EVENTS, "location"):
        execute(f"ALTER TABLE {TABLE_EVENTS} ADD COLUMN location TEXT")
    if not column_exists(TABLE_EVENTS, "race_format"):
        execute(f"ALTER TABLE {TABLE_EVENTS} ADD COLUMN race_format TEXT")
    refresh_analytics_views()


def execute_script(script_name):
    """Executes a SQL script from the resources folder."""
    with open(f'src/resources/{script_name}', 'r') as sql_file:
        sql_script = sql_file.read()
    try:
        conn = open_connection()
        cursor = conn.cursor()
        cursor.executescript(sql_script)
        conn.commit()
    except sqlite3.IntegrityError as err:
        print(err, sql_script)
        raise err
    except Exception as err:
        print(err, sql_script)
        raise err
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
