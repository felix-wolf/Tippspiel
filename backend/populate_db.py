import src.database.db_manager as db_manager
from src.models.event_type import EventType
from src.models.athlete import Athlete
from src.models.country import Country
from src.models.discipline import Discipline
from main import create_app
import sqlite3
import argparse


def populate_db(db_path):
    print("creating table schema")
    execute_script("create.sql", db_path)

    print("Inserting event types")
    event_types = EventType.get_base_data()
    for event_type in event_types:
        sql = f"""
                INSERT OR IGNORE INTO {db_manager.TABLE_EVENT_TYPES} 
                (id, name, display_name, discipline_id, betting_on)
                VALUES (?,?,?,?,?)
            """
        execute(
            sql, [
                event_type.id, event_type.name, event_type.display_name,
                event_type.discipline_id, event_type.betting_on
            ], db_path=db_path)
    
    print("Inserting disciplines types")
    disciplines = Discipline.get_base_data()
    for discipline in disciplines:
        sql = f"""
                INSERT OR IGNORE INTO {db_manager.TABLE_DISCIPLINES} 
                (id, name, result_url, events_url)
                VALUES (?,?,?,?)
                """
        execute(sql, [discipline.id, discipline.name, discipline.result_url, discipline.events_url], db_path=db_path)
    
    print("Inserting countries types")
    countries = Country.get_base_data()
    for country in countries:
        sql = f"""
            INSERT OR IGNORE INTO {db_manager.TABLE_COUNTRIES} 
            (code, name, flag)
            VALUES (?,?,?)
            """
        execute(sql, [country.code, country.name, country.flag], db_path=db_path)
    
    print("Inserting athletes types")
    athletes = Athlete.get_base_data()
    for athlete in athletes:
        sql = f"""
            INSERT OR IGNORE INTO {db_manager.TABLE_ATHLETES} 
            (id, first_name, last_name, country_code, gender, discipline)
            VALUES (?,?,?,?,?,?)
            """
        execute(sql, [
            athlete.id, athlete.first_name, athlete.last_name, athlete.country_code, athlete.gender, athlete.discipline
        ])

    print("db initialized")

def open_connection(path):
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA foreign_keys = 1")
    return conn

def execute(sql, params=None, commit=True, db_path=None):
    conn = None
    try:
        conn = open_connection(db_path)
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


def execute_script(script_name, db_path):
    with open(f'src/resources/{script_name}', 'r') as sql_file:
        sql_script = sql_file.read()
    try:
        conn = open_connection(db_path)
        cursor = conn.cursor()
        cursor.executescript(sql_script)
        conn.commit()
        conn.close()
    except sqlite3.IntegrityError as err:
        print(err)
    except Exception as err:
        print(err)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--db_path', required=True, help='Path database')
    args = parser.parse_args()
    populate_db(args.db_path)