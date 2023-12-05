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

app = Flask(__name__)
app.secret_key = "1b98d3e890b6bd7213300e0a98e66856"
login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return User.get_by_id(user_id)


@app.route('/api/status')
def get_time():
    return {'Time': datetime.now()}


@app.route('/api/login', methods=['GET', 'POST'])
def login():
    name = request.args.get("name")
    pw = request.args.get("pw")
    if not name or not pw:
        return "Name und/oder Passwort fehlt", 400
    pw_hash = hash_password(pw)
    user_object = User.get_by_credentials(name, pw_hash)
    if not user_object:
        return "Name oder Password falsch", 404
    login_user(user_object, remember=True)
    return user_object.to_dict()


@app.route('/api/logout')
def logout():
    logout_user()
    return {"Logout": "Successful"}


@app.route('/api/current_user')
def get_cur_user():
    user_id = current_user.get_id()
    if user_id:
        return User.get_by_id(user_id).to_dict()
    return "Not user logged in", 400


@app.route('/api/register')
def register_user():
    name = request.args.get("name")
    pw = request.args.get("pw")
    pw_hash = hash_password(pw)
    success, user_id = User.create(name, pw_hash)
    if success:
        return User.get_by_id(user_id).to_dict()
    else:
        return "Name schon vergeben!", 400


@app.route('/api/athletes')
@login_required
def get_athletes():
    return [a.to_dict() for a in Athlete.get_all()]


@app.route('/api/countries')
@login_required
def get_countries():
    return [country.to_dict() for country in Country.get_all()]


@app.route('/api/game/create')
@login_required
def create_game():
    name = request.args.get("name")
    pw = request.args.get("pw")
    pw_hash = None
    if pw:
        pw_hash = hash_password(pw)
    user_id = current_user.get_id()
    if user_id:
        user_id = User.get_by_id(user_id).id
    success, game_id = Game.create(user_id, name, pw_hash)
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


@app.route('/api/game/get')
@login_required
def fetch_games():
    game_id = request.args.get("id")
    if game_id:
        game = Game.get_by_id(game_id)
        if game:
            return game.to_dict()
        return "Game not found", 404
    else:
        return [game.to_dict() for game in Game.get_all()]


@app.route("/api/event/get")
@login_required
def fetch_events():
    game_id = request.args.get("game_id")
    if game_id:
        return [event.to_dict() for event in Event.get_all_by_game_id(game_id)]
    else:
        return "No game_id specified", 404


def hash_password(pw):
    return hashlib.sha256(pw.encode('utf-8')).hexdigest()


if __name__ == '__main__':
    db_manager.start()
    print("db started")
    app.run(debug=True)
