from flask import Blueprint, request
from src.models.score_event import ScoreEvent
from src.blueprints.api_response import error_response

from flask_login import *

score_blueprint = Blueprint('score', __name__)

@score_blueprint.route("/api/scores", methods=["GET"])
@login_required
def handle_scores_request():
    if request.method == "GET":
        game_id = request.args.get("game_id", None)
        if not game_id:
            return error_response("Die Spiel-ID fehlt.", 400)
        score_events = ScoreEvent.get_all_by_game_id(game_id)
        return [e.to_dict() for e in score_events]
