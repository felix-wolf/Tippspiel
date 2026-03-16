from flask import Blueprint, request
from flask_login import login_required

from src.blueprints.admin_service import (
    get_shared_event_detail,
    list_admin_operations,
    list_country_diagnostics,
    list_shared_event_diagnostics,
    update_country_metadata,
    update_shared_event_source,
)
from src.blueprints.route_helpers import current_operation_actor, parse_json_body, require_admin_user
from src.blueprints.service_result import ensure_service_result
from src.models.admin_operation import AdminOperation


admin_blueprint = Blueprint("admin", __name__)


def _record_admin_operation(*, action_type: str, status: str, summary: str, target_type=None, target_id=None, details=None):
    AdminOperation.record(
        actor=current_operation_actor(),
        action_type=action_type,
        status=status,
        summary=summary,
        target_type=target_type,
        target_id=target_id,
        details=details,
    )


@admin_blueprint.route("/api/admin/shared-events", methods=["GET"])
@login_required
def get_admin_shared_events():
    error = require_admin_user()
    if error:
        return error
    return ensure_service_result(list_shared_event_diagnostics()).to_response()


@admin_blueprint.route("/api/admin/operations", methods=["GET"])
@login_required
def get_admin_operations():
    error = require_admin_user()
    if error:
        return error
    return ensure_service_result(list_admin_operations()).to_response()


@admin_blueprint.route("/api/admin/shared-events/<path:shared_event_id>", methods=["GET"])
@login_required
def get_admin_shared_event_detail(shared_event_id):
    error = require_admin_user()
    if error:
        return error
    return ensure_service_result(get_shared_event_detail(shared_event_id)).to_response()


@admin_blueprint.route("/api/admin/shared-events/<path:shared_event_id>/source", methods=["PUT"])
@login_required
def update_admin_shared_event_source(shared_event_id):
    error = require_admin_user()
    if error:
        return error
    payload, parse_error = parse_json_body(request.get_json(silent=True) or {})
    if parse_error:
        return parse_error
    result = ensure_service_result(update_shared_event_source(shared_event_id, payload))
    _record_admin_operation(
        action_type="shared_event_source_update",
        status="succeeded" if not result.is_error else "failed",
        summary=(
            f"Shared Event {shared_event_id} source mapping updated."
            if not result.is_error
            else f"Shared Event {shared_event_id} source mapping update failed."
        ),
        target_type="shared_event",
        target_id=shared_event_id,
        details=result.payload if not result.is_error else {"error": result.error_message, "payload": payload},
    )
    return result.to_response()


@admin_blueprint.route("/api/admin/countries", methods=["GET"])
@login_required
def get_admin_countries():
    error = require_admin_user()
    if error:
        return error
    return ensure_service_result(list_country_diagnostics()).to_response()


@admin_blueprint.route("/api/admin/countries/<code>", methods=["PUT"])
@login_required
def update_admin_country(code):
    error = require_admin_user()
    if error:
        return error
    payload, parse_error = parse_json_body(request.get_json(silent=True) or {})
    if parse_error:
        return parse_error
    result = ensure_service_result(update_country_metadata(code, payload))
    _record_admin_operation(
        action_type="country_update",
        status="succeeded" if not result.is_error else "failed",
        summary=(
            f"Country metadata for {code} updated."
            if not result.is_error
            else f"Country metadata update for {code} failed."
        ),
        target_type="country",
        target_id=code,
        details=result.payload if not result.is_error else {"error": result.error_message, "payload": payload},
    )
    return result.to_response()
