import hashlib
from datetime import datetime

from flask import Flask, request
from flask_login import *

from database import db_manager
from models.user import User
from models.athlete import Athlete
from models.country import Country
from models.game import Game
from models.event import Event
from models.discipline import Discipline
from models.event_type import EventType

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
            return "Name und/oder Passwort fehlt", 400
        pw_hash = hash_password(pw)
        user_object = User.get_by_credentials(name, pw_hash)
        if not user_object:
            return "Name oder Password falsch", 404
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


@app.route('/api/user')
def handle_user_request():
    game_id = request.args.get("game_id", None)
    if game_id:
        game = Game.get_by_id(game_id)
        return [p.to_dict() for p in game.players]

    user_id = current_user.get_id()
    if user_id:
        return User.get_by_id(user_id).to_dict()
    return "No user logged in", 400


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


@app.route("/api/event", methods=["GET", "POST"])
@login_required
def handle_event_request():
    if request.method == "GET":
        game_id = request.args.get("game_id")
        event_id = request.args.get("event_id")
        if game_id:
            return [event.to_dict() for event in Event.get_all_by_game_id(game_id)]
        if event_id:
            return Event.get_by_id(event_id).to_dict()
        else:
            return "No game_id specified", 404
    elif request.method == "POST":
        user_id = current_user.get_id()
        if not user_id:
            return "not logged in", 400
        name = request.get_json().get("name")
        game_id = request.get_json().get("game_id")
        event_type = request.get_json().get("type")
        dt = request.get_json().get("datetime")
        success, event_id = Event.create(name, game_id, event_type, dt)
        if success:
            return Event.get_by_id(event_id).to_dict()
        else:
            return "Fehler...", 500


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
# @login_required
def process_results():
    if request.method == "POST":
        event_id = request.get_json().get("event_id", None)
        url = request.get_json().get("url", None)
        if not event_id or not url:
            return "Missing parameters", 400
        success = Event.get_by_id(event_id).process_url_for_result(url)
        if success:
            return Event.get_by_id(event_id).to_dict()
        else:
            return "Feher...", 500


def hash_password(pw):
    salt = app.config["SALT"]
    return hashlib.sha256("".join([pw, salt]).encode('utf-8')).hexdigest()


def start_api():
    db_manager.start()
    Country.load_into_db()
    Discipline.load_into_db()
    Athlete.load_into_db()
    EventType.load_into_db()
    print("db started")
    app.run(debug=True)


if __name__ == '__main__':
    start_api()
