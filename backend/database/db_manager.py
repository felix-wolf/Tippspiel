import sqlite3
import csv
import hashlib

TABLE_NAME_ATHLETES = "Athletes"
TABLE_NAME_GAMES = "Games"
TABLE_NAME_GAME_PLAYERS = "GamePlayers"
TABLE_NAME_COUNTRIES = "Countries"
TABLE_NAME_USERS = "Users"
TABLE_NAME_EVENTS = "Users"


def open_connection():
    conn = sqlite3.connect("database/tippspiel.db")
    conn.execute("PRAGMA foreign_keys = 1")
    return conn


def start():
    # get connect, create db if not exist
    populate_db()


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
        print(e)
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
    except Exception as e:
        print(e)
    finally:
        if conn is not None:
            conn.close()


def execute_script(script_name):
    with open(f'database/{script_name}', 'r') as sql_file:
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


def populate_db():
    # execute script
    execute_script("create.sql")

    countries = load_csv("countries.csv")
    countries = [(c["Code"], c["Name"], c["Flagge"]) for c in countries]
    try:
        execute_many(
            f"Insert OR IGNORE into {TABLE_NAME_COUNTRIES} (code, name, flag) VALUES (?,?,?)",
            params=countries)
    except Exception as err:
        print(err)

    # insert athletes
    athletes = load_csv("athletes.csv", generate_id=True)
    athletes = [(a["Id"], a["Vorname"], a["Nachname"], a["Land_Code"], a["Geschlecht"]) for a in athletes]
    try:
        execute_many(
            f"Insert OR IGNORE into {TABLE_NAME_ATHLETES} (id, first_name, last_name, country_code, gender) VALUES (?,?,?,?,?)",
            params=athletes)
    except Exception as err:
        print(err)


def load_csv(file_name, generate_id=False):
    values = []
    with open(f'database/{file_name}', newline='') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=";")
        for row in reader:
            if generate_id:
                concat_string = "".join(row.values())
                # generate ID
                row['Id'] = hashlib.md5(concat_string.encode('utf8')).hexdigest()
            values.append(row)
        return values
