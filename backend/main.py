import hashlib
import logging
from flask import Flask
from flask_login import *
from src.models.user import User
import sys
from config import load_config
from src.database.migration_runner import MigrationError, assert_database_current
from src.blueprints.athlete import athlete_blueprint
from src.blueprints.admin import admin_blueprint
from src.blueprints.country import country_blueprint
from src.blueprints.discipline import discipline_blueprint
from src.blueprints.event import event_blueprint
from src.blueprints.game import game_blueprint
from src.blueprints.login import login_blueprint
from src.blueprints.result import result_blueprint
from src.blueprints.score import score_blueprint
from src.blueprints.status import status_blueprint
from src.blueprints.user import user_blueprint
from src.blueprints.notification import notification_blueprint
import firebase_admin
from firebase_admin import credentials

login_manager = LoginManager()


@login_manager.user_loader
def load_user(user_id):
    return User.get_by_id(user_id)


def hash_password(pw, salt):
    return hashlib.sha256("".join([pw, salt]).encode('utf-8')).hexdigest()


def create_app(env, check_migrations=True):
    print("Starting app in", env, "environment")
    app = Flask(__name__)
    try:
        app.config.update(load_config(env))
    except RuntimeError as err:
        print(err)
        sys.exit()
    if check_migrations:
        try:
            assert_database_current(app.config["DB_PATH"])
        except MigrationError as err:
            print(err)
            raise
    app.secret_key = app.config["SECRET_KEY"]
    app.logger.setLevel(logging.INFO)
    # Initialize firebase once; skip in tests if credentials are unavailable.
    if not firebase_admin._apps:
        try:
            cred_path = app.config.get("FIREBASE_CREDENTIALS_PATH")
            if not cred_path:
                if app.config.get("TESTING"):
                    cred_path = None
                else:
                    raise RuntimeError("Missing required environment variable: TIPPSPIEL_FIREBASE_CREDENTIALS_PATH")
            if cred_path is not None:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
        except Exception as err:
            if not app.config.get("TESTING"):
                raise err
    login_manager.init_app(app)
    with app.app_context():
        if User.configured_admin_usernames():
            try:
                User.sync_admins(User.configured_admin_usernames())
            except Exception:
                # Tests can construct the app before the temp schema exists.
                pass
    app.register_blueprint(athlete_blueprint)
    app.register_blueprint(admin_blueprint)
    app.register_blueprint(country_blueprint)
    app.register_blueprint(discipline_blueprint)
    app.register_blueprint(event_blueprint)
    app.register_blueprint(game_blueprint)
    app.register_blueprint(login_blueprint)
    app.register_blueprint(result_blueprint)
    app.register_blueprint(score_blueprint)
    app.register_blueprint(status_blueprint)
    app.register_blueprint(user_blueprint)
    app.register_blueprint(notification_blueprint)
    return app


if __name__ == '__main__':
    create_app(env="dev").run(debug=True)
