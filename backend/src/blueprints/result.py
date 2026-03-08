from flask import Blueprint, request
from flask_login import *
from src.blueprints.api_response import error_response
from src.blueprints.route_helpers import get_event_or_error, get_game_or_error, parse_json_body, require_game_owner
from src.blueprints.result_service import check_recent_results, process_event_results

result_blueprint = Blueprint('result', __name__)

@result_blueprint.route("/api/results/check", methods=["GET"])
def check_results():
    payload, error_message, status_code = check_recent_results()
    if error_message:
        return error_response(error_message, status_code or 500)
    return payload, 200

@result_blueprint.route("/api/results", methods=["POST"])
@login_required
def process_results():
    if request.method == "POST":
        payload, error = parse_json_body(
            request.get_json(silent=True),
            required_fields=["event_id"],
        )
        if error:
            return error
        event_id = payload.get("event_id")
        event, error = get_event_or_error(event_id)
        if error:
            return error
        game, error = get_game_or_error(
            event.game_id,
            not_found_message="Das zugehörige Tippspiel wurde nicht gefunden.",
        )
        if error:
            return error
        # only game owner can submit results
        error = require_game_owner(game)
        if error:
            return error
        url = payload.get("url", None)
        results_json = payload.get("results", None)

        response_payload, error_message, status_code = process_event_results(
            event=event,
            game=game,
            url=url,
            results_json=results_json,
        )
        if error_message:
            return error_response(error_message, status_code or 500)
        return response_payload
