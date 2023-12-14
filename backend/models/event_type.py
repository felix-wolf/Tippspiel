import hashlib

from models.base_model import BaseModel
from database import db_manager


class EventType(BaseModel):

    def __init__(self, name: str, display_name: str, discipline_id: str, betting_on: str, event_type_id: str = None):
        if event_type_id:
            self.id = event_type_id
        else:
            self.id = hashlib.md5("".join([name, display_name, discipline_id, betting_on]).encode('utf-8')).hexdigest()
        self.name = name
        self.display_name = display_name
        self.discipline_id = discipline_id
        self.betting_on = betting_on

    def save_to_db(self):
        sql = f"""
            INSERT OR IGNORE INTO {db_manager.TABLE_EVENT_TYPES} 
            (id, name, display_name, discipline_id, betting_on)
            VALUES (?,?,?,?,?)
        """
        success = db_manager.execute(
            sql, [
                self.id, self.name, self.display_name,
                self.discipline_id, self.betting_on
            ])
        return success, self.id

    @staticmethod
    def from_dict(d):
        if d:
            event_type_id = None
            if "id" in d:
                event_type_id = d['id']

            try:
                return EventType(
                    event_type_id=event_type_id, name=d['name'], display_name=d['display_name'],
                    discipline_id=d['discipline_id'], betting_on=d['betting_on']
                )
            except KeyError as e:
                print("Could not instantiate event_type with given values:", d, e)
                return None
        else:
            return None

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "display_name": self.display_name,
            "discipline_id": self.discipline_id,
            "betting_on": self.betting_on,
        }

    @staticmethod
    def get_all():
        pass

    @staticmethod
    def get_by_id(event_type_id):
        sql = f"SELECT e.* FROM {db_manager.TABLE_EVENT_TYPES} e WHERE e.id = ?"
        event_type = db_manager.query_one(sql, [event_type_id])
        if event_type:
            return EventType.from_dict(event_type)
        return None

    @staticmethod
    def get_by_discipline_id(discipline_id):
        sql = f"SELECT e.* FROM {db_manager.TABLE_EVENT_TYPES} e WHERE e.discipline_id = ?"
        event_types = db_manager.query(sql, [discipline_id])
        if event_types:
            return [EventType.from_dict(e) for e in event_types]
        return None

    @staticmethod
    def load_into_db():
        event_types = db_manager.load_csv("event_types.csv")
        event_types = [EventType.from_dict(e) for e in event_types]
        for event_type in event_types:
            success, type_id = event_type.save_to_db()
            if not success:
                print("Error saving event_types")
