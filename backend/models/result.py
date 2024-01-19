from database import db_manager
import utils


class Result:

    def __init__(self, event_id: str, place: int, object_id: str, object_name: str = None, result_id: str = None):
        if result_id is None:
            self.id = utils.generate_id([event_id, place, object_id])
        else:
            self.id = result_id
        self.event_id = event_id
        self.place = place
        self.object_id = object_id
        self.object_name = object_name

    @staticmethod
    def from_dict(r_dict):
        if r_dict:
            return Result(r_dict['event_id'], r_dict['place'], r_dict['object_id'], r_dict['object_name'], r_dict['id'])
        else:
            return None

    @staticmethod
    def get_by_event_id(event_id):
        sql = f"SELECT r.* FROM VIEW_{db_manager.TABLE_RESULTS} r WHERE r.event_id = ?"
        results = db_manager.query(sql, [event_id])
        if not results:
            return []
        return [Result.from_dict(r) for r in results]

    @staticmethod
    def delete_by_event_id(event_id):
        sql = f"DELETE FROM {db_manager.TABLE_RESULTS} WHERE event_id = ?"
        return db_manager.execute(sql, [event_id])

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "place": self.place,
            "object_id": self.object_id,
            "object_name": self.object_name
        }

    def save_to_db(self):
        sql = f"""
            INSERT INTO {db_manager.TABLE_RESULTS} 
            (id, event_id, place, object_id)
            VALUES (?,?,?,?)
        """
        success = db_manager.execute(sql, [self.id, self.event_id, self.place, self.object_id])
        return success, self.id
