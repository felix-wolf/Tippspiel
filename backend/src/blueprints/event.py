from flask import Blueprint, request
from src.models.event import Event
from src.models.event_type import EventType
import json
from datetime import datetime

from flask_login import *

event_blueprint = Blueprint('event', __name__)

@event_blueprint.route("/api/event", methods=["GET", "POST", "PUT"])
@login_required
def handle_event_request():
    """
    Requests events from the database. Request can be GET for fetch, PUT for update and POST for create.
    Events are sorted by their time.

    GET
    :url_param game_id - str:   OPTIONAL parameter of the game events belong to.
                                Specify to get all events for single game
    :url_param event_id - str:  OPTIONAL id of single event to fetch.
                                Specify to get only single event
    :url_param page - int:  OPTIONAL page number to fetch. Single Page holds 5 events.
                            Specify to get only subset of events.

    :return:
    """
    if request.method == "GET":
        game_id = request.args.get("game_id")
        event_id = request.args.get("event_id")
        page_num = request.args.get("page", type=int)
        past = request.args.get("past") == "true"
        full_object = request.args.get("full_object") == "true"
        if game_id:
            return [event.to_dict() for event in Event.get_all_by_game_id(game_id, full_object, page_num, past)]
        if event_id:
            return Event.get_by_id(event_id, full_object).to_dict()
        else:
            return "No game_id specified", 404
    elif request.method == "POST":
        # posting a list of events
        events = request.get_json().get("events")
        if events is not None:
            parsed_events = []
            for event_string in events:
                e_dict = json.loads(event_string)
                event_type = EventType.from_dict(e_dict['event_type'])
                event = Event.from_dict(e_dict, event_type)
                parsed_events.append(event)
            success = Event.save_events(parsed_events)
            if success:
                return [e.to_dict() for e in parsed_events]
            else:
                return "Fehler beim speichern der Events", 500
        # posting a single event
        name = request.get_json().get("name")
        game_id = request.get_json().get("game_id")
        event_type = request.get_json().get("type")
        dt = request.get_json().get("datetime")
        allow_partial_points = bool(request.get_json().get("allow_partial_points"))
        num_bets = request.get_json().get("num_bets")
        points_correct_bet = request.get_json().get("points_correct_bet")
        if not name or not game_id or not event_type or not dt or not num_bets or not points_correct_bet or allow_partial_points is None:
            return "Required params not spefified", 500
        dt = datetime.strptime(dt, "%d.%m.%Y, %H:%M:%S")
        success, event_id, event = Event.create(
            name=name, game_id=game_id, event_type_id=event_type, dt=dt, 
            num_bets=num_bets, points_correct_bet=points_correct_bet, allow_partial_points=allow_partial_points
        )
        if success:
            return event.to_dict()
        else:
            return "Fehler...", 500
    elif request.method == "PUT":
        name = request.get_json().get("name")
        game_id = request.get_json().get("game_id")
        event_type = request.get_json().get("type")
        dt = request.get_json().get("datetime")
        event_id = request.get_json().get("event_id")
        num_bets = request.get_json().get("num_bets")
        points_correct_bet = request.get_json().get("points_correct_bet")
        allow_partial_points = bool(request.get_json().get("allow_partial_points"))
        if not name or not game_id or not event_type or not dt or not num_bets or not points_correct_bet or allow_partial_points is None:
            return "Required params not spefified", 500
        dt = datetime.strptime(dt, "%d.%m.%Y, %H:%M:%S")
        success, event = Event.get_by_id(event_id).update(name=name, event_type_id=event_type, dt=dt, num_bets=num_bets, points_correct_bet=points_correct_bet, allow_partial_points=allow_partial_points)
        if success:
            return event.to_dict()
        else:
            return "Fehler...", 500


@event_blueprint.route("/api/event/delete", methods=["POST"])
@login_required
def delete_event():
    if request.method == "POST":
        event_id = request.get_json().get("event_id", None)
        event = Event.get_by_id(event_id)
        if not event:
            return "Event konnte nicht gefunden werden", 404
        success = event.delete()
        if success:
            return {"deleted_id": event_id}
        else:
            return "Fehler beim Löschen des Events", 500


@event_blueprint.route("/api/event/save_bets", methods=["POST"])
@login_required
def save_bets():
    if request.method == "POST":
        event_id = request.get_json().get("event_id", None)
        user_id = request.get_json().get("user_id", None)
        predictions = request.get_json().get("predictions", None)
        if not event_id or not predictions:
            return "Missing parameters", 400
        event = Event.get_by_id(event_id)
        if not event:
            return "Fehler...", 500
        success, event_id = event.save_bet(user_id, predictions)
        if success:
            return Event.get_by_id(event_id).to_dict()
        else:
            return "Fehler...", 500