from dataclasses import dataclass

import src.utils as utils
from src.models.base_model import BaseModel
from src.database import db_manager


@dataclass
class EventType(BaseModel):

    name: str
    display_name: str
    discipline_id: str
    betting_on: str
    id: str = None

    def __post_init__(self):
        if not self.id:
            self.id = utils.generate_id([self.name, self.display_name, self.discipline_id, self.betting_on])
        if not all([self.name, self.display_name, self.discipline_id, self.betting_on]):
            raise ValueError("EventType requires name, display_name, discipline_id and betting_on")

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
                    id=event_type_id, name=d['name'], display_name=d['display_name'],
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
        raise NotImplementedError("EventType.get_all is not implemented")

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
    def get_base_data():
        event_types = db_manager.load_csv("event_types.csv")
        event_types = [EventType.from_dict(e) for e in event_types]
        return event_types
