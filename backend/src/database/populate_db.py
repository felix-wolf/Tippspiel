from src.database import db_manager
from src.models.event_type import EventType
from src.models.athlete import Athlete
from src.models.country import Country
from src.models.discipline import Discipline

def populate_db():
    db_manager.start()
    Country.load_into_db()
    Discipline.load_into_db()
    Athlete.load_into_db()
    EventType.load_into_db()
    print("db initialized")

if __name__ == '__main__':
    populate_db()