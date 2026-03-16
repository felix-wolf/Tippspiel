import logging
from src.database import db_manager
from src.models.base_model import BaseModel
from src.models.event_type import EventType

logger = logging.getLogger(__name__)


class Discipline(BaseModel):
    EVENT_IMPORT_MODE_MANUAL = "manual"
    EVENT_IMPORT_MODE_OFFICIAL_API = "official_api"
    RESULT_MODE_MANUAL = "manual"
    RESULT_MODE_OFFICIAL_API = "official_api"

    def __init__(
        self,
        discipline_id: str,
        name: str,
        event_types: list[EventType],
        event_import_mode: str = EVENT_IMPORT_MODE_MANUAL,
        result_mode: str = RESULT_MODE_MANUAL,
    ):
        self.id = discipline_id
        self.name = name
        self.event_types = event_types
        self.event_import_mode = event_import_mode
        self.result_mode = result_mode

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "event_types": [e.to_dict() for e in self.event_types],
            "event_import_mode": self.event_import_mode,
            "result_mode": self.result_mode,
        }

    @staticmethod
    def from_dict(a_dict, event_types):
        event_import_mode = Discipline.EVENT_IMPORT_MODE_MANUAL
        result_mode = Discipline.RESULT_MODE_MANUAL
        if "event_import_mode" in a_dict and a_dict["event_import_mode"]:
            event_import_mode = a_dict["event_import_mode"]
        if "result_mode" in a_dict and a_dict["result_mode"]:
            result_mode = a_dict["result_mode"]
        if a_dict:
            try:
                return Discipline(
                    discipline_id=a_dict["id"],
                    name=a_dict["name"],
                    event_types=event_types,
                    event_import_mode=event_import_mode,
                    result_mode=result_mode,
                )
            except KeyError as exc:
                logger.warning("Could not instantiate discipline with given values: %s", a_dict, exc_info=exc)
                return None
        return None

    @staticmethod
    def get_all():
        sql = f"SELECT * FROM {db_manager.TABLE_DISCIPLINES}"
        res = db_manager.query(sql)
        event_types = [EventType.get_by_discipline_id(d["id"]) for d in res]
        return [Discipline.from_dict(a, e) for a, e in zip(res, event_types)]

    @staticmethod
    def get_by_id(name):
        sql = f"SELECT d.* FROM {db_manager.TABLE_DISCIPLINES} d WHERE d.id = ?"
        discipline = db_manager.query_one(sql, [name])
        if discipline:
            event_types = EventType.get_by_discipline_id(discipline["id"])
            return Discipline.from_dict(discipline, event_types)
        return None

    def save_to_db(self):
        sql = f"""
            INSERT OR IGNORE INTO {db_manager.TABLE_DISCIPLINES}
            (id, name, event_import_mode, result_mode)
            VALUES (?,?,?,?)
            """
        success = db_manager.execute(
            sql,
            [
                self.id,
                self.name,
                self.event_import_mode,
                self.result_mode,
            ],
        )
        return success, self.id

    @staticmethod
    def get_base_data():
        disciplines = db_manager.load_csv("disciplines.csv")
        event_types = [EventType.get_by_discipline_id(d["id"]) for d in disciplines]
        return [Discipline.from_dict(d, event_type) for d, event_type in zip(disciplines, event_types)]
