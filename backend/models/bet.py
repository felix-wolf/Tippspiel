import hashlib
from backend.database import db_manager


class Placement:

    def __init__(self, predicted_place, object_id, actual_place=None):
        self.predicted_place = predicted_place
        self.object_id = object_id
        self.actual_place = actual_place

    def to_dict(self):
        return {
            "predicted_place": self.predicted_place,
            "object_id": self.object_id,
            "actual_place": self.actual_place
        }


class Bet:

    def __init__(self, user_id: str, event_id: str, predicted_place: int,
                 object_id: str, actual_place: int = None, score: int = None, bet_id: str = None):
        if bet_id:
            self.id = bet_id
        else:
            self.id = hashlib.md5("".join([user_id, event_id, str(predicted_place)]).encode('utf-8')).hexdigest()
        self.user_id = user_id
        self.event_id = event_id
        self.predicted_place = predicted_place
        self.object_id = object_id
        self.actual_place = actual_place
        self.score = score

    def calc_score(self):
        return 12

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "event_id": self.event_id,
            "predicted_place": self.predicted_place,
            "object_id": self.object_id,
            "actual_place": self.actual_place,
            "score": self.score
        }

    def delete(self):
        sql = f"""
            DELETE FROM {db_manager.TABLE_BETS} 
            WHERE id = ?
        """
        success = db_manager.execute(sql, [self.id])
        return success, self.id

    @staticmethod
    def from_dict(bet_dict):
        if bet_dict:
            try:
                return Bet(
                    bet_id=bet_dict['id'], event_id=bet_dict['event_id'], user_id=bet_dict["user_id"],
                    predicted_place=bet_dict['predicted_place'], object_id=bet_dict['object_id'],
                    actual_place=bet_dict["actual_place"], score=bet_dict["score"]
                )
            except KeyError as e:
                print("Could not instantiate bet with given values:", bet_dict)
                return None
        else:
            return None

    def save_to_db(self):
        sql = f"""
            INSERT INTO {db_manager.TABLE_BETS} 
            (id, event_id, user_id, predicted_place, object_id, actual_place, score)
            VALUES (?,?,?,?,?,?,?)
        """
        success = db_manager.execute(
            sql, [
                self.id, self.event_id, self.user_id, self.predicted_place,
                self.object_id, self.actual_place, self.score
            ])
        return success, self.id
