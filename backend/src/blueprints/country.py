from flask import Blueprint
from src.models.country import Country

from flask_login import *

country_blueprint = Blueprint('country', __name__)

@country_blueprint.route('/api/countries', methods=["GET"])
@login_required
def get_countries():
    return [country.to_dict() for country in Country.get_all()]