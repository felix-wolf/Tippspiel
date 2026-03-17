from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class OfficialResultsNotReady:
    message: str
    kind: str = "start_list"


class DisciplineEventImporter(Protocol):
    def fetch_importable_events(self, discipline, game_id: str, now=None):
        ...


class DisciplineResultProcessor(Protocol):
    def process_official_results(self, discipline, event):
        ...

    def get_start_list(self, discipline, event):
        ...


class DisciplineAthleteResolver(Protocol):
    def resolve_athletes(self, athletes):
        ...


@dataclass(frozen=True)
class DisciplineServices:
    event_importer: DisciplineEventImporter
    result_processor: DisciplineResultProcessor
    athlete_resolver: DisciplineAthleteResolver


class UnsupportedEventImporter:
    def fetch_importable_events(self, discipline, game_id: str, now=None):
        return [], "Disziplin nicht auswertbar"


class UnsupportedResultProcessor:
    def process_official_results(self, discipline, event):
        return [], "Disziplin nicht auswertbar"

    def get_start_list(self, discipline, event):
        return None, None, "Disziplin nicht auswertbar"


class PassthroughAthleteResolver:
    def resolve_athletes(self, athletes):
        return athletes
