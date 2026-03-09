from flask import Blueprint, request, current_app
from src.models.game import Game
from src.models.game_stats import GameStats
from src.models.user import User
from src.utils import hash_game_password
from src.blueprints.api_response import error_response
from src.blueprints.route_helpers import (
    get_game_or_error,
    parse_json_body,
    require_game_member,
    require_query_arg,
    require_game_owner,
)
from src.blueprints.game_service import import_events_from_url

from flask_login import *

game_blueprint = Blueprint('game', __name__)

@game_blueprint.route('/api/game', methods=["GET", "POST"])
@login_required
def handle_game_request():
    if request.method == "GET":
        game_id = request.args.get("id")
        if game_id:
            game, error = get_game_or_error(game_id)
            if error:
                return error
            return game.to_dict()
        else:
            return [game.to_dict() for game in Game.get_all()]
    elif request.method == "POST":
        payload, error = parse_json_body(
            request.get_json(silent=True),
            required_fields=["name", "discipline"],
        )
        if error:
            return error
        current_user_id = current_user.get_id()
        name = payload.get("name")
        pw = payload.get("password")
        discipline = payload.get("discipline")
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
        game, error = get_game_or_error(game_id)
        if error:
            return error
        error = require_game_owner(game)
        if error:
            return error
        url = request.args.get("url", None)
        events, error_message, status_code = import_events_from_url(game=game, url=url)
        if error_message:
            return error_response(error_message, status_code or 500)
        return [event.to_dict() for event in events]

@game_blueprint.route("/api/game/join", methods=["POST"])
@login_required
def join_game():
    payload, error = parse_json_body(
        request.get_json(silent=True),
        required_fields=["game_id", "password"],
    )
    if error:
        return error
    game_id = payload.get("game_id")
    pw = payload.get("password")
    user_id = current_user.get_id()
    game, error = get_game_or_error(game_id)
    if error:
        return error
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
    payload, error = parse_json_body(
        request.get_json(silent=True),
        required_fields=["game_id"],
    )
    if error:
        return error
    game_id = payload.get("game_id")
    game, error = get_game_or_error(
        game_id,
        not_found_message="Das zu löschende Tippspiel wurde nicht gefunden.",
    )
    if error:
        return error
    error = require_game_owner(game)
    if error:
        return error
    success = game.delete()
    if success:
        return {"deleted_id": game_id}
    return error_response("Das Tippspiel konnte nicht gelöscht werden.", 500)

@game_blueprint.route("/api/game/update", methods=['PUT'])
@login_required
def update():
    payload, error = parse_json_body(
        request.get_json(silent=True),
        required_fields=["game_id", "name"],
    )
    if error:
        return error
    game_id = payload.get("game_id")
    name = payload.get("name")
    game, error = get_game_or_error(
        game_id,
        not_found_message="Das zu aktualisierende Tippspiel wurde nicht gefunden.",
    )
    if error:
        return error
    error = require_game_owner(game)
    if error:
        return error
    success, updated_game = game.update(name)
    if success:
        return updated_game.to_dict()
    return error_response("Das Tippspiel konnte nicht aktualisiert werden.", 500)

@game_blueprint.route("/api/game/num_events", methods=['GET'])
@login_required
def get_num_events():
    game_id = request.args.get("game_id")
    past = bool(int(request.args.get("past", "0")))
    game, error = get_game_or_error(game_id)
    if error:
        return error
    success, num_events = game.get_num_events(past)
    if success:
        return {"num_events": num_events}
    return error_response("Die Anzahl der Events konnte nicht geladen werden.", 500)


@game_blueprint.route("/api/game/stats", methods=["GET"])
@login_required
def get_game_stats():
    game_id, error = require_query_arg(
        request.args.get("game_id"),
        "Die Spiel-ID fehlt.",
    )
    if error:
        return error
    game, error = get_game_or_error(game_id)
    if error:
        return error
    error = require_game_member(game)
    if error:
        return error
    selected_user_id = request.args.get("user_id") or current_user.get_id()
    if selected_user_id not in [player.id for player in game.players]:
        return error_response("Der Nutzer gehoert nicht zu diesem Tippspiel.", 400)
    return GameStats.get_for_game_user(game_id=game.id, user_id=selected_user_id)
