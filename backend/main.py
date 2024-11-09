import hashlib
from datetime import datetime

from flask import Flask, request
from flask_login import *
import json
from models.user import User
from models.athlete import Athlete
from models.country import Country
from models.game import Game
from models.event import Event
from models.event_type import EventType
from models.discipline import Discipline
from models.score_event import ScoreEvent

app = Flask(__name__)
app.config.from_pyfile('config.py')
app.secret_key = app.config["SECRET_KEY"]
login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return User.get_by_id(user_id)


@app.route('/api/status')
def get_time():
    return {'Time': datetime.now()}


@app.route('/api/login', methods=['POST'])
def login():
    if request.method == "POST":
        name = request.get_json().get("name")
        pw = request.get_json().get("password")
        if not name or not pw:
            return "Name und/oder Passwort fehlt!", 400
        pw_hash = hash_password(pw)
        user_object = User.get_by_credentials(name, pw_hash)
        if not user_object:
            return "Name oder Password falsch!", 404
        login_user(user_object, remember=True)
        return user_object.to_dict()


@app.route('/api/register', methods=["POST"])
def register_user():
    if request.method == "POST":
        name = request.get_json().get("name")
        pw = request.get_json().get("password")
        pw_hash = hash_password(pw)
        success, user_id = User.create(name, pw_hash)
        if success:
            return User.get_by_id(user_id).to_dict()
        else:
            return "Name schon vergeben!", 400


@app.route('/api/logout')
def logout():
    logout_user()
    return {"message": "Logout successful"}


@app.route('/api/user', methods=["GET", "POST"])
def handle_user_request():
    if request.method == "GET":
        game_id = request.args.get("game_id", None)
        if game_id:
            game = Game.get_by_id(game_id)
            return [p.to_dict() for p in game.players]

        user_id = current_user.get_id()
        if user_id:
            return User.get_by_id(user_id).to_dict()
        return "No user logged in", 400
    elif request.method == "POST":
        user_id = request.get_json().get("user_id", None)
        color = request.get_json().get("color", None)
        if not user_id or not color:
            return "Missing parameters", 400
        user = User.get_by_id(user_id)
        success = user.update_color(color)
        if success:
            return user.to_dict()
        return "Fehler beim Speichern der Farbe", 500


@app.route('/api/athletes')
@login_required
def get_athletes():
    return [a.to_dict() for a in Athlete.get_all()]


@app.route('/api/countries')
@login_required
def get_countries():
    return [country.to_dict() for country in Country.get_all()]


@app.route('/api/disciplines')
@login_required
def get_disciplines():
    return [discipline.to_dict() for discipline in Discipline.get_all()]


@app.route('/api/game', methods=["GET", "POST"])
@login_required
def handle_game_request():
    if request.method == "GET":
        game_id = request.args.get("id")
        if game_id:
            game = Game.get_by_id(game_id)
            if game:
                return game.to_dict()
            return "Game not found", 404
        else:
            return [game.to_dict() for game in Game.get_all()]
    elif request.method == "POST":
        name = request.get_json().get("name", None)
        pw = request.get_json().get("password", None)
        discipline = request.get_json().get("discipline", None)
        if name is None or discipline is None:
            return "Missing parameters", 400
        pw_hash = None
        if pw:
            pw_hash = hash_password(pw)
        user_id = current_user.get_id()
        success, game_id = Game.create(user_id=user_id, name=name, pw_hash=pw_hash, discipline_name=discipline)
        if success:
            return Game.get_by_id(game_id).to_dict()
        else:
            return "Fehler...", 500


@app.route("/api/game/join")
@login_required
def join_game():
    user_id = request.args.get("user_id")
    game_id = request.args.get("game_id")
    pw = request.args.get("pw")
    game = Game.get_by_id(game_id)
    if game.pw_hash and hash_password(pw) != game.pw_hash:
        return "Passwort falsch", 400
    user = User.get_by_id(user_id)
    if game and user:
        success = game.add_player(user)
        if success:
            return game.to_dict()
        else:
            return "Beitreten nicht erfolgreich!", 400
    return "Tippspiel oder spieler konnte nicht gefunden werden!", 400


