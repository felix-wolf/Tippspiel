from datetime import datetime

from src.database import db_manager
from src.models.bet import Bet
from src.models.event_type import EventType
from src.models.result import Result
import src.utils as utils
from zoneinfo import ZoneInfo
from src.models.base_model import BaseModel


class Event(BaseModel):

    def __init__(self, name: str, game_id: str, event_type: EventType, dt: datetime,
                 event_id: str = None, bets: [Bet] = None, results: [Result] = None):
        if bets is None:
            bets = []
        if results is None:
            results = []
        if event_id:
            self.id = event_id
        else:
            self.id = utils.generate_id([name, game_id, event_type.id, dt])
        self.has_bets_for_users = []
        self.name = name
        self.game_id = game_id
        self.event_type = event_type
        self.dt = dt
        self.bets = bets
        self.results = results

    def to_dict(self):
        bets = []
        if len(self.bets) > 0:
            bets = [b.to_dict() for b in self.bets]
        results = []
        if len(self.results) > 0:
            results = [r.to_dict() for r in self.results]
        return {
            "id": self.id,
            "name": self.name,
            "game_id": self.game_id,
            "event_type": self.event_type.to_dict(),
            "datetime": Event.datetime_to_string(self.dt),
            "bets": bets,
            "results": results,
            "has_bets_for_users": self.has_bets_for_users

        }

    @staticmethod
    def datetime_to_string(dt):
        return dt.strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def string_to_datetime(dt_string):
        return datetime.strptime(dt_string, "%Y-%m-%d %H:%M:%S")
    
    @staticmethod
    def get_by_id(event_id, get_full_object: bool = True):
        sql = f"SELECT e.* FROM VIEW_{db_manager.TABLE_EVENTS} e WHERE e.id = ?"
        event_data = db_manager.query_one(sql, [event_id])
        if not event_data:
            return None
        # get event_type
        event_type = EventType.get_by_id(event_data["event_type_id"])
        event = Event.from_dict(event_data, event_type)
        event = event.getBets()
        if not get_full_object:
            event.bets = []
            return event
        event = event.getResults()
        # check for unprocessed events
        unprocessed_bets = [bet for bet in event.bets if not bet.score]
        if len(unprocessed_bets) > 0 and event.results is not None and event.results != []:
            success, error = event.process_results(event.results)
            if not success:
                return None
            event = event.getBets()
        return event

    @staticmethod
    def from_dict(e_dict, event_type):
        if e_dict:
            try:
                return Event(
                    event_id=e_dict['id'],
                    name=e_dict['name'],
                    game_id=e_dict['game_id'],
                    event_type=event_type,
                    dt=datetime.strptime(e_dict['datetime'], "%Y-%m-%d %H:%M:%S"),
                )
            except KeyError as e:
                print("Could not instantiate event with given values:", e_dict, e)
                return None
        else:
            return None

    @staticmethod
    def get_all_by_game_id(game_id: str, get_full_objects: bool, page: int = None, past: bool = False):
        now = datetime.now(ZoneInfo("Europe/Berlin"))
        sql = f"""
            SELECT e.* FROM {db_manager.TABLE_EVENTS} e
            WHERE e.game_id = ? and e.datetime {"<" if past else ">"} '{now.strftime("%Y-%m-%d %H:%M:%S")}'
            ORDER BY e.datetime {"DESC" if past else "ASC"}
            """
        if page:
            sql += f"LIMIT {(page - 1) * 5}, {5}"
        res = db_manager.query(sql, [game_id])
        if res:
            return [Event.get_by_id(e["id"], get_full_objects) for e in res]
        return []

    @staticmethod
    def create(name: str, game_id: str, event_type_id: str, dt: datetime):
        # insert event
        event_type = EventType.get_by_id(event_type_id)
        if not event_type:
            return False, None, None
        event = Event(name=name, game_id=game_id, event_type=event_type, dt=dt)
        success, event_id = event.save_to_db()
        return success, event_id, event

    @staticmethod
    def save_events(events):
        sql = f"INSERT INTO {db_manager.TABLE_EVENTS} (id, name, game_id, event_type_id, datetime) VALUES (?,?,?,?,?)"
        success = db_manager.execute_many(
            sql=sql,
            params=[(event.id, event.name, event.game_id,
                event.event_type.id, Event.datetime_to_string(event.dt)) for event in events],
            )
        return success

    def save_to_db(self, commit=True):
        sql = f"INSERT INTO {db_manager.TABLE_EVENTS} (id, name, game_id, event_type_id, datetime) VALUES (?,?,?,?,?)"
        success = db_manager.execute(
            sql, [
                self.id, self.name, self.game_id,
                self.event_type.id, Event.datetime_to_string(self.dt)
            ],
            commit=commit)
        return success, self.id

    def save_bet(self, user_id, predictions):
        bet = Bet.get_by_event_id_user_id(self.id, user_id)
        if not bet:
            bet = Bet(user_id, self.id)
        return bet.update_predictions(predictions), self.id

    def getResults(self):
        # get results
        results = Result.get_by_event_id(self.id)
        self.results = results
        return self

    def getBets(self):
        # get bets
        sql = f"SELECT b.* FROM {db_manager.TABLE_BETS} b WHERE b.event_id = ?"
        bets_data = db_manager.query(sql, [self.id])
        if bets_data:
            self.bets = [Bet.get_by_event_id_user_id(b["event_id"], b["user_id"]) for b in bets_data]
            self.has_bets_for_users = [bet.user_id for bet in self.bets]
        return self

    def process_results(self, results: [Result]):
        """
        Process results by comparing predicted with actual places, calculating score and saving to database.
        :param results: list if result objects
        :return: True and None if successful, False and error string if error
        """
        # delete existing results
        if not Result.delete_by_event_id(self.id):
            return False, "Bestehende Ergebnisse konnten nicht gelöscht werden"
        for result in results:
            success, result_id = result.save_to_db()
            if not success:
                return False, "Ergebnisse konnten nicht gespeichert werden"

        for bet in self.bets:
            if not bet.calc_score(results):
                return False, "Ergebnisse konnten nicht gespeichert werden"
        return True, None

    def update(self, name: str, event_type_id: str, dt: datetime):
        """Update an event's information. If the type is changed, all bets are deleted :("""
        success = True
        if name != self.name:
            self.name = name
        if event_type_id != self.event_type.id:
            # delete all associated bets since event type was changed
            bets = Bet.get_by_event_id(self.id)

            for bet in bets:
                deletion_successful = bet.delete()
                if not deletion_successful:
                    success = False
            event_type = EventType.get_by_id(event_type_id)
            self.event_type = event_type
        if dt != self.dt:
            self.dt = dt
        if success:
            sql = f"""UPDATE {db_manager.TABLE_EVENTS} SET
                    name = ?,
                    event_type_id = ?,
                    datetime = ?
                    WHERE id = ?
                """
            success = db_manager.execute(sql,
                                         [self.name, self.event_type.id, Event.datetime_to_string(self.dt), self.id])
        return success, self
    
    def delete(self):
        return db_manager.execute(
            sql=f"DELETE FROM {db_manager.TABLE_EVENTS} WHERE id = ?",
            params=[self.id]
            )


    @staticmethod
    def get_all():
        result = db_manager.query(
            sql=f"SELECT * FROM {db_manager.TABLE_EVENTS}"
        )
        # TODO: change this
        return result

    @staticmethod
    def get_base_data():
        return