from flask import Blueprint, request
from src.models.discipline import Discipline
from src.models.event import Event
from src.models.result import Result
from flask_login import *

result_blueprint = Blueprint('result', __name__)

@result_blueprint.route("/api/results", methods=["POST"])
@login_required
def process_results():
    if request.method == "POST":
        event_id = request.get_json().get("event_id", None)
        event = Event.get_by_id(event_id)
        if not event:
            return "Event nicht gefunden", 400
        url = request.get_json().get("url", None)
        results_json = request.get_json().get("results", None)
        if url:
            # check if discipline allows url updates and if url matches result_url
            discipline = Discipline.get_by_id(event.event_type.discipline_id)
            if not discipline:
                return "Fehler...", 500
            if not discipline.validate_result_url(url):
                return "Disziplin erlaubt keine URL Ergebnisse / URL falsch", 400
            results, error = discipline.preprocess_results_for_discipline(url, event)
            if error:
                return error, 500
        else:
            results = [Result(event_id, j['place'], j['id']) for j in results_json]

        if not results:
            return "Missing parameters", 400

        success, error = event.process_results(results)
        if success:
            return Event.get_by_id(event_id).to_dict()
        else:
            return error, 500
