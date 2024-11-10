from flask import Blueprint, request, current_app
from src.models.user import User
from flask_login import *
from src.utils import hash_password

login_blueprint = Blueprint('login', __name__)

@login_blueprint.route('/api/login', methods=['POST'])
def login():
    if request.method == "POST":
        name = request.get_json().get("name")
        pw = request.get_json().get("password")
        if not name or not pw:
            return "Name und/oder Passwort fehlt!", 400
        pw_hash = hash_password(pw, current_app.config["SALT"])
        user_object = User.get_by_credentials(name, pw_hash)
        if not user_object:
            return "Name oder Password falsch!", 404
        login_user(user_object, remember=True)
        return user_object.to_dict()


@login_blueprint.route('/api/register', methods=["POST"])
def register_user():
    if request.method == "POST":
        name = request.get_json().get("name")
        pw = request.get_json().get("password")
        pw_hash = hash_password(pw, current_app.config["SALT"])
        success, user_id = User.create(name, pw_hash)
        if success:
            return User.get_by_id(user_id).to_dict()
        else:
            return "Name schon vergeben!", 400


@login_blueprint.route('/api/logout')
def logout():
    logout_user()
    return {"message": "Logout successful"}