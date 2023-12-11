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
                 object_id: str, actual_place: int = None, score: int = None):
        self.user_id = user_id
        self.event_id = event_id
        self.predicted_place = predicted_place
        self.object_id = object_id
        self.actual_place = actual_place
        self.score = score

    def calc_score(self):
        return 12

    def to_dict(self):
        d = {
            "user_id": self.user_id,
            "placements": [p.to_dict() for p in self.placements]
        }
        score = self.calc_score()
        if score:
            d["score"] = score
        return d

    @staticmethod
    def from_dict(bet_dict: str = None):
        if bet_dict:
            try:
                return Bet(
                    user_id=bet_dict['id'], event_id=bet_dict['name'], predicted_place=bet_dict['predicted_place'],
                    object_id=bet_dict['object_id'], actual_place=bet_dict["actual_place"]
                )
            except KeyError as e:
                print("Could not instantiate bet with given values:", bet_dict)
                return None
        else:
            return None

    def save_to_db(self):
        print("NOT IMPLEMENTATION")
