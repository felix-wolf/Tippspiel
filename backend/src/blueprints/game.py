from flask import Blueprint, request, current_app
from src.models.game import Game
from src.models.user import User
from src.models.discipline import Discipline
from src.utils import hash_game_password
from src.blueprints.api_response import error_response

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
            return error_response("Das Tippspiel wurde nicht gefunden.", 404)
        else:
            return [game.to_dict() for game in Game.get_all()]
    elif request.method == "POST":
        current_user_id = current_user.get_id()
        if not current_user_id:
            return error_response("Anmeldung erforderlich.", 401)
        name = request.get_json().get("name", None)
        pw = request.get_json().get("password", None)
        discipline = request.get_json().get("discipline", None)
        if name is None or discipline is None:
            return error_response("Erforderliche Angaben fehlen.", 400)
        pw_hash = None
        if pw:
            pw_hash = hash_game_password(pw)
        success, game_id = Game.create(user_id=current_user_id, name=name, pw_hash=pw_hash, discipline_name=discipline)
        if success:
            return Game.get_by_id(game_id).to_dict()
        else:
            return error_response("Das Tippspiel konnte nicht erstellt werden.", 500)

@game_blueprint.route("/api/game/events")
@login_required
def handle_events_import_url():
    if request.method == "GET":
        game_id = request.args.get("game_id", None)
        game = Game.get_by_id(game_id)
        if not game:
            return error_response("Das Tippspiel wurde nicht gefunden.", 404)
        if game.creator.id != current_user.get_id():
            return error_response("Du bist für diese Aktion nicht berechtigt.", 403)
        url = request.args.get("url", None)
        if url:
            # check if discipline allows fetching events from url matches events_url
            discipline = Discipline.get_by_id(game.discipline.id)
            if not discipline:
                return error_response("Die Events konnten nicht importiert werden.", 500)
            if not discipline.validate_events_url(url):
                return error_response("Die Event-URL ist für diese Disziplin ungültig.", 400)
            results, error = discipline.process_events_url(url, game_id=game.id)
            if error or not results:
                return error_response(error or "Die Events konnten nicht importiert werden.", 500)
            return [e.to_dict() for e in results]

@game_blueprint.route("/api/game/join", methods=["POST"])
@login_required
def join_game():
    game_id = request.get_json().get("game_id")
    pw = request.get_json().get("password")
    user_id = current_user.get_id()
    game = Game.get_by_id(game_id)
    if not game:
        return error_response("Das Tippspiel wurde nicht gefunden.", 404)
    if not game.verify_password(pw, current_app.config["SALT"]):
        return error_response("Das Passwort ist falsch.", 400)
    user = User.get_by_id(user_id)
    if game and user:
        if user_id in [p.id for p in game.players]:
            # User is already a player
            return error_response("Du bist diesem Tippspiel bereits beigetreten.", 400)
        success = game.add_player(user)
        if success:
            return game.to_dict()
        else:
            return error_response("Du konntest dem Tippspiel nicht beitreten.", 400)
    return error_response("Das Tippspiel wurde nicht gefunden.", 404)

@game_blueprint.route("/api/game/delete", methods=['DELETE'])
@login_required
def delete_game():
    game_id = request.get_json().get("game_id")
    game = Game.get_by_id(game_id)
    if game:
        if game.creator.id != current_user.get_id():
            return error_response("Du bist für diese Aktion nicht berechtigt.", 403)
        success = game.delete()
        if success:
            return {"deleted_id": game_id}
        return error_response("Das Tippspiel konnte nicht gelöscht werden.", 500)
    return error_response("Das zu löschende Tippspiel wurde nicht gefunden.", 404)

@game_blueprint.route("/api/game/update", methods=['PUT'])
@login_required
def update():
    game_id = request.get_json().get("game_id", None)
    name = request.get_json().get("name", None)
    game = Game.get_by_id(game_id)
    if game:
        if game.creator.id != current_user.get_id():
            return error_response("Du bist für diese Aktion nicht berechtigt.", 403)
        success, updated_game = game.update(name)
        if success:
            return updated_game.to_dict()
        return error_response("Das Tippspiel konnte nicht aktualisiert werden.", 500)
    return error_response("Das zu aktualisierende Tippspiel wurde nicht gefunden.", 404)

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
        return error_response("Die Anzahl der Events konnte nicht geladen werden.", 500)
    return error_response("Das Tippspiel wurde nicht gefunden.", 404)
