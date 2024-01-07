from models.bet import Bet
from models.bet import Prediction
from models.event import Event
from models.user import User
from models.athlete import Athlete
from models.country import Country


def getObjectName(object_type: str, object_id: str) -> str:
    if object_type == "a":
        return next(" ".join([a.first_name, a.last_name]) for a in Athlete.get_all() if a.id == object_id)
    if object_type == "c":
        return next(c.name for c in Country.get_all() if c.code == object_id)


def confirm_with_user(user_id: str, event_id: str, objects: [], object_type: str) -> bool:
    print("Are you sure you want to save this?")
    print(f"Event: {Event.get_by_id(event_id).name}")
    print(f"User: {User.get_by_id(user_id).name}")
    for index, object_id in enumerate(objects):
        print(f"Platz {index + 1}: {getObjectName(object_type, object_id)}")
    return input("Type YES to confirm") == "YES"


event_id = "535160c3433a9a4fc2d5890a42e16cc8"
data = [
    # {"userId": "userId", "type": "c || a", "objects": ["id_1", "id_2", "id_3", "id_4", "id_5"]}
    {
        # luisa
        "userId": "c70121869c3b3560d55ebadfbef2fe13",
        "type": "c",
        "objects": [
            "NOR",
            "GER",
            "SWE",
            "FRA",
            "ITA"
        ]
    },
    {
        # ute
        "userId": "28ac3f81293bc9112f05bfb2b9dfb9cd",
        "type": "c",
        "objects": [
            "NOR",
            "FRA",
            "GER",
            "SWE",
            "ITA"
        ]
    },
]

if __name__ == '__main__':
    for entry in data:
        user_id = entry['userId']
        object_type = entry['type']
        objects = entry['objects']

        predictions = []

        new_bet = Bet(user_id, event_id)

        for index, object_id in enumerate(objects):
            predictions.append(Prediction(new_bet.id, object_id, "", index + 1))
        new_bet.predictions = predictions

        if confirm_with_user(user_id, event_id, objects, object_type):
            if new_bet.save_to_db():
                print("saving successful.\n")
            else:
                print("Error when saving.\n")
        else:
            print("Did not save.\n")


