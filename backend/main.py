import hashlib
from flask import Flask
from flask_login import *
from src.models.user import User
import sys
from src.blueprints.athlete import athlete_blueprint
from src.blueprints.country import country_blueprint
from src.blueprints.discipline import discipline_blueprint
from src.blueprints.event import event_blueprint
from src.blueprints.game import game_blueprint
from src.blueprints.login import login_blueprint
from src.blueprints.result import result_blueprint
from src.blueprints.score import score_blueprint
from src.blueprints.status import status_blueprint
from src.blueprints.user import user_blueprint

login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    return User.get_by_id(user_id)


def hash_password(pw, salt):
    return hashlib.sha256("".join([pw, salt]).encode('utf-8')).hexdigest()


def create_app(env):
    config_file = f'config_{env}.py'
    app = Flask(__name__)
    try:
        app.config.from_pyfile(config_file)
    except FileNotFoundError:
        print("config file not found.")
        sys.exit()
    app.secret_key = app.config["SECRET_KEY"]
    login_manager.init_app(app)
    app.register_blueprint(athlete_blueprint)
    app.register_blueprint(country_blueprint)
    app.register_blueprint(discipline_blueprint)
    app.register_blueprint(event_blueprint)
    app.register_blueprint(game_blueprint)
    app.register_blueprint(login_blueprint)
    app.register_blueprint(result_blueprint)
    app.register_blueprint(score_blueprint)
    app.register_blueprint(status_blueprint)
    app.register_blueprint(user_blueprint)
    return app


if __name__ == '__main__':
    create_app(env="dev").run(debug=True)