import hashlib
from backend.database import db_manager


class Prediction:

    def __init__(
            self, bet_id: str, object_id: str, object_name: str, predicted_place: int,
            actual_place: int = None, prediction_id: str = None, score: int = 0):
        if prediction_id is None:
            self.id = hashlib.md5("".join([bet_id, object_id, str(predicted_place)]).encode('utf-8')).hexdigest()
        else:
            self.id = prediction_id
        self.bet_id = bet_id
        self.predicted_place = predicted_place
        self.object_id = object_id
        self.object_name = object_name
        self.actual_place = actual_place
        self.score = score

    def delete(self):
        sql = f"""
            DELETE FROM {db_manager.TABLE_PREDICTIONS} 
            WHERE id = ?
        """
        success = db_manager.execute(sql, [self.id])
        return success, self.id

    def set_actual_place(self, place):
        if type(place) == str:
            place = int(place)
        self.actual_place = place
        self.score = max(0, min(5, 5 - abs(self.actual_place - self.predicted_place)))
        sql = f"UPDATE {db_manager.TABLE_PREDICTIONS} SET score = ?, actual_place = ? WHERE id = ?"
        return db_manager.execute(sql, [self.score, self.actual_place, self.id])

    def to_dict(self):
        return {
            "id": self.id,
            "bet_id": self.bet_id,
            "predicted_place": self.predicted_place,
            "object_id": self.object_id,
            "object_name": self.object_name,
            "actual_place": self.actual_place,
            "score": self.score
        }

    @staticmethod
    def get_by_id(bet_id: str):
        sql = f"SELECT p.* FROM VIEW_{db_manager.TABLE_PREDICTIONS} p WHERE p.bet_id = ?"
        predictions = db_manager.query(sql, [bet_id])
        if not predictions:
            return []
        return [Prediction.from_dict(p) for p in predictions]

    @staticmethod
    def from_dict(p_dict, bet_id=None):
        if p_dict:
            p_id = None
            score = None
            actual_place = None
            object_name = None
            if "id" in p_dict:
                p_id = p_dict["id"]
            if "score" in p_dict:
                score = p_dict["score"]
            if "bet_id" in p_dict:
                bet_id = p_dict["bet_id"]
            if "actual_place" in p_dict:
                actual_place = p_dict["actual_place"]
            if "object_name" in p_dict:
                object_name = p_dict["object_name"]
            try:
                return Prediction(
                    prediction_id=p_id,
                    bet_id=bet_id,
                    object_id=p_dict["object_id"],
                    object_name=object_name,
                    predicted_place=p_dict["predicted_place"],
                    actual_place=actual_place,
                    score=score
                )
            except KeyError as e:
                print("Could not instantiate bet with given values:", p_dict)
                return None
        else:
            return None


class Bet:

    def __init__(self, user_id: str, event_id: str, predictions: [Prediction] = None, score: int = None,
                 bet_id: str = None):
        if bet_id:
            self.id = bet_id
        else:
            self.id = hashlib.md5("".join([user_id, event_id]).encode('utf-8')).hexdigest()
        if predictions is None:
            predictions = []
        self.user_id = user_id
        self.event_id = event_id
        self.predictions = predictions
        self.score = score

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "event_id": self.event_id,
            "predictions": [prediction.to_dict() for prediction in self.predictions],
            "score": self.score
        }

    def calc_score(self, results):
        for pred in self.predictions:
            object_ids = [r["id"] for r in results]
            actual_place = 9999
            if pred.object_id in object_ids:
                actual_place = next((item["place"] for item in results if item["id"] == pred.object_id))
            if not pred.set_actual_place(actual_place):
                return False
        self.score = sum([p.score for p in self.predictions])
        sql = f"UPDATE {db_manager.TABLE_BETS} SET score = ? WHERE id = ?"
        return db_manager.execute(sql, [self.score, self.id])

    def update_predictions(self, new_predictions):
        if len(new_predictions) != 5:
            return False, None

        if len(self.predictions) > 0:
            for prediction in self.predictions:
                prediction.delete()

        predictions = [Prediction.from_dict(pred, self.id) for pred in new_predictions]
        self.predictions = predictions
        return self.save_to_db()

    @staticmethod
    def get_by_event_id_user_id(event_id, user_id):
        sql = f"SELECT b.* FROM {db_manager.TABLE_BETS} b WHERE b.event_id = ? and b.user_id = ?"
        bet_data = db_manager.query_one(sql, [event_id, user_id])
        if not bet_data:
            return None
        # get predictions
        predictions = Prediction.get_by_id(bet_data["id"])
        return Bet.from_dict(bet_data, predictions)

    @staticmethod
    def from_dict(bet_dict, predictions):
        if bet_dict:
            try:
                bet = Bet(
                    bet_id=bet_dict['id'],
                    event_id=bet_dict['event_id'],
                    user_id=bet_dict["user_id"],
                    predictions=predictions,
                    score=bet_dict["score"]
                )
                return bet
            except KeyError as e:
                print("Could not instantiate bet with given values:", bet_dict)
                return None
        else:
            return None

    def save_to_db(self):
        sql = f"""
            INSERT OR IGNORE INTO {db_manager.TABLE_BETS} 
            (id, event_id, user_id, score)
            VALUES (?,?,?,?)
        """
        success = db_manager.execute(
            sql, [
                self.id, self.event_id, self.user_id, self.score
            ])
        for prediction in self.predictions:
            sql = f"""
                INSERT INTO {db_manager.TABLE_PREDICTIONS} 
                (id, bet_id, predicted_place, object_id, actual_place)
                VALUES (?,?,?,?,?)
            """
            if not db_manager.execute(sql, [
                prediction.id, self.id, prediction.predicted_place,
                prediction.object_id, prediction.actual_place
            ]):
                return False
        return success
