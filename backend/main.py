import hashlib
from datetime import datetime

from flask import Flask, request
from flask_login import *

from database import db_manager
from models.user import User
from models.athlete import Athlete
from models.country import Country

app = Flask(__name__)
app.secret_key = "1b98d3e890b6bd7213300e0a98e66856"
login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    print("Requesting user for id", user_id)
    return User.get_by_id(user_id)


@app.route('/api/status')
def get_time():
    return {'Time': datetime.now()}


@app.route('/api/login', methods=['GET', 'POST'])
def login():
    name = request.args.get("name")
    pw_hash = request.args.get("pw_hash")
    if not name or not pw_hash:
        return {"Error": "Name and/or pw_hash param not given"}, 400
    user_object = User.get_by_credentials(name, pw_hash)
    if not user_object:
        return {"Error": "User not found"}, 404
    login_user(user_object, remember=True)
    return {"Login": "Successful"}


@app.route('/api/logout')
def logout():
    logout_user()
    return {"Logout": "Successful"}


@app.route('/api/current_user')
def current_user():
    return current_user


@app.route('/api/register')
def register_user():
    name = request.args.get("name")
    pw_hash = request.args.get("pw_hash")
    success = User.create(name, pw_hash)
    if success:
        return "Success"
    else:
        return "Registering user went wrong", 400


@app.route('/api/athletes')
@login_required
def get_athletes():
    return [a.to_dict() for a in Athlete.get_all()]


@app.route('/api/countries')
@login_required
def get_countries():
    return [country.to_dict() for country in Country.get_all()]


if __name__ == '__main__':
    db_manager.start()
    print("db started")
    app.run(debug=True)
