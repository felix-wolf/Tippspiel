from src.models.discipline import Discipline
from src.models.game import Game


def import_events_from_url(game: Game, url: str):
    if not url:
        return None, "Die Event-URL fehlt.", 400

    discipline = Discipline.get_by_id(game.discipline.id)
    if not discipline:
        return None, "Die Events konnten nicht importiert werden.", 500
    if not discipline.validate_events_url(url):
        return None, "Die Event-URL ist für diese Disziplin ungültig.", 400

    events, error = discipline.process_events_url(url, game_id=game.id)
    if error or not events:
        return None, error or "Die Events konnten nicht importiert werden.", 500
    return events, None, None
