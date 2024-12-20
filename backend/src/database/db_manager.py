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


def open_connection():
    conn = sqlite3.connect(current_app.config['DB_PATH'])
    conn.execute("PRAGMA foreign_keys = 1")
    return conn


def start():
    # get connect, create db if not exist
    execute_script("create.sql")


def query(sql, params=None):
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
        conn.close()
        print(e, sql, params)
        return False


def execute_many(sql, params=None, commit=True):
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
