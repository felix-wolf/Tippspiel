import hashlib

from backend.database import db_manager
from backend.models.bet import Bet
from datetime import datetime


class Event:

    def __init__(self, name: str, game_id: str, event_type: str, dt: datetime, event_id=None, bets=None):
        if bets is None:
            bets = []
        if event_id:
            self.id = event_id
        else:
            self.id = hashlib.md5("".join([name, event_type, str(dt)]).encode('utf-8')).hexdigest()
        self.name = name
        self.game_id = game_id
        self.event_type = event_type
        self.dt = dt
        self.bets = bets

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "game_id": self.game_id,
            "type": self.event_type,
            "datetime": self.dt,
            "bets": [b.to_dict() for b in self.bets] if self.bets else []
        }

    def save_to_db(self):
        sql = f"INSERT INTO {db_manager.TABLE_NAME_EVENTS} (id, name, game_id, type, datetime) VALUES (?,?,?,?,?)"
        success = db_manager.execute(
            sql, [
                self.id, self.name, self.game_id,
                self.event_type, self.dt.strftime("%Y-%m-%d %H:%M:%S")
            ])
        return success, self.id

    @staticmethod
    def get_by_id(event_id):
        sql = f"SELECT e.* FROM {db_manager.TABLE_NAME_EVENTS} e WHERE e.id = ?"
        event = db_manager.query_one(sql, [event_id])
        if event:
            # TODO: GET BETS
            return Event.from_dict(event)
        return None

    @staticmethod
    def from_dict(e_dict):
        if e_dict:
            try:
                return Event(
                    event_id=e_dict['id'], name=e_dict['name'],
                    game_id=e_dict['game_id'], event_type=e_dict['type'],
                    dt=datetime.strptime(e_dict['datetime'], "%Y-%m-%d %H:%M:%S")
                )
            except KeyError as e:
                print("Could not instantiate event with given values:", e_dict, e)
                return None
        else:
            return None

    @staticmethod
    def get_all_by_game_id(game_id):
        sql = f"""
            SELECT e.* FROM {db_manager.TABLE_NAME_EVENTS} e
            WHERE e.game_id = ?
            """
        res = db_manager.query(sql, [game_id])
        if res:
            return [Event.from_dict(e) for e in res]
        return []

    @staticmethod
    def create(name: str, game_id: str, event_type: str, dt: str):
        # insert event
        dt = datetime.strptime(dt, "%d.%m.%Y, %H:%M:%S")
        event = Event(name=name, game_id=game_id, event_type=event_type, dt=dt)
        return event.save_to_db()
