from flask import Blueprint, request, current_app
from src.models.user import User
from flask_login import *
from src.utils import hash_user_password
from src.blueprints.api_response import error_response

login_blueprint = Blueprint('login', __name__)

@login_blueprint.route('/api/login', methods=['POST'])
def login():
    if request.method == "POST":
        name = request.get_json().get("name")
        pw = request.get_json().get("password")
        if not name or not pw:
            return error_response("Benutzername und Passwort sind erforderlich.", 400)
        user_object = User.authenticate(name, pw, current_app.config["SALT"])
        if not user_object:
            return error_response("Benutzername oder Passwort ist falsch.", 401)
        login_user(user_object, remember=True)
        return user_object.to_dict()


@login_blueprint.route('/api/register', methods=["POST"])
def register_user():
    if request.method == "POST":
        name = request.get_json().get("name")
        pw = request.get_json().get("password")
        if not name or not pw:
            return error_response("Benutzername und Passwort sind erforderlich.", 400)
        pw_hash = hash_user_password(pw)
        success, user_id = User.create(name, pw_hash)
        if success:
            return User.get_by_id(user_id).to_dict()
        else:
            return error_response("Dieser Benutzername ist bereits vergeben.", 409)


@login_blueprint.route('/api/logout')
def logout():
    logout_user()
    return {"message": "Logout successful"}
