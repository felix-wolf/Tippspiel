from database import db_manager
from models.base_model import BaseModel
from models.event_type import EventType


class Discipline(BaseModel):

    def __init__(self, discipline_id: str, name: str, event_types: [EventType]):
        self.id = discipline_id
        self.name = name
        self.event_types = event_types

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "event_types": [e.to_dict() for e in self.event_types]
        }

    @staticmethod
    def from_dict(a_dict, event_types):
        if a_dict:
            try:
                return Discipline(discipline_id=a_dict['id'], name=a_dict['name'], event_types=event_types)
            except KeyError as e:
                print("Could not instantiate discipline with given values:", a_dict)
                return None
        else:
            return None

    @staticmethod
    def get_all():
        sql = f"SELECT * FROM {db_manager.TABLE_DISCIPLINES}"
        res = db_manager.query(sql)
        event_types = [EventType.get_by_discipline_id(d['id']) for d in res]
        return [Discipline.from_dict(a, e) for a, e in zip(res, event_types)]

    @staticmethod
    def get_by_id(name):
        sql = f"SELECT d.* FROM {db_manager.TABLE_DISCIPLINES} d WHERE d.id = ?"
        discipline = db_manager.query_one(sql, [name])
        if discipline:
            event_types = EventType.get_by_discipline_id(discipline['id'])
            return Discipline.from_dict(discipline, event_types)
        return None

    def save_to_db(self):
        sql = f"""
            INSERT OR IGNORE INTO {db_manager.TABLE_DISCIPLINES} 
            (id, name)
            VALUES (?,?)
            """
        success = db_manager.execute(sql, [self.id, self.name])
        return success, self.id

    @staticmethod
    def load_into_db():
        disciplines = db_manager.load_csv("disciplines.csv")
        event_types = [EventType.get_by_discipline_id(d["id"]) for d in disciplines]
        disciplines = [Discipline.from_dict(d, event_type) for d, event_type in zip(disciplines, event_types)]
        for discipline in disciplines:
            if not discipline.save_to_db():
                print("Error saving discipline")
