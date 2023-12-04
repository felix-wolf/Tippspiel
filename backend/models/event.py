from backend.database import db_manager


class Event:
    def __init__(self, event_id, name, game_id, event_type, datetime):
        self.id = event_id
        self.name = name
        self.game_id = game_id
        self.event_type = event_type
        self.datetime = datetime

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "game_id": self.game_id,
            "type": self.event_type,
            "datetime": self.datetime
        }

    @staticmethod
    def from_dict(e_dict):
        if e_dict:
            try:
                return Event(
                    event_id=e_dict['id'], name=e_dict['name'],
                    game_id=e_dict['game_id'], event_type=e_dict['type'], datetime=e_dict['datetime']
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
