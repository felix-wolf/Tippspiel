from typing import Iterable

from flask_login import current_user

from src.blueprints.api_response import error_response
from src.models.event import Event
from src.models.game import Game


def _is_missing(value) -> bool:
    return value is None or (isinstance(value, str) and value.strip() == "")


def parse_json_body(
    payload,
    required_fields: Iterable[str] | None = None,
    missing_message: str = "Erforderliche Angaben fehlen.",
):
    if payload is None:
        return None, error_response("Ungültige oder fehlende JSON-Daten.", 400)
    if required_fields:
        missing = [field for field in required_fields if _is_missing(payload.get(field))]
        if missing:
            return None, error_response(missing_message, 400)
    return payload, None


def require_query_arg(
    value,
    missing_message: str,
):
    if _is_missing(value):
        return None, error_response(missing_message, 400)
    return value, None


def get_game_or_error(
    game_id,
    not_found_message: str = "Das Tippspiel wurde nicht gefunden.",
):
    game = Game.get_by_id(game_id)
    if not game:
        return None, error_response(not_found_message, 404)
    return game, None


def get_event_or_error(
    event_id,
    not_found_message: str = "Das Event wurde nicht gefunden.",
):
    event = Event.get_by_id(event_id)
    if not event:
        return None, error_response(not_found_message, 404)
    return event, None


def require_game_owner(
    game,
    forbidden_message: str = "Du bist für diese Aktion nicht berechtigt.",
):
    if game.creator.id != current_user.get_id():
        return error_response(forbidden_message, 403)
    return None


def require_game_member(
    game,
    forbidden_message: str = "Du bist für diese Aktion nicht berechtigt.",
):
    if current_user.get_id() not in [player.id for player in game.players]:
        return error_response(forbidden_message, 403)
    return None
