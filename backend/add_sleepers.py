from models.bet import Bet
from models.bet import Prediction

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

for entry in data:
    user_id = entry['userId']
    object_type = entry['type']
    objects = entry['objects']

    predictions = []

    new_bet = Bet(user_id, event_id)

    for index, object_id in enumerate(objects):
        predictions.append(Prediction(new_bet.id, object_id, "", index + 1))
    new_bet.predictions = predictions
    new_bet.save_to_db()


