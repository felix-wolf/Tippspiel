import hashlib
from datetime import datetime

from backend.database import db_manager
from backend.models.bet import Bet
from backend.models.event_type import EventType


class Event:

    def __init__(self, name: str, game_id: str, event_type: EventType, dt: datetime, event_id: str = None, bets: [Bet] = None):
        if bets is None:
            bets = []
        if event_id:
            self.id = event_id
        else:
            self.id = hashlib.md5("".join([name, game_id, event_type.id, str(dt)]).encode('utf-8')).hexdigest()
        self.name = name
        self.game_id = game_id
        self.event_type = event_type
        self.dt = dt
        self.bets = bets

    def to_dict(self):
        if len(self.bets) > 0 and self.bets[0] is None:
            i = 0
        return {
            "id": self.id,
            "name": self.name,
            "game_id": self.game_id,
            "event_type": self.event_type.to_dict(),
            "datetime": self.dt.strftime("%Y-%m-%d %H:%M:%S"),
            "bets": [b.to_dict() for b in self.bets] if self.bets else []
        }

    def save_to_db(self):
        sql = f"INSERT INTO {db_manager.TABLE_EVENTS} (id, name, game_id, event_type_id, datetime) VALUES (?,?,?,?,?)"
        success = db_manager.execute(
            sql, [
                self.id, self.name, self.game_id,
                self.event_type.id, self.dt.strftime("%Y-%m-%d %H:%M:%S")
            ])
        return success, self.id

    def save_bets(self, user_id, bets):
        if len(self.bets) > 0:
            for bet in self.bets:
                bet.delete()
        bets = [Bet(user_id=user_id, event_id=self.id, predicted_place=b["place"], object_id=b["object_id"]) for b in bets]
        if len(bets) != 5:
            return False, None
        for bet in bets:
            if not bet.save_to_db():
                return False, None
        return True, self.id

    @staticmethod
    def get_by_id(event_id):
        sql = f"SELECT e.* FROM VIEW_{db_manager.TABLE_EVENTS} e WHERE e.id = ?"
        event_data = db_manager.query_one(sql, [event_id])
        if not event_data:
            return None
        # get event_type
        event_type = EventType.get_by_id(event_data["event_type_id"])
        event = Event.from_dict(event_data, event_type)
        # get bets
        sql = f"SELECT b.* FROM {db_manager.TABLE_BETS} b WHERE b.event_id = ?"
        bets_data = db_manager.query(sql, [event.id])
        if bets_data:
            bets = [Bet.from_dict(b) for b in bets_data]
            event.bets = bets
        return event

    @staticmethod
    def from_dict(e_dict, event_type):
        if e_dict:
            try:
                return Event(
                    event_id=e_dict['id'], name=e_dict['name'],
                    game_id=e_dict['game_id'], event_type=event_type,
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
            SELECT e.* FROM {db_manager.TABLE_EVENTS} e
            WHERE e.game_id = ?
            """
        res = db_manager.query(sql, [game_id])
        if res:
            return [Event.get_by_id(e["id"]) for e in res]
        return []

    @staticmethod
    def create(name: str, game_id: str, event_type_id: str, dt: str):
        # insert event
        dt = datetime.strptime(dt, "%d.%m.%Y, %H:%M:%S")
        event_type = EventType.get_by_id(event_type_id)
        if not event_type:
            return False, None
        event = Event(name=name, game_id=game_id, event_type=event_type, dt=dt)
        return event.save_to_db()

