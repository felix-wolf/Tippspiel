from flask import Blueprint, request, current_app
from src.models.user import User
from flask_login import *
from src.utils import hash_user_password
from src.blueprints.api_response import error_response
from src.blueprints.route_helpers import parse_json_body
from src.models.email_sender import EmailSender
from src.models.password_reset_token import PasswordResetToken
from src.utils import normalize_email

login_blueprint = Blueprint('login', __name__)

@login_blueprint.route('/api/login', methods=['POST'])
def login():
    if request.method == "POST":
        payload, error = parse_json_body(
            request.get_json(silent=True),
            required_fields=["name", "password"],
            missing_message="Benutzername oder E-Mail und Passwort sind erforderlich.",
        )
        if error:
            return error
        name = payload.get("name")
        pw = payload.get("password")
        user_object = User.authenticate(name, pw, current_app.config["SALT"])
        if not user_object:
            return error_response("Benutzername, E-Mail oder Passwort ist falsch.", 401)
        login_user(user_object, remember=True)
        return user_object.to_dict(include_private=True)


@login_blueprint.route('/api/register', methods=["POST"])
def register_user():
    if request.method == "POST":
        payload, error = parse_json_body(
            request.get_json(silent=True),
            required_fields=["name", "password"],
            missing_message="Benutzername und Passwort sind erforderlich.",
        )
        if error:
            return error
        name = payload.get("name")
        pw = payload.get("password")
        try:
            email = normalize_email(payload.get("email"))
        except ValueError:
            return error_response("Bitte gib eine gueltige E-Mail-Adresse an.", 400)
        pw_hash = hash_user_password(pw)
        success, user_id = User.create(name, pw_hash, email=email)
        if success:
            return User.get_by_id(user_id).to_dict(include_private=True)
        else:
            return error_response("Dieser Benutzername oder diese E-Mail-Adresse ist bereits vergeben.", 409)


@login_blueprint.route('/api/password-reset/request', methods=['POST'])
def request_password_reset():
    payload, error = parse_json_body(
        request.get_json(silent=True),
        required_fields=["email"],
        missing_message="E-Mail-Adresse ist erforderlich.",
    )
    if error:
        return error
    try:
        email = normalize_email(payload.get("email"))
    except ValueError:
        return error_response("Bitte gib eine gueltige E-Mail-Adresse an.", 400)

    if not EmailSender.is_configured(current_app.config):
        return error_response("Passwort-Reset ist derzeit nicht verfuegbar.", 503)

    user = User.get_by_email(email)
    if user:
        reset_token = PasswordResetToken.create_for_user(
            user.id,
            current_app.config.get("PASSWORD_RESET_TOKEN_TTL_MINUTES", 30),
        )
        try:
            EmailSender.send_password_reset_email(email, reset_token)
        except Exception:
            current_app.logger.exception("Failed to send password reset email for user %s", user.id)

    return {"message": "Falls ein Konto zu dieser E-Mail-Adresse existiert, wurde ein Reset-Link versendet."}


@login_blueprint.route('/api/password-reset/confirm', methods=['POST'])
def confirm_password_reset():
    payload, error = parse_json_body(
        request.get_json(silent=True),
        required_fields=["token", "password"],
        missing_message="Token und neues Passwort sind erforderlich.",
    )
    if error:
        return error

    if not PasswordResetToken.consume(payload.get("token"), hash_user_password(payload.get("password"))):
        return error_response("Der Reset-Link ist ungueltig oder abgelaufen.", 400)

    return {"message": "Passwort wurde aktualisiert."}


@login_blueprint.route('/api/logout')
def logout():
    logout_user()
    return {"message": "Logout successful"}
