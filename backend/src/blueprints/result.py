from flask import Blueprint, request
from src.models.discipline import Discipline
from src.models.notification_helper import NotificationHelper
from src.models.event import Event
from src.models.game import Game
from src.models.result import Result
from flask_login import *
from datetime import datetime, timedelta
import pytz

result_blueprint = Blueprint('result', __name__)

@result_blueprint.route("/api/results/check", methods=["GET"])
def check_results():
    now = datetime.now(pytz.timezone('CET'))
    games = Game.get_all()
    for game in games:
        events = Event.get_all_by_game_id(game.id, get_full_objects=False, past=True)
        # get all events that have no results and are older than 60 minutes but less than 4 hours
        events = [event for event in events if timedelta(minutes=4 * 60) > (now - pytz.timezone('CET').localize(event.dt)) > timedelta(minutes=60) and not len(event.results) > 0 and event.url is not None]
        if len(events) == 0:
            continue
        for event in events:
            results = get_results(event.url, None, event)
            if not results:
                return "Fehler beim Verarbeiten der Ergebnisse", 500

            success, error = event.process_results(results)
            if success:
                send_notification(game, event)
                return Event.get_by_id(event.id).to_dict()
            else:
                return error, 500
    return "checked", 200


def get_results(url: str, results_json: list, event: Event):
    if url:
        # check if discipline allows url updates and if url matches result_url
        discipline = Discipline.get_by_id(event.event_type.discipline_id)
        if not discipline:
            return "Fehler...", 500
        if not discipline.validate_result_url(url):
            return "Disziplin erlaubt keine URL Ergebnisse / URL falsch", 400
        results, error = discipline.process_results_url(url, event)
        if error:
            return None
    else:
        results = [Result(event.id, j['place'], j['id']) for j in results_json]
    return results


def process_url(event, url, game):
    # check if discipline allows url updates and if url matches result_url
    discipline = Discipline.get_by_id(event.event_type.discipline_id)
    if not discipline:
        return "Fehler...", 500
    if not discipline.validate_result_url(url):
        return "Disziplin erlaubt keine URL Ergebnisse / URL falsch", 400
    results, error = discipline.process_results_url(url, event)
    if error or not results:
        return error, 500

    success, error = event.process_results(results)
    if success:
        result = NotificationHelper.get_tokens_for_users([player.id for player in game.players], check_results=1)
        for res in result:
            NotificationHelper.send_push_notification(
                res['device_token'],
                event.name,
                "Neue Ergebnisse verfügbar!"
            )
        return Event.get_by_id(event.id).to_dict()
    else:
        return error, 500

def send_notification(game, event):
    result = NotificationHelper.get_tokens_for_users([player.id for player in game.players], check_results=1)
    for res in result:
        NotificationHelper.send_push_notification(
            res['device_token'],
            event.name,
            "Neue Ergebnisse verfügbar!"
        )

@result_blueprint.route("/api/results", methods=["POST"])
@login_required
def process_results():
    if request.method == "POST":
        event_id = request.get_json().get("event_id", None)
        event = Event.get_by_id(event_id)
        if not event:
            return "Event nicht gefunden", 400
        game = Game.get_by_id(event.game_id)
        if not game:
            return "Game zu Event nicht gefunden", 500
        # only game owner can submit results
        if game.creator.id != current_user.get_id():
            return "Not authorized", 403
        url = request.get_json().get("url", None)
        results_json = request.get_json().get("results", None)

        results = get_results(url, results_json, event)
        if not results:
            return "Fehler beim Verarbeiten der Ergebnisse", 500

        success, error = event.process_results(results)
        if success:
            send_notification(game, event)
            return Event.get_by_id(event_id).to_dict()
        else:
            return error, 500
