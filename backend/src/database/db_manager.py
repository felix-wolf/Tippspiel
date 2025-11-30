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
        return False
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
        print(e)
    finally:
        if conn is not None:
            conn.close()


def execute_script(script_name):
    """Executes a SQL script from the resources folder."""
    with open(f'src/resources/{script_name}', 'r') as sql_file:
        sql_script = sql_file.read()
    try:
        conn = open_connection()
        cursor = conn.cursor()
        cursor.executescript(sql_script)
        conn.commit()
        conn.close()
    except sqlite3.IntegrityError as err:
        print(err)
    except Exception as err:
        print(err)


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
