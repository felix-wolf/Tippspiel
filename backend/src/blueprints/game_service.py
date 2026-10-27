from flask import current_app

from src.database import db_manager
from src.models.admin_operation import AdminOperation
from src.models.discipline import Discipline
from src.models.game import Game
from src.blueprints.service_result import service_error, service_ok
from src.services.disciplines import get_discipline_services


def import_official_events(game: Game):
    discipline = Discipline.get_by_id(game.discipline.id)
    if not discipline:
        return service_error("Die Events konnten nicht importiert werden.", 500)
    services = get_discipline_services(discipline.id)
    events, error = services.event_importer.fetch_importable_events(discipline, game_id=game.id)
    if error:
        return service_error(error, 500)
    if events is None:
        return service_error("Die Events konnten nicht importiert werden.", 500)
    return service_ok([event.to_dict() for event in events])


def delete_game_with_audit(game, actor):
    conn = None
    try:
        conn = db_manager.start_transaction()
        deleted = conn.execute(
            f"UPDATE {db_manager.TABLE_GAMES} SET visible = 0 WHERE id = ? AND visible = 1",
            [game.id],
        )
        if deleted.rowcount != 1:
            db_manager.rollback_transaction(conn)
            return service_error("Das Tippspiel wurde nicht gefunden.", 404)
        recorded = AdminOperation.record(
            actor=actor,
            action_type="game_delete",
            status="succeeded",
            summary=f'Tippspiel „{game.name}“ gelöscht.',
            target_type="game",
            target_id=game.id,
            details={
                "game_name": game.name,
                "owner_id": game.creator.id,
                "actor_is_owner": actor.actor_user_id == game.creator.id,
            },
            conn=conn,
        )
        if not recorded:
            raise RuntimeError("Could not record game deletion")
        db_manager.commit_transaction(conn)
    except Exception:
        if conn is not None:
            db_manager.rollback_transaction(conn)
        current_app.logger.exception("Game deletion failed")
        return service_error("Das Tippspiel konnte nicht gelöscht werden.", 500)
    finally:
        if conn is not None:
            conn.close()
    return service_ok({"deleted_id": game.id})
