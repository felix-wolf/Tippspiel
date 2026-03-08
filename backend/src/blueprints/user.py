from flask import Blueprint, request
from src.models.user import User
from src.models.game import Game
from flask_login import *
from src.blueprints.api_response import error_response
from src.blueprints.route_helpers import get_game_or_error, parse_json_body

user_blueprint = Blueprint('user', __name__)

@user_blueprint.route('/api/user', methods=["GET", "POST"])
@login_required
def handle_user_request():
    if request.method == "GET":
        game_id = request.args.get("game_id", None)
        if game_id:
            game, error = get_game_or_error(game_id)
            if error:
                return error
            return [p.to_dict() for p in game.players]

        user_id = current_user.get_id()
        if user_id:
            return User.get_by_id(user_id).to_dict()
        return error_response("Es ist kein Benutzer angemeldet.", 400)
    elif request.method == "POST":
        payload, error = parse_json_body(
            request.get_json(silent=True),
            required_fields=["color"],
        )
        if error:
            return error
        color = payload.get("color")
        user_id = current_user.get_id()
        user = User.get_by_id(user_id)
        success = user.update_color(color)
        if success:
            return user.to_dict()
        return error_response("Die Farbe konnte nicht gespeichert werden.", 500)
