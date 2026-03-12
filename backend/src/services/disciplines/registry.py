from src.services.disciplines.base import (
    DisciplineServices,
    PassthroughAthleteResolver,
    UnsupportedEventImporter,
    UnsupportedResultProcessor,
)
from src.services.disciplines.biathlon import (
    BiathlonAthleteResolver,
    BiathlonEventImporter,
    BiathlonResultProcessor,
)


_unsupported_services = DisciplineServices(
    event_importer=UnsupportedEventImporter(),
    result_processor=UnsupportedResultProcessor(),
    athlete_resolver=PassthroughAthleteResolver(),
)

_biathlon_athlete_resolver = BiathlonAthleteResolver()
_services_by_discipline_id = {
    "biathlon": DisciplineServices(
        event_importer=BiathlonEventImporter(),
        result_processor=BiathlonResultProcessor(_biathlon_athlete_resolver),
        athlete_resolver=_biathlon_athlete_resolver,
    ),
    "skispringen": _unsupported_services,
}


def get_discipline_services(discipline_id: str) -> DisciplineServices:
    return _services_by_discipline_id.get(discipline_id, _unsupported_services)
