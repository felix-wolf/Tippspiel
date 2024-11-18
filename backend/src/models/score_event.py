from datetime import datetime
from src.database import db_manager
from src.models.bet import Bet
from src.models.base_model import BaseModel

class ScoreEvent(BaseModel):

    def __init__(self, id: str, game_id: str, name: str, dt: datetime, scores=[]):
        self.id = id
        self.game_id = game_id
        self.name = name
        self.dt = dt
        self.scores = scores

    def to_dict(self):
        return {
            "id": self.id,
            "game_id": self.game_id,
            "name": self.name,
            "datetime": ScoreEvent.datetime_to_string(self.dt),
            "scores": self.scores,
        }

    @staticmethod
    def from_dict(e_dict):
        try:
            return ScoreEvent(
                id=e_dict["id"],
                game_id=e_dict["game_id"],
                name=e_dict["name"],
                dt=datetime.strptime(e_dict['datetime'], "%Y-%m-%d %H:%M:%S"),
            )
        except KeyError as e:
            print("Could not instantiate ScoreEvent with given values:", e_dict, e)
            return None

    @staticmethod
    def datetime_to_string(dt):
        return dt.strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def get_all_by_game_id(game_id: str):
        sql = f"""
            SELECT e.id, e.name, e.game_id, e.datetime FROM VIEW_{db_manager.TABLE_EVENTS} e
            WHERE e.game_id = ?
            """
        res = db_manager.query(sql, [game_id])
        if not res:
            return []
        events = [ScoreEvent.from_dict(e) for e in res]
        for event in events:
            bets = Bet.get_by_event_id(event.id)
            scores = {bet.user_id: bet.score for bet in bets}
            event.scores = scores
        return [e for e in events if len(e.scores) > 0 and len([v for k, v in e.scores.items() if v is not None]) > 0]
    
    @staticmethod
    def get_all():
        pass
    
    @staticmethod
    def get_base_data():
        pass
    
    @staticmethod
    def get_by_id():
        pass 
    
    def save_to_db():
        pass
