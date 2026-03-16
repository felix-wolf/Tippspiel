from datetime import datetime, timedelta
import logging

from src.blueprints.service_result import service_error, service_ok
from src.database import db_manager
from src.models.discipline import Discipline
from src.models.event import Event
from src.models.game import Game
from src.models.notification_helper import NotificationHelper
from src.models.result import Result
from src.services.disciplines import get_discipline_services
from src.services.disciplines.base import OfficialResultsNotReady
from src.time_utils import berlin_now, ensure_berlin_time

logger = logging.getLogger(__name__)


def load_results(event: Event, url: str = None, results_json: list = None):
    discipline = Discipline.get_by_id(event.event_type.discipline_id)
    if not discipline:
        return service_error("Die Ergebnisse konnten nicht verarbeitet werden.", 500)

    if event.source_provider == "ibu" and event.source_race_id:
        services = get_discipline_services(discipline.id)
        results, error = services.result_processor.process_official_results(discipline, event)
        if error:
            if isinstance(error, OfficialResultsNotReady):
                return service_error(error.message, 409)
            return service_error(error, 500)
        return service_ok(results)

    if url:
        return service_error("Ergebnis-URLs werden nicht mehr unterstützt.", 410)

    if not results_json:
        return service_error("Es wurden keine Ergebnisse übermittelt.", 400)

    try:
        results = [Result(event.id, entry["place"], entry["id"]) for entry in results_json]
    except (KeyError, TypeError):
        return service_error("Die Ergebnisse konnten nicht verarbeitet werden.", 400)
    return service_ok(results)


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
            status=result.status,
        )
        for result in results
    ]


def _get_target_events(event: Event, get_full_objects: bool = True):
    target_events = Event.get_all_by_shared_event_id(
        event.shared_event_id,
        get_full_objects=get_full_objects,
    )
    if target_events:
        return target_events
    target_event = Event.get_by_id(event.id, get_full_objects)
    return [target_event] if target_event else []


def _serialize_target_scope(event: Event, target_events: list[Event]):
    return {
        "scope": "shared_event" if len(target_events) > 1 else "event",
        "target_event_id": event.id,
        "shared_event_id": event.shared_event_id,
        "affected_events": [
            {
                "event_id": target_event.id,
                "event_name": target_event.name,
                "game_id": target_event.game_id,
                "has_results": len(target_event.results) > 0,
            }
            for target_event in target_events
        ],
    }


def _ensure_official_refreshable(event: Event):
    if event.source_provider != "ibu" or not event.source_race_id:
        return "Dieses Event unterstützt keine offizielle Ergebnisaktualisierung."
    return None


def _results_equal(first: Result | None, second: Result | None):
    if first is None and second is None:
        return True
    if first is None or second is None:
        return False
    return first.to_dict() == second.to_dict()


def _build_result_diff(current_results: list[Result], refreshed_results: list[Result]):
    current_by_place = {result.place: result for result in current_results}
    refreshed_by_place = {result.place: result for result in refreshed_results}
    changes = []
    for place in sorted(set(current_by_place.keys()) | set(refreshed_by_place.keys())):
        before = current_by_place.get(place)
        after = refreshed_by_place.get(place)
        if _results_equal(before, after):
            continue
        changes.append(
            {
                "place": place,
                "before": before.to_dict() if before else None,
                "after": after.to_dict() if after else None,
            }
        )
    return changes


def preview_official_result_refresh(event: Event):
    refresh_error = _ensure_official_refreshable(event)
    if refresh_error:
        return service_error(refresh_error, 400)

    target_events = _get_target_events(event, get_full_objects=True)
    if not target_events:
        return service_error("Das Event wurde nicht gefunden.", 404)

    representative_event = target_events[0]
    refreshed_results_result = load_results(event=representative_event)
    if refreshed_results_result.is_error or refreshed_results_result.payload is None:
        return refreshed_results_result if refreshed_results_result.is_error else service_error(
            "Die Ergebnisse konnten nicht verarbeitet werden.",
            500,
        )

    current_results = Event.get_by_id(event.id, get_full_object=True).results
    changes = _build_result_diff(current_results, refreshed_results_result.payload)
    payload = {
        **_serialize_target_scope(event, target_events),
        "source_provider": representative_event.source_provider,
        "source_race_id": representative_event.source_race_id,
        "has_changes": len(changes) > 0,
        "changes": changes,
        "current_results": [result.to_dict() for result in current_results],
        "fetched_results": [result.to_dict() for result in refreshed_results_result.payload],
    }
    return service_ok(payload)


def apply_official_result_refresh(event: Event, resend_notifications: bool = False):
    refresh_error = _ensure_official_refreshable(event)
    if refresh_error:
        return service_error(refresh_error, 400)

    target_events = _get_target_events(event, get_full_objects=True)
    if not target_events:
        return service_error("Das Event wurde nicht gefunden.", 404)

    representative_event = target_events[0]
    shared_results_result = load_results(event=representative_event)
    if shared_results_result.is_error or shared_results_result.payload is None:
        return shared_results_result if shared_results_result.is_error else service_error(
            "Die Ergebnisse konnten nicht verarbeitet werden.",
            500,
        )

    processed_events = []
    for target_event in target_events:
        event_results = clone_results_for_event(target_event, shared_results_result.payload)
        success, error = target_event.process_results(event_results)
        if not success:
            return service_error(error, 500)
        if resend_notifications:
            game = Game.get_by_id(target_event.game_id)
            if game:
                notify_result_users(game, target_event)
        processed_events.append(
            {
                "event_id": target_event.id,
                "event_name": target_event.name,
                "game_id": target_event.game_id,
            }
        )

    payload = {
        **_serialize_target_scope(event, target_events),
        "status": "applied",
        "processed_count": len(processed_events),
        "processed_events": processed_events,
        "resend_notifications": resend_notifications,
    }
    return service_ok(payload)


