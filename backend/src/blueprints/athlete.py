from flask import Blueprint

from flask_login import *
from src.models.athlete import Athlete

athlete_blueprint = Blueprint('athlete', __name__)

@athlete_blueprint.route('/api/athletes', methods=["GET"])
@login_required
def get_athletes():
    return [a.to_dict() for a in Athlete.get_all()]

