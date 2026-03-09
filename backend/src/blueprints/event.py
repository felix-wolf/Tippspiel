from flask import Blueprint, request
from src.models.event import Event
from src.models.game import Game
from src.models.event_type import EventType
import json
from datetime import datetime
from src.blueprints.api_response import error_response
from src.blueprints.route_helpers import (
    get_event_or_error,
    get_game_or_error,
    parse_json_body,
    require_game_member,
    require_game_owner,
)

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
            event, error = get_event_or_error(event_id)
            if error:
                return error
            return Event.get_by_id(event.id, full_object).to_dict()
        else:
            return error_response("Die Spiel-ID fehlt.", 400)
    elif request.method == "POST":
        payload, error = parse_json_body(request.get_json(silent=True))
        if error:
            return error
        # posting a list of events
        events = payload.get("events")
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
                return error_response("Die Events konnten nicht gespeichert werden.", 500)
        # posting a single event
        payload, error = parse_json_body(
            payload,
            required_fields=["name", "game_id", "type", "datetime", "num_bets", "points_correct_bet"],
        )
        if error:
            return error_response("Erforderliche Angaben fehlen.", 400)
        name = payload.get("name")
        game_id = payload.get("game_id")
        event_type = payload.get("type")
        dt = payload.get("datetime")
        allow_partial_points = bool(payload.get("allow_partial_points"))
        num_bets = payload.get("num_bets")
        points_correct_bet = payload.get("points_correct_bet")
        location = payload.get("location")
        game, error = get_game_or_error(game_id)
        if error:
            return error
        error = require_game_owner(game)
        if error:
            return error
        dt = datetime.strptime(dt, "%d.%m.%Y, %H:%M:%S")
        success, event_id, event = Event.create(
            name=name, game_id=game_id, event_type_id=event_type, dt=dt, 
            num_bets=num_bets, points_correct_bet=points_correct_bet,
            allow_partial_points=allow_partial_points, location=location
        )
        if success:
            return event.to_dict()
        else:
            return error_response("Das Event konnte nicht erstellt werden.", 500)
    elif request.method == "PUT":
        payload, error = parse_json_body(
            request.get_json(silent=True),
            required_fields=["event_id", "name", "game_id", "type", "datetime", "num_bets", "points_correct_bet"],
        )
        if error:
            return error_response("Erforderliche Angaben fehlen.", 400)
        name = payload.get("name")
        game_id = payload.get("game_id")
        event_type = payload.get("type")
        dt = payload.get("datetime")
        event_id = payload.get("event_id")
        num_bets = payload.get("num_bets")
        points_correct_bet = payload.get("points_correct_bet")
        allow_partial_points = bool(payload.get("allow_partial_points"))
        location = payload.get("location")
        game, error = get_game_or_error(game_id)
        if error:
            return error
        error = require_game_owner(game)
        if error:
            return error
        event, error = get_event_or_error(event_id)
        if error:
            return error
        dt = datetime.strptime(dt, "%d.%m.%Y, %H:%M:%S")
        success, event = event.update(
            name=name,
            event_type_id=event_type,
            dt=dt,
            num_bets=num_bets,
            points_correct_bet=points_correct_bet,
            allow_partial_points=allow_partial_points,
            location=location,
        )
        if success:
            return event.to_dict()
        else:
            return error_response("Das Event konnte nicht aktualisiert werden.", 500)


@event_blueprint.route("/api/event/delete", methods=["DELETE"])
@login_required
def delete_event():
    if request.method == "DELETE":
        payload, error = parse_json_body(
            request.get_json(silent=True),
            required_fields=["event_id"],
        )
        if error:
            return error
        event_id = payload.get("event_id")
        event, error = get_event_or_error(event_id)
        if error:
            return error
        game, error = get_game_or_error(event.game_id)
        if error:
            return error
        error = require_game_owner(game)
        if error:
            return error
        success = event.delete()
        if success:
            return {"deleted_id": event_id}
        else:
            return error_response("Das Event konnte nicht gelöscht werden.", 500)


@event_blueprint.route("/api/event/save_bets", methods=["POST"])
@login_required
def save_bets():
    if request.method == "POST":
        payload, error = parse_json_body(
            request.get_json(silent=True),
            required_fields=["event_id", "predictions"],
        )
        if error:
            return error
        event_id = payload.get("event_id")
        predictions = payload.get("predictions")
        event, error = get_event_or_error(event_id)
        if error:
            return error
        game, error = get_game_or_error(event.game_id)
        if error:
            return error
        target_user_id = current_user.get_id()
        requested_user_id = payload.get("user_id")
        if requested_user_id and requested_user_id != current_user.get_id():
            owner_error = require_game_owner(game)
            if owner_error is None:
                if requested_user_id not in [player.id for player in game.players]:
                    return error_response("Der Nutzer gehoert nicht zu diesem Tippspiel.", 400)
                if not event.creator_can_add_missing_bet(requested_user_id):
                    return error_response(
                        "Fehlende Tipps koennen nur nach Rennstart und nur einmal nachgetragen werden.",
                        400,
                    )
                target_user_id = requested_user_id
            else:
                # Non-owners cannot spoof another player's user id.
                target_user_id = current_user.get_id()

        # Only members of the game can place bets for themselves
        error = require_game_member(game)
        if error:
            return error
        success, event_id = event.save_bet(target_user_id, predictions)
        if not success:
            return error_response("Die Wette konnte nicht gespeichert werden.", 400)
        if success:
            return Event.get_by_id(event_id).to_dict()
