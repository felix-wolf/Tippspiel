from flask import Blueprint, request
from flask_login import *
from src.blueprints.route_helpers import (
    get_event_or_error,
    get_game_or_error,
    parse_json_body,
    require_admin_user,
    require_admin_user_or_task_token,
    require_game_owner,
)
from src.blueprints.service_result import ensure_service_result
from src.blueprints.result_service import (
    apply_official_result_refresh,
    check_recent_results,
    clear_event_results,
    force_rescore_event,
    preview_official_result_refresh,
    process_event_results,
)

result_blueprint = Blueprint('result', __name__)

@result_blueprint.route("/api/results/check", methods=["GET"])
def check_results():
    error = require_admin_user_or_task_token()
    if error:
        return error
    return ensure_service_result(check_recent_results()).to_response()

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
        owner_error = require_game_owner(game)
        admin_error = require_admin_user()
        if owner_error and admin_error:
            return admin_error
        url = payload.get("url", None)
        results_json = payload.get("results", None)

        return ensure_service_result(process_event_results(
            event=event,
            game=game,
            url=url,
            results_json=results_json,
        )).to_response()


@result_blueprint.route("/api/admin/events/<event_id>/results/preview-refresh", methods=["POST"])
@login_required
def preview_admin_result_refresh(event_id):
    error = require_admin_user()
    if error:
        return error
    event, error = get_event_or_error(event_id)
    if error:
        return error
    return ensure_service_result(preview_official_result_refresh(event)).to_response()


@result_blueprint.route("/api/admin/events/<event_id>/results/apply-refresh", methods=["POST"])
@login_required
def apply_admin_result_refresh(event_id):
    error = require_admin_user()
    if error:
        return error
    event, error = get_event_or_error(event_id)
    if error:
        return error
    payload, parse_error = parse_json_body(request.get_json(silent=True) or {})
    if parse_error:
        return parse_error
    resend_notifications = bool(payload.get("resend_notifications"))
    return ensure_service_result(apply_official_result_refresh(
        event=event,
        resend_notifications=resend_notifications,
    )).to_response()


@result_blueprint.route("/api/admin/events/<event_id>/results", methods=["DELETE"])
@login_required
def delete_admin_results(event_id):
    error = require_admin_user()
    if error:
        return error
    event, error = get_event_or_error(event_id)
    if error:
        return error
    return ensure_service_result(clear_event_results(event)).to_response()


@result_blueprint.route("/api/admin/events/<event_id>/results/rescore", methods=["POST"])
@login_required
def rescore_admin_results(event_id):
    error = require_admin_user()
    if error:
        return error
    event, error = get_event_or_error(event_id)
    if error:
        return error
    return ensure_service_result(force_rescore_event(event)).to_response()
