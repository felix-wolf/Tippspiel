from __future__ import annotations

import logging

import requests
from flask import current_app, has_app_context

from src.athlete_duplicates import resolve_existing_athlete
from src.ibu_api import IbuApiClient, IbuApiError, race_is_importable
from src.models.athlete import Athlete
from src.models.country import Country
from src.models.event import Event
from src.models.result import Result
from src.services.disciplines.base import OfficialResultsNotReady


logger = logging.getLogger(__name__)


def _logger():
    if has_app_context():
        return current_app.logger
    return logger


def _reload_persisted_athlete(athlete: Athlete | None):
    if athlete is None:
        return None
    persisted_athlete = Athlete.get_by_id(athlete.id)
    if persisted_athlete is not None:
        return persisted_athlete
    if athlete.ibu_id:
        return Athlete.get_by_ibu_id(athlete.ibu_id)
    return None


class BiathlonAthleteResolver:
    def resolve_athletes(self, athletes: list[Athlete]):
        known_athletes = Athlete.get_all()
        inferred_gender = None

        for athlete in athletes:
            if athlete.ibu_id:
                athlete_from_db = Athlete.get_by_ibu_id(athlete.ibu_id)
                if athlete_from_db is not None and athlete_from_db.gender != "?":
                    inferred_gender = athlete_from_db.gender
                    break
            athlete_from_db, _ = resolve_existing_athlete(athlete, existing_athletes=known_athletes)
            if athlete_from_db is not None and athlete_from_db.gender != "?":
                inferred_gender = athlete_from_db.gender
                break

        resolved_athletes = []
        for athlete in athletes:
            if inferred_gender is not None and athlete.gender == "?":
                athlete.gender = inferred_gender

            athlete_from_db = Athlete.get_by_ibu_id(athlete.ibu_id) if athlete.ibu_id else None
            if athlete_from_db is not None:
                resolved_athletes.append(_reload_persisted_athlete(athlete_from_db) or athlete_from_db)
                continue

            athlete_from_db, _ = resolve_existing_athlete(athlete, existing_athletes=known_athletes)
            if athlete_from_db is not None:
                if athlete.ibu_id and athlete_from_db.ibu_id != athlete.ibu_id:
                    athlete_from_db.set_ibu_id(athlete.ibu_id)
                    athlete_from_db = Athlete.get_by_id(athlete_from_db.id) or athlete_from_db
                _logger().info(
                    "Resolved imported athlete '%s %s' (%s/%s) to existing athlete '%s %s' [%s].",
                    athlete.first_name,
                    athlete.last_name,
                    athlete.country_code,
                    athlete.discipline,
                    athlete_from_db.first_name,
                    athlete_from_db.last_name,
                    athlete_from_db.id,
                )
                resolved_athletes.append(_reload_persisted_athlete(athlete_from_db) or athlete_from_db)
                continue

            athlete.save_to_db()
            saved_athlete = _reload_persisted_athlete(athlete)
            if saved_athlete is None:
                raise RuntimeError(
                    f"Imported athlete '{athlete.first_name} {athlete.last_name}' [{athlete.id}] could not be reloaded after save."
                )
            _logger().info(
                "Created new athlete '%s %s' [%s] for %s/%s.",
                saved_athlete.first_name,
                saved_athlete.last_name,
                saved_athlete.id,
                saved_athlete.country_code,
                saved_athlete.discipline,
            )
            known_athletes.append(saved_athlete)
            resolved_athletes.append(saved_athlete)

        return resolved_athletes


class BiathlonEventImporter:
    RESULT_PAGE_PREFIX = "https://www.biathlonworld.com/results/"

    def fetch_importable_events(self, discipline, game_id: str, now=None):
        try:
            races = IbuApiClient().get_importable_races(now=now)
        except (IbuApiError, requests.RequestException):
            return [], "Die Events konnten nicht von der offiziellen IBU-Quelle geladen werden."

        events = []
        for race in races:
            if not race_is_importable(race, now=now):
                continue
            event_type = self._resolve_event_type_from_race(discipline.event_types, race)
            if event_type is None:
                continue
            event_name = f"{race.location} - {race.title}".strip(" -")
            events.append(
                Event(
                    name=event_name,
                    game_id=game_id,
                    event_type=event_type,
                    dt=race.starts_at,
                    allow_partial_points=True,
                    location=race.location,
                    race_format=race.race_format or race.title,
                    url=f"{self.RESULT_PAGE_PREFIX}{race.race_id}",
                    source_provider="ibu",
                    source_event_id=race.event_id,
                    source_race_id=race.race_id,
                    season_id=race.season_id,
                )
            )
        return events, None

    def _resolve_event_type_from_race(self, event_types, race):
        title = " ".join((race.title or "").lower().split())
        gender = (race.gender or "").lower()
        if "relay" in title:
            return next((event_type for event_type in event_types if event_type.name == "relay"), None)
        if gender in {"w", "women", "female", "ladies"} or "women" in title:
            return next((event_type for event_type in event_types if event_type.name == "women"), None)
        if gender in {"m", "men", "male"} or "men" in title:
            return next((event_type for event_type in event_types if event_type.name == "men"), None)
        return None


class BiathlonResultProcessor:
    NON_CLASSIFIED_PLACE = 9999

    def __init__(self, athlete_resolver: BiathlonAthleteResolver):
        self._athlete_resolver = athlete_resolver

    def process_official_results(self, discipline, event):
        try:
            response = IbuApiClient().get_results(event.source_race_id)
        except (IbuApiError, requests.RequestException):
            return [], "Die Ergebnisse konnten nicht von der offiziellen IBU-Quelle geladen werden."
        rows = response.rows if hasattr(response, "rows") else response
        if getattr(response, "kind", "results") == "start_list":
            return [], OfficialResultsNotReady(
                "Die offizielle IBU-Quelle liefert derzeit nur eine Startliste und noch keine Ergebnisse."
            )
        if not rows:
            return [], "Die offizielle IBU-Quelle enthält keine Ergebnisse."

        if event.event_type.betting_on == "countries":
            rows = self._dedupe_country_result_rows(rows)
            results = []
            for row in rows:
                if not row.nation_code:
                    continue
                country = self._ensure_country(row.nation_code, row.country_name)
                results.append(
                    Result(
                        event_id=event.id,
                        place=self._resolve_official_result_place(row),
                        object_id=country.code,
                        object_name=country.name,
                        time=row.time,
                        behind=row.behind,
                        shooting=row.shooting,
                        shooting_time=row.shooting_time,
                        status=row.status,
                    )
                )
            return results, None

        if event.event_type.betting_on == "athletes":
            athletes = []
            row_data = []
            gender = "f" if event.event_type.name == "women" else "m"
            for row in rows:
                if not row.first_name or not row.last_name or not row.nation_code:
                    continue
                self._ensure_country(row.nation_code, row.country_name)
                athletes.append(
                    Athlete(
                        athlete_id=None,
                        ibu_id=row.athlete_id,
                        first_name=row.first_name,
                        last_name=row.last_name,
                        country_code=row.nation_code,
                        gender=gender,
                        discipline=discipline.id,
                    )
                )
                row_data.append(row)
            resolved_athletes = self._athlete_resolver.resolve_athletes(athletes)
            results = []
            for official_row, athlete in zip(row_data, resolved_athletes):
                results.append(
                    Result(
                        event_id=event.id,
                        place=self._resolve_official_result_place(official_row),
                        object_id=athlete.id,
                        object_name=f"{athlete.first_name} {athlete.last_name}",
                        time=official_row.time,
                        behind=official_row.behind,
                        shooting=official_row.shooting,
                        shooting_time=official_row.shooting_time,
                        status=official_row.status,
                    )
                )
            return results, None

        return [], "Wettobjekt nicht bekannt"

    def _ensure_country(self, nation_code: str, country_name: str | None):
        country = Country.get_by_id(nation_code)
        if country is None:
            country = Country(nation_code, country_name or nation_code, "🏴‍☠️")
            country.save_to_db()
        return country

    def _resolve_official_result_place(self, row):
        if row.rank is not None:
            return row.rank
        if row.status is not None:
            return self.NON_CLASSIFIED_PLACE
        return self.NON_CLASSIFIED_PLACE

    def _dedupe_country_result_rows(self, rows):
        deduped_rows = {}
        for row in rows:
            if not row.nation_code:
                continue

            existing_row = deduped_rows.get(row.nation_code)
            if existing_row is None:
                deduped_rows[row.nation_code] = row
                continue

            if existing_row.rank is None and row.rank is not None:
                deduped_rows[row.nation_code] = row
                continue

            if (
                row.rank is not None
                and existing_row.rank is not None
                and row.rank < existing_row.rank
            ):
                _logger().warning(
                    "Received multiple official country result rows for %s; keeping better rank %s over %s.",
                    row.nation_code,
                    row.rank,
                    existing_row.rank,
                )
                deduped_rows[row.nation_code] = row
                continue

            _logger().info(
                "Deduplicated repeated official country result row for %s at rank %s.",
                row.nation_code,
                row.rank,
            )

        return sorted(
            deduped_rows.values(),
            key=lambda row: (
                row.rank is None,
                row.rank if row.rank is not None else 9999,
                row.nation_code or "",
            ),
        )
