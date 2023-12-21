from database import db_manager
from models.event_type import EventType
from models.athlete import Athlete
from models.country import Country
from models.discipline import Discipline

if __name__ == '__main__':
    db_manager.start()
    Country.load_into_db()
    Discipline.load_into_db()
    Athlete.load_into_db()
    EventType.load_into_db()
    print("db initialized")
