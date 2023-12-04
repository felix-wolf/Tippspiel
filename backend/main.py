import hashlib
from datetime import datetime

from flask import Flask, request
from flask_login import *

from database import db_manager
from models.user import User
from models.athlete import Athlete
from models.country import Country
from models.game import Game

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
    success = User.create(name, pw_hash)
    if success:
        return "Success"
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
        return Game.get_by_id(game_id).to_dict(), 200
    else:
        return "Fehler...", 500


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


def hash_password(pw):
    return hashlib.sha256(pw.encode('utf-8')).hexdigest()


if __name__ == '__main__':
    db_manager.start()
    print("db started")
    app.run(debug=True)
