from datetime import datetime
import logging
from src.database import db_manager

logger = logging.getLogger(__name__)

class ScoreEvent:

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
        except KeyError as exc:
            logger.warning("Could not instantiate ScoreEvent with given values: %s", e_dict, exc_info=exc)
            return None

    @staticmethod
    def datetime_to_string(dt):
        return dt.strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def get_all_by_game_id(game_id: str):
        sql = f"""
            SELECT
                e.id,
                e.name,
                e.game_id,
                e.datetime,
                b.user_id,
                b.score
            FROM VIEW_{db_manager.TABLE_EVENTS} e
            LEFT JOIN {db_manager.TABLE_BETS} b ON b.event_id = e.id
            WHERE e.game_id = ?
            ORDER BY e.datetime ASC, e.id ASC
            """
        res = db_manager.query(sql, [game_id])
        if not res:
            return []
        events_by_id = {}
        ordered_events = []
        for row in res:
            event_id = row["id"]
            event = events_by_id.get(event_id)
            if event is None:
                event = ScoreEvent.from_dict(row)
                if event is None:
                    continue
                event.scores = {}
                events_by_id[event_id] = event
                ordered_events.append(event)
            if row["user_id"] is not None:
                event.scores[row["user_id"]] = row["score"]
        return [
            event
            for event in ordered_events
            if event.scores and any(score is not None for score in event.scores.values())
        ]
