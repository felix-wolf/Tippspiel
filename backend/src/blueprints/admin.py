from flask import Blueprint, request
from flask_login import login_required

from src.blueprints.admin_service import (
    get_shared_event_detail,
    list_country_diagnostics,
    list_shared_event_diagnostics,
    update_country_metadata,
    update_shared_event_source,
)
from src.blueprints.api_response import error_response
from src.blueprints.route_helpers import parse_json_body, require_admin_user


admin_blueprint = Blueprint("admin", __name__)


@admin_blueprint.route("/api/admin/shared-events", methods=["GET"])
@login_required
def get_admin_shared_events():
    error = require_admin_user()
    if error:
        return error
    return list_shared_event_diagnostics(), 200


@admin_blueprint.route("/api/admin/shared-events/<path:shared_event_id>", methods=["GET"])
@login_required
def get_admin_shared_event_detail(shared_event_id):
    error = require_admin_user()
    if error:
        return error
    payload, error_message, status_code = get_shared_event_detail(shared_event_id)
    if error_message:
        return error_response(error_message, status_code or 500)
    return payload, 200


@admin_blueprint.route("/api/admin/shared-events/<path:shared_event_id>/source", methods=["PUT"])
@login_required
def update_admin_shared_event_source(shared_event_id):
    error = require_admin_user()
    if error:
        return error
    payload, parse_error = parse_json_body(request.get_json(silent=True) or {})
    if parse_error:
        return parse_error
    response_payload, error_message, status_code = update_shared_event_source(shared_event_id, payload)
    if error_message:
        return error_response(error_message, status_code or 500)
    return response_payload, 200


@admin_blueprint.route("/api/admin/countries", methods=["GET"])
@login_required
def get_admin_countries():
    error = require_admin_user()
    if error:
        return error
    return list_country_diagnostics(), 200


@admin_blueprint.route("/api/admin/countries/<code>", methods=["PUT"])
@login_required
def update_admin_country(code):
    error = require_admin_user()
    if error:
        return error
    payload, parse_error = parse_json_body(request.get_json(silent=True) or {})
    if parse_error:
        return parse_error
    response_payload, error_message, status_code = update_country_metadata(code, payload)
    if error_message:
        return error_response(error_message, status_code or 500)
    return response_payload, 200