def _clear_results_for_event(event: Event):
    conn = None
    try:
        conn = db_manager.start_transaction()
        Result.delete_by_event_id(event.id, commit=False, conn=conn)
        conn.execute(
            f"UPDATE {db_manager.TABLE_BETS} SET score = NULL WHERE event_id = ?",
            [event.id],
        )
        conn.execute(
            f"""
            UPDATE {db_manager.TABLE_PREDICTIONS}
            SET actual_place = NULL, actual_status = NULL, score = 0
            WHERE bet_id IN (
                SELECT id FROM {db_manager.TABLE_BETS} WHERE event_id = ?
            )
            """,
            [event.id],
        )
        db_manager.commit_transaction(conn)
        return True, None
    except Exception as exc:
        if conn:
            db_manager.rollback_transaction(conn)
        return False, str(exc)
    finally:
        if conn:
            conn.close()


def clear_event_results(event: Event):
    target_events = _get_target_events(event, get_full_objects=True)
    if not target_events:
        return service_error("Das Event wurde nicht gefunden.", 404)

    cleared_events = []
    for target_event in target_events:
        success, error = _clear_results_for_event(target_event)
        if not success:
            return service_error(error, 500)
        cleared_events.append(
            {
                "event_id": target_event.id,
                "event_name": target_event.name,
                "game_id": target_event.game_id,
            }
        )

    payload = {
        **_serialize_target_scope(event, target_events),
        "status": "cleared",
        "cleared_count": len(cleared_events),
        "cleared_events": cleared_events,
    }
    return service_ok(payload)


def force_rescore_event(event: Event):
    target_events = _get_target_events(event, get_full_objects=True)
    if not target_events:
        return service_error("Das Event wurde nicht gefunden.", 404)

    rescored_events = []
    for target_event in target_events:
        if not target_event.results:
            return service_error("Es sind keine Ergebnisse vorhanden, die neu bewertet werden können.", 400)
        success, error = target_event.process_results(
            clone_results_for_event(target_event, target_event.results)
        )
        if not success:
            return service_error(error, 500)
        rescored_events.append(
            {
                "event_id": target_event.id,
                "event_name": target_event.name,
                "game_id": target_event.game_id,
            }
        )

    payload = {
        **_serialize_target_scope(event, target_events),
        "status": "rescored",
        "rescored_count": len(rescored_events),
        "rescored_events": rescored_events,
    }
    return service_ok(payload)


def process_event_results(event: Event, game: Game, url: str = None, results_json: list = None):
    results_result = load_results(
        event=event,
        url=url,
        results_json=results_json,
    )
    if results_result.is_error:
        return results_result
    if not results_result.payload:
        return service_error("Die Ergebnisse konnten nicht verarbeitet werden.", 500)

    success, error = event.process_results(results_result.payload)
    if not success:
        return service_error(error, 500)

    notify_result_users(game, event)
    updated_event = Event.get_by_id(event.id)
    if not updated_event:
        return service_error("Das Event wurde nicht gefunden.", 404)
    return service_ok(updated_event.to_dict())


def check_recent_results(now=None):
    current_time = ensure_berlin_time(now) if now else berlin_now()
    processed_events = []
    deferred_events = []
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
        shared_results_result = load_results(
            event=representative_event,
            url=representative_event.url,
        )
        if shared_results_result.is_error or not shared_results_result.payload:
            if shared_results_result.status_code == 409:
                for event in events:
                    deferred_events.append(
                        {
                            "event_id": event.id,
                            "event_name": event.name,
                            "game_id": event.game_id,
                            "status_code": 409,
                            "reason": shared_results_result.error_message
                            or "Die offiziellen Ergebnisse sind noch nicht verfuegbar.",
                        }
                    )
                continue
            for event in events:
                logger.warning(
                    "Automatic result import failed for event %s (%s): %s",
                    event.id,
                    event.name,
                    shared_results_result.error_message or "Die Ergebnisse konnten nicht verarbeitet werden.",
                )
                failed_events.append(
                    {
                        "event_id": event.id,
                        "event_name": event.name,
                        "game_id": event.game_id,
                        "status_code": shared_results_result.status_code or 500,
                        "error": shared_results_result.error_message or "Die Ergebnisse konnten nicht verarbeitet werden.",
                    }
                )
            continue

        for event in Event.get_all_by_shared_event_id(shared_event_id, get_full_objects=True):
            if event.id not in due_event_ids:
                continue
            game = games_by_id.get(event.game_id)
            if game is None:
                continue
            event_results = clone_results_for_event(event, shared_results_result.payload)
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

    return service_ok({
        "status": "checked",
        "processed_count": len(processed_events),
        "deferred_count": len(deferred_events),
        "failed_count": len(failed_events),
        "processed_events": processed_events,
        "deferred_events": deferred_events,
        "failed_events": failed_events,
    })
