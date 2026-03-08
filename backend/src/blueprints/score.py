from flask import Blueprint, request
from src.models.score_event import ScoreEvent
from src.blueprints.api_response import error_response
from src.blueprints.route_helpers import require_query_arg

from flask_login import *

score_blueprint = Blueprint('score', __name__)

@score_blueprint.route("/api/scores", methods=["GET"])
@login_required
def handle_scores_request():
    if request.method == "GET":
        game_id, error = require_query_arg(
            request.args.get("game_id", None),
            "Die Spiel-ID fehlt.",
        )
        if error:
            return error
        score_events = ScoreEvent.get_all_by_game_id(game_id)
        return [e.to_dict() for e in score_events]