@app.route("/api/event", methods=["GET", "POST", "PUT"])
@login_required
def handle_event_request():
    """
    Requests events from the database. Request can be GET for fetch, PUT for update and POST for create.
    Events are sorted by their time.

    GET
    :url_param game_id - str:   OPTIONAL parameter of the game events belong to.
                                Specify to get all events for single game
    :url_param event_id - str:  OPTIONAL id of single event to fetch.
                                Specify to get only single event
    :url_param page - int:  OPTIONAL page number to fetch. Single Page holds 5 events.
                            Specify to get only subset of events.

    :return:
    """
    if request.method == "GET":
        game_id = request.args.get("game_id")
        event_id = request.args.get("event_id")
        page_num = request.args.get("page", type=int)
        past = request.args.get("past") == "true"
        full_object = request.args.get("full_object") == "true"
        if game_id:
            return [event.to_dict() for event in Event.get_all_by_game_id(game_id, full_object, page_num, past)]
        if event_id:
            return Event.get_by_id(event_id, full_object).to_dict()
        else:
            return "No game_id specified", 404
    elif request.method == "POST":
        events = request.get_json().get("events")
        if events is not None:
            parsed_events = []
            for event_string in events:
                e_dict = json.loads(event_string)
                event_type = EventType.from_dict(e_dict['event_type'])
                event = Event.from_dict(e_dict, event_type)
                parsed_events.append(event)
            success = Event.save_events(parsed_events)
            if success:
                return [e.to_dict() for e in parsed_events]
            else:
                return "Fehler beim speichern der Events", 500
        
        name = request.get_json().get("name")
        game_id = request.get_json().get("game_id")
        event_type = request.get_json().get("type")
        dt = request.get_json().get("datetime")
        if not name or not game_id or not event_type or not dt:
            return "Required params not spefified", 500
        dt = datetime.strptime(dt, "%d.%m.%Y, %H:%M:%S")
        success, event_id, event = Event.create(name, game_id, event_type, dt)
        if success:
            return event.to_dict()
        else:
            return "Fehler...", 500
    elif request.method == "PUT":
        name = request.get_json().get("name")
        game_id = request.get_json().get("game_id")
        event_type = request.get_json().get("type")
        dt = request.get_json().get("datetime")
        event_id = request.get_json().get("event_id")
        if not name or not game_id or not event_type or not dt or not event_id:
            return "Required params not spefified", 500
        dt = datetime.strptime(dt, "%d.%m.%Y, %H:%M:%S")
        success, event = Event.get_by_id(event_id).update(name, event_type, dt)
        if success:
            return event.to_dict()
        else:
            return "Fehler...", 500


@app.route("/api/event/delete", methods=["POST"])
@login_required
def delete_event():
    if request.method == "POST":
        event_id = request.get_json().get("event_id", None)
        event = Event.get_by_id(event_id)
        if not event:
            return "Event konnte nicht gefunden werden", 404
        success = event.delete()
        if success:
            return {"deleted_id": event_id}
        else:
            return "Fehler beim Löschen des Events", 500


@app.route("/api/event/save_bets", methods=["POST"])
@login_required
def save_bets():
    if request.method == "POST":
        event_id = request.get_json().get("event_id", None)
        user_id = request.get_json().get("user_id", None)
        predictions = request.get_json().get("predictions", None)
        if not event_id or not predictions:
            return "Missing parameters", 400
        event = Event.get_by_id(event_id)
        if not event:
            return "Fehler...", 500
        success, event_id = event.save_bet(user_id, predictions)
        if success:
            return Event.get_by_id(event_id).to_dict()
        else:
            return "Fehler...", 500


@app.route("/api/results", methods=["POST"])
@login_required
def process_results():
    if request.method == "POST":
        event_id = request.get_json().get("event_id", None)
        event = Event.get_by_id(event_id)
        if not event:
            return "Event nicht gefunden", 400
        url = request.get_json().get("url", None)
        results = request.get_json().get("results", None)
        if url:
            # check if discipline allows url updates and if url matches result_url
            discipline = Discipline.get_by_id(event.event_type.discipline_id)
            if not discipline:
                return "Fehler...", 500
            if not discipline.validate_result_url(url):
                return "Disziplin erlaubt keine URL Ergebnisse / URL falsch", 400
            results, error = discipline.preprocess_results_for_discipline(url, event)
            if error:
                return error, 500

        if not results:
            return "Missing parameters", 400

        success, error = event.process_results(results)
        if success:
            return Event.get_by_id(event_id).to_dict()
        else:
            return error, 500


@app.route("/api/game/events")
@login_required
def handle_events_import_url():
    if request.method == "GET":
        game_id = request.args.get("game_id", None)
        game = Game.get_by_id(game_id)
        if not game:
            return "Game nicht gefunden", 400
        url = request.args.get("url", None)
        if url:
            # check if discipline allows fetching events from url matches events_url
            discipline = Discipline.get_by_id(game.discipline.id)
            if not discipline:
                return "Fehler...", 500
            if not discipline.validate_events_url(url):
                return "Disziplin erlaubt keine URL Events / URL falsch", 400
            results, error = discipline.process_events_url(url, game_id=game.id)
            if error:
                return error, 500
            return [e.to_dict() for e in results]

        if not results:
            return "Missing parameters", 400


@app.route("/api/scores", methods=["GET"])
@login_required
def handle_scores_request():
    if request.method == "GET":
        game_id = request.args.get("game_id", None)
        if not game_id:
            return "Game_id not specified", 400
        score_events = ScoreEvent.get_all_by_game_id(game_id)
        return [e.to_dict() for e in score_events]


def hash_password(pw):
    salt = app.config["SALT"]
    return hashlib.sha256("".join([pw, salt]).encode('utf-8')).hexdigest()


if __name__ == '__main__':
    app.run(debug=True)
