from flask import Blueprint, request, current_app
from src.models.game import Game
from src.models.user import User
from src.models.discipline import Discipline
from src.utils import hash_password

from flask_login import *

game_blueprint = Blueprint('game', __name__)

@game_blueprint.route('/api/game', methods=["GET", "POST"])
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
            pw_hash = hash_password(pw, current_app.config["SALT"])
        user_id = current_user.get_id()
        success, game_id = Game.create(user_id=user_id, name=name, pw_hash=pw_hash, discipline_name=discipline)
        if success:
            return Game.get_by_id(game_id).to_dict()
        else:
            return "Fehler...", 500

@game_blueprint.route("/api/game/events")
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
            if error or not results:
                return error, 500
            return [e.to_dict() for e in results]

@game_blueprint.route("/api/game/join")
@login_required
def join_game():
    user_id = request.args.get("user_id")
    game_id = request.args.get("game_id")
    pw = request.args.get("pw")
    game = Game.get_by_id(game_id)
    if game.pw_hash and hash_password(pw, current_app.config["SALT"]) != game.pw_hash:
        return "Passwort falsch", 400
    user = User.get_by_id(user_id)
    if game and user:
        success = game.add_player(user)
        if success:
            return game.to_dict()
        else:
            return "Beitreten nicht erfolgreich!", 400
    return "Tippspiel oder spieler konnte nicht gefunden werden!", 400

@game_blueprint.route("/api/game/delete", methods=['GET'])
@login_required
def delete_game():
    game_id = request.args.get("game_id")
    game = Game.get_by_id(game_id)
    if game:
        success = game.delete()
        if success:
            return {"deleted_id": game_id}
        return "Error deleting game", 500
    return "Game to delete could not be found", 404

@game_blueprint.route("/api/game/update", methods=['PUT'])
@login_required
def update():
    game_id = request.get_json().get("game_id", None)
    name = request.get_json().get("name", None)
    game = Game.get_by_id(game_id)
    if game:
        success, updated_game = game.update(name)
        if success:
            return updated_game.to_dict()
        return "Error updating game", 500
    return "Game to update could not be found", 404

@game_blueprint.route("/api/game/num_events", methods=['GET'])
@login_required
def get_num_events():
    game_id = request.args.get("game_id")
    past = bool(int(request.args.get("past", "0")))
    game = Game.get_by_id(game_id)
    if game:
        success, num_events = game.get_num_events(past)
        if success:
            return {"num_events": num_events}
        return "Error deleting game", 500
    return "Game to delete could not be found", 404