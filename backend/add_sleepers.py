from src.models.bet import Bet
from src.models.bet import Prediction
from src.models.event import Event
from src.models.event_type import EventType
from src.models.user import User
from src.models.athlete import Athlete
from src.models.country import Country
from src.database import db_manager
from main import create_app
import inquirer


def confirm_with_user(user: str, event: str, objects: []) -> bool:
    print("Are you sure you want to save this?")
    print(f"Event: {event['name']}")
    print(f"User: {user['name']}")
    for index, o in enumerate(objects):
        print(f"Platz {index + 1}: {o['name']}")
    return input("Type YES to confirm: ") == "YES"


def select_game():
    sql = f"SELECT * FROM GAMES;"
    games = db_manager.query(sql)
    choices = [game['name'] for game in games]
    questions = [
        inquirer.List(
            name="game",
            message= 'Select Game',
            choices=choices
        )
    ]
    answers = inquirer.prompt(questions)
    return games[choices.index(answers['game'])]


def select_event(game):
    sql = f"SELECT * FROM EVENTS WHERE game_id = ? ORDER BY datetime ASC;"
    events = db_manager.query(sql, [game['id']])
    choices = [event['name'] for event in events]
    questions = [
        inquirer.List(
            name="event",
            message= 'Select Event',
            choices=choices
        )
    ]
    answers = inquirer.prompt(questions)
    return events[choices.index(answers['event'])]


def select_user(game):
    sql = f"""
        SELECT u.* FROM USERS u 
        INNER JOIN GamePlayers gp on u.id = gp.player_id
        WHERE gp.game_id = ?"""
    users = db_manager.query(sql, [game['id']])
    choices = [user['name'] for user in users]
    questions = [
        inquirer.List(
            name="user",
            message= 'Select Users',
            choices=choices
        )
    ]
    answers = inquirer.prompt(questions)
    return users[choices.index(answers['user'])]


def select_objects_to_bet_on(event):
    event_type = EventType.get_by_id(event['event_type_id'])
    selected_objects = []
    all_objects = []
    for place in range(1, event['num_bets'] + 1):
        print("Place: ", place)
        if event_type.betting_on == 'countries':
            sql = f"SELECT * FROM Countries ORDER BY code"
            objects = db_manager.query(sql)
            all_objects = [{"id": o['code'], "name": o['name']} for o in objects]
            choices = [o['name'] for o in all_objects]
        elif event_type.betting_on == 'athletes':
            sql = f"SELECT * FROM Athletes WHERE discipline = ? ORDER BY gender, last_name"
            objects = db_manager.query(sql, [event_type.discipline_id])
            while True:
                partial_name = input("Input part of name:\t")
                all_objects = [{"id": o['id'], "name": o['last_name'] + ", " + o['first_name']} for o in objects if partial_name in o['first_name'] + o['last_name']]
                choices =  [o['name'] for o in all_objects]
                if len(choices) > 0:
                    break
        questions = [
            inquirer.List(
                name="object",
                message= 'Select Objects:',
                choices=choices
            )
        ]
        answers = inquirer.prompt(questions)
        selected_objects.append(all_objects[choices.index(answers['object'])])
    return selected_objects

if __name__ == '__main__':
    app = create_app("prod")
    # other setup can go here
    with app.app_context():
        game = select_game()    

        event = select_event(game)

        user = select_user(game)

        objects = select_objects_to_bet_on(game, event)

        predictions = []
        new_bet = Bet(user_id=user['id'], event_id=event['id'])

        for index, o in enumerate(objects):
            predictions.append(Prediction(
                    bet_id=new_bet.id,
                    object_id=o["id"],
                    object_name=o['name'],
                    predicted_place=index + 1
            ))
        new_bet.predictions = predictions

        if confirm_with_user(user, event, objects):
            if new_bet.save_to_db():
                print("saving successful.\n")
            else:
                print("Error when saving.\n")
        else:
            print("Did not save.\n")