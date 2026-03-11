from datetime import datetime, timedelta
import logging

from src.models.discipline import Discipline
from src.models.event import Event
from src.models.game import Game
from src.models.notification_helper import NotificationHelper
from src.models.result import Result
from src.time_utils import berlin_now, ensure_berlin_time

logger = logging.getLogger(__name__)


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
        return None, "Ergebnis-URLs werden nicht mehr unterstützt.", 410

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


def clone_results_for_event(event: Event, results: list[Result]):
    return [
        Result(
            event_id=event.id,
            place=result.place,
            object_id=result.object_id,
            object_name=result.object_name,
            time=result.time,
            behind=result.behind,
            shooting=result.shooting,
            shooting_time=result.shooting_time,
        )
        for result in results
    ]


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
    processed_events = []
    failed_events = []
    due_events_by_shared_id = {}
    games_by_id = {game.id: game for game in Game.get_all()}

    for game in games_by_id.values():
        events = Event.get_all_by_game_id(game.id, get_full_objects=False, past=True)
        for event in events:
            if not (
                timedelta(minutes=4 * 60)
                > (current_time - ensure_berlin_time(event.dt))
                > timedelta(minutes=60)
                and not event.results
                and event.source_provider == "ibu"
                and event.source_race_id
            ):
                continue
            due_events_by_shared_id.setdefault(event.shared_event_id, []).append(event)

    for shared_event_id, events in due_events_by_shared_id.items():
        representative_event = events[0]
        due_event_ids = {event.id for event in events}
        shared_results, error_message, status_code = load_results(
            event=representative_event,
            url=representative_event.url,
        )
        if error_message or not shared_results:
            for event in events:
                logger.warning(
                    "Automatic result import failed for event %s (%s): %s",
                    event.id,
                    event.name,
                    error_message or "Die Ergebnisse konnten nicht verarbeitet werden.",
                )
                failed_events.append(
                    {
                        "event_id": event.id,
                        "event_name": event.name,
                        "game_id": event.game_id,
                        "status_code": status_code or 500,
                        "error": error_message or "Die Ergebnisse konnten nicht verarbeitet werden.",
                    }
                )
            continue

        for event in Event.get_all_by_shared_event_id(shared_event_id, get_full_objects=True):
            if event.id not in due_event_ids:
                continue
            game = games_by_id.get(event.game_id)
            if game is None:
                continue
            event_results = clone_results_for_event(event, shared_results)
            success, error = event.process_results(event_results)
            if not success:
                logger.warning(
                    "Automatic result import failed for event %s (%s): %s",
                    event.id,
                    event.name,
                    error,
                )
                failed_events.append(
                    {
                        "event_id": event.id,
                        "event_name": event.name,
                        "game_id": event.game_id,
                        "status_code": 500,
                        "error": error,
                    }
                )
                continue

            notify_result_users(game, event)
            processed_events.append(
                {
                    "event_id": event.id,
                    "event_name": event.name,
                    "game_id": event.game_id,
                }
            )

    return {
        "status": "checked",
        "processed_count": len(processed_events),
        "failed_count": len(failed_events),
        "processed_events": processed_events,
        "failed_events": failed_events,
    }, None, None
