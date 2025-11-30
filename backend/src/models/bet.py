import src.utils as utils
from src.database import db_manager
from src.models.base_model import BaseModel

class Prediction(BaseModel):

    def __init__(
            self, bet_id: str, object_id: str, object_name: str, predicted_place: int,
            actual_place: int = None, prediction_id: str = None, score: int = 0):
        if prediction_id is None:
            self.id = utils.generate_id([bet_id, object_id, predicted_place])
        else:
            self.id = prediction_id
        self.bet_id = bet_id
        self.predicted_place = predicted_place
        self.object_id = object_id
        self.object_name = object_name
        self.actual_place = actual_place
        self.score = score

    def delete(self, conn=None):
        sql = f"DELETE FROM {db_manager.TABLE_PREDICTIONS} WHERE id = ?"
        if conn:
            conn.execute(sql, [self.id])
            return True, self.id
        success = db_manager.execute(sql, [self.id])
        return success, self.id

    def set_actual_place(self, place, points_correct_bet: int, allow_partial_points: bool, conn=None):
        if type(place) == str:
            place = int(place)
        self.actual_place = place
        if allow_partial_points:
            self.score = max(0, min(points_correct_bet, points_correct_bet - abs(self.actual_place - self.predicted_place)))
        else:
            self.score = points_correct_bet if self.actual_place == self.predicted_place else 0
        sql = f"UPDATE {db_manager.TABLE_PREDICTIONS} SET score = ?, actual_place = ? WHERE id = ?"
        if conn:
            conn.execute(sql, [self.score, self.actual_place, self.id])
            return True
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


    def save_to_db(self, conn=None, commit=True):
        sql = f"""
            INSERT INTO {db_manager.TABLE_PREDICTIONS}
            (id, bet_id, predicted_place, object_id, actual_place)
            VALUES (?,?,?,?,?)
        """
        params = [
            self.id, self.bet_id, self.predicted_place,
            self.object_id, self.actual_place
        ]
        if conn:
            conn.execute(sql, params)
            return True
        return db_manager.execute(sql, params, commit=commit)

    @staticmethod
    def get_all():
        raise NotImplementedError("Prediction.get_all is not implemented")

    @staticmethod
    def get_base_data():
        raise NotImplementedError("Prediction.get_base_data is not implemented")


class Bet(BaseModel):

    def __init__(
            self, user_id: str, event_id: str, predictions: list[Prediction] = None,
            score: int = None, bet_id: str = None
        ):
        if bet_id:
            self.id = bet_id
        else:
            self.id = utils.generate_id([user_id, event_id])
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

    def calc_score(self, results, points_correct_bet, allow_partial_points, commit=True, conn=None):
        for pred in self.predictions:
            actual_place = 9999
            if pred.object_id in [r.object_id for r in results]:
                actual_place = next((item.place for item in results if item.object_id == pred.object_id))
            if not pred.set_actual_place(
                place=actual_place,
                points_correct_bet=points_correct_bet,
                allow_partial_points=allow_partial_points,
                conn=conn
            ):
                return False
        self.score = sum([p.score for p in self.predictions])
        sql = f"UPDATE {db_manager.TABLE_BETS} SET score = ? WHERE id = ?"
        if conn:
            conn.execute(sql, [self.score, self.id])
            return True
        return db_manager.execute(sql, [self.score, self.id], commit=commit)

    def update_predictions(self, new_predictions):
        conn = None
        try:
            conn = db_manager.open_connection()
            if len(self.predictions) > 0:
                for prediction in self.predictions:
                    prediction.delete(conn=conn)

            predictions = [Prediction.from_dict(pred, self.id) for pred in new_predictions]
            self.predictions = predictions

            # ensure bet row exists and insert new predictions in one transaction
            if not self.save_to_db(conn=conn, commit=False):
                raise Exception("Bet could not be saved")
            db_manager.commit_transaction(conn)
            return True
        except Exception as e:
            if conn:
                db_manager.rollback_transaction(conn)
            return False
        finally:
            if conn:
                conn.close()

    @staticmethod
    def get_by_event_id_user_id(event_id, user_id):
        sql = f"SELECT b.* FROM {db_manager.TABLE_BETS} b WHERE b.event_id = ? and b.user_id = ?"
        bet_data = db_manager.query_one(sql, [event_id, user_id])
        if not bet_data:
            return None
        # get predictions
        predictions = Prediction.get_by_id(bet_data["id"])
        return Bet.from_dict(bet_dict=bet_data, predictions=predictions)

    @staticmethod
    def get_by_event_id(event_id: str):
        bets = []
        sql = f"SELECT b.* FROM {db_manager.TABLE_BETS} b WHERE b.event_id = ? "
        bets_data = db_manager.query(sql, [event_id])
        if not bets_data or len(bets_data) == []:
            return bets

        for bet_data in bets_data:
            # get predictions
            predictions = Prediction.get_by_id(bet_data["id"])
            bets.append(Bet.from_dict(bet_dict=bet_data, predictions=predictions))
        return bets

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

    def save_to_db(self, conn=None, commit=True):
        """ Inserts the bet and its predictions into the database.
        If the bet already exists, it is not updated."""
        sql = f"""
            INSERT OR IGNORE INTO {db_manager.TABLE_BETS}
            (id, event_id, user_id, score)
            VALUES (?,?,?,?)
        """
        params = [self.id, self.event_id, self.user_id, self.score]
        if conn:
            conn.execute(sql, params)
            return True
        success = db_manager.execute(
            sql, params, commit=commit)

        for prediction in self.predictions:
            result = prediction.save_to_db(conn=conn, commit=commit)
            if not result:
                return False
        return success

    def delete(self):
        sql = f"DELETE FROM {db_manager.TABLE_BETS} WHERE event_id = ? "
        return db_manager.execute(sql, [self.event_id])

    @staticmethod
    def get_all():
        raise NotImplementedError("Bet.get_all is not implemented")

    @staticmethod
    def get_base_data():
        raise NotImplementedError("Bet.get_base_data is not implemented")

    @staticmethod
    def get_by_id():
        raise NotImplementedError("Bet.get_by_id is not implemented")
