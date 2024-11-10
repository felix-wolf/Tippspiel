from flask import Blueprint
from datetime import datetime


from flask_login import *

status_blueprint = Blueprint('status', __name__)

@status_blueprint.route('/api/status')
def get_time():
    return {'Time': datetime.now()}