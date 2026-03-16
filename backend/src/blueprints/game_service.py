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
