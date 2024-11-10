from flask import Blueprint, request
from src.models.user import User
from src.models.game import Game
from flask_login import *

user_blueprint = Blueprint('user', __name__)

@user_blueprint.route('/api/user', methods=["GET", "POST"])
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
