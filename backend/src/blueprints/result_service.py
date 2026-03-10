from datetime import datetime, timedelta

from src.models.discipline import Discipline
from src.models.event import Event
from src.models.game import Game
from src.models.notification_helper import NotificationHelper
from src.models.result import Result
from src.time_utils import berlin_now, ensure_berlin_time


def load_results(event: Event, url: str = None, results_json: list = None):
    discipline = Discipline.get_by_id(event.event_type.discipline_id)
    if not discipline:
        return None, "Die Ergebnisse konnten nicht verarbeitet werden.", 500

    if event.source_provider == "ibu" and event.source_race_id:
        results, error = discipline.process_official_results(event)
        if error:
            return None, error, 500
        return results, None, None

    if url:
        if not discipline.validate_result_url(url):
            return None, "Die Ergebnis-URL ist für diese Disziplin ungültig.", 400
        results, error = discipline.process_results_url(url, event)
        if error:
            return None, error, 500
        return results, None, None

    if not results_json:
        return None, "Es wurden keine Ergebnisse übermittelt.", 400

    try:
        results = [Result(event.id, entry["place"], entry["id"]) for entry in results_json]
    except (KeyError, TypeError):
        return None, "Die Ergebnisse konnten nicht verarbeitet werden.", 400
    return results, None, None


def notify_result_users(game: Game, event: Event):
    tokens = NotificationHelper.get_tokens_for_users(
        [player.id for player in game.players],
        check_results=1,
    )
    for token_data in tokens:
        NotificationHelper.send_push_notification(
            token_data["device_token"],
            event.name,
            "Neue Ergebnisse verfügbar!",
        )


def process_event_results(event: Event, game: Game, url: str = None, results_json: list = None):
    results, error_message, status_code = load_results(
        event=event,
        url=url,
        results_json=results_json,
    )
    if error_message or not results:
        return None, error_message or "Die Ergebnisse konnten nicht verarbeitet werden.", status_code or 500

    success, error = event.process_results(results)
    if not success:
        return None, error, 500

    notify_result_users(game, event)
    updated_event = Event.get_by_id(event.id)
    if not updated_event:
        return None, "Das Event wurde nicht gefunden.", 404
    return updated_event.to_dict(), None, None


def check_recent_results(now=None):
    current_time = ensure_berlin_time(now) if now else berlin_now()

    for game in Game.get_all():
        events = Event.get_all_by_game_id(game.id, get_full_objects=False, past=True)
        recent_events = [
            event
            for event in events
            if timedelta(minutes=4 * 60)
            > (current_time - ensure_berlin_time(event.dt))
            > timedelta(minutes=60)
            and not event.results
            and (
                (event.source_provider == "ibu" and event.source_race_id)
                or event.url is not None
            )
        ]
        if not recent_events:
            continue

        for event in recent_events:
            payload, error_message, status_code = process_event_results(
                event=event,
                game=game,
                url=event.url,
            )
            if error_message:
                return None, error_message, status_code or 500
            return payload, None, None

    return {"status": "checked"}, None, None
