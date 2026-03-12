from src.models.discipline import Discipline
from src.models.game import Game
from src.services.disciplines import get_discipline_services


def import_official_events(game: Game):
    discipline = Discipline.get_by_id(game.discipline.id)
    if not discipline:
        return None, "Die Events konnten nicht importiert werden.", 500
    services = get_discipline_services(discipline.id)
    events, error = services.event_importer.fetch_importable_events(discipline, game_id=game.id)
    if error:
        return None, error, 500
    if events is None:
        return None, "Die Events konnten nicht importiert werden.", 500
    return events, None, None
