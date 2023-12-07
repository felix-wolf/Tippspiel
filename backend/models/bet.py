class Placement:

    def __init__(self, predicted_place, object_id, actual_place=None):
        self.predicted_place = predicted_place
        self.object_id = object_id
        self.actual_place = actual_place

    def to_dict(self):
        d = {
            "predicted_place": self.predicted_place,
            "object_id": self.object_id,
            "actual_place": self.actual_place
        }


class Bet:

    def __init__(self, user_id: str, placements: [Placement]):
        self.user_id = user_id
        self.placements = placements
        self.score = None

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

    def save_to_db(self):
        print("NOT IMPLEMENTATION")
