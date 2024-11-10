from flask import Blueprint
from src.models.discipline import Discipline

from flask_login import *

discipline_blueprint = Blueprint('discipline', __name__)

@discipline_blueprint.route('/api/disciplines', methods=["GET"])
@login_required
def get_disciplines():
    return [discipline.to_dict() for discipline in Discipline.get_all()]