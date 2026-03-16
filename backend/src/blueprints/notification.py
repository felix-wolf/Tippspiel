from flask import Blueprint, request
from flask_login import *
from src.models.notification_helper import NotificationHelper
from src.blueprints.api_response import error_response
from src.blueprints.route_helpers import (
    current_operation_actor,
    parse_json_body,
    require_admin_user_or_task_token,
    require_query_arg,
)
from src.blueprints.notification_service import send_due_bet_reminders
from src.models.admin_operation import AdminOperation

notification_blueprint = Blueprint('notification', __name__)


def _record_operation(*, action_type: str, status: str, summary: str, details=None):
    AdminOperation.record(
        actor=current_operation_actor(),
        action_type=action_type,
        status=status,
        summary=summary,
        target_type="background_job",
        target_id=action_type,
        details=details,
    )

@notification_blueprint.route("/api/notification/register_device", methods=['GET', 'POST'])
@login_required
def register_device():
    if request.method == "GET":
        return error_response("Diese Methode wird nicht unterstützt.", 400)
    if request.method == "POST":
        payload, error = parse_json_body(
            request.get_json(silent=True),
            required_fields=["token", "platform"],
        )
        if error:
            return error
        token = payload.get("token")
        platform = payload.get("platform")

        user_id = current_user.get_id()
        NotificationHelper.save_to_db(token=token, user_id=user_id, platform=platform)
        return {'token': token }

@notification_blueprint.route("/api/notification/test", methods=['POST'])
@login_required
def send_test_notification():
    if request.method == "POST":
        payload, error = parse_json_body(
            request.get_json(silent=True),
            required_fields=["platform"],
        )
        if error:
            return error
        platform = payload.get("platform")

        user_id = current_user.get_id()
        response = NotificationHelper.get_token(user_id=user_id, platform=platform)
        if not response:
            return error_response("Für dieses Gerät wurden keine Benachrichtigungen eingerichtet.", 404)
        NotificationHelper.send_push_notification(response['device_token'], "Das hier ist ein Test", "Test123")
        return {'token': response }


@notification_blueprint.route('/api/notification/check', methods=['GET'])
def send_notification():
    error = require_admin_user_or_task_token()
    if error:
        return error
    payload, error_message, status_code = send_due_bet_reminders()
    if error_message:
        _record_operation(
            action_type="notification_check",
            status="failed",
            summary="Bet reminder check failed.",
            details={"error": error_message, "status_code": status_code or 500},
        )
        return error_response(error_message, status_code or 500)
    _record_operation(
        action_type="notification_check",
        status="succeeded",
        summary="Bet reminder check completed.",
        details=payload,
    )
    return payload, 200


@notification_blueprint.route('/api/notification/settings', methods=['GET', 'POST'])
@login_required
def settings():
    user_id = current_user.get_id()
    if request.method == "GET":
        platform, error = require_query_arg(
            request.args.get("platform"),
            "Die Plattform fehlt.",
        )
        if error:
            return error
        settings = NotificationHelper.get_notification_settings_for_user(user_id=user_id, platform=platform)
        if settings is None:
            return error_response("Es wurden keine Benachrichtigungseinstellungen gefunden.", 404)
        return settings
    if request.method == "POST":
        payload, error = parse_json_body(
            request.get_json(silent=True),
            required_fields=["platform", "setting", "value"],
        )
        if error:
            return error
        platform = payload.get("platform")
        setting = payload.get("setting")
        value = payload.get("value")
        success = NotificationHelper.save_setting(user_id=user_id, platform=platform, setting=setting, value=bool(int(value)))
        if not success:
            return error_response("Für dieses Gerät wurden noch keine Benachrichtigungen eingerichtet.", 400)
    return {"Code": 200}
