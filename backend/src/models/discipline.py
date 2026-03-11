import logging

from src.database import db_manager
from src.models.base_model import BaseModel
from src.models.event_type import EventType
from src.models.event import Event
from src.models.result import Result
from src.models.athlete import Athlete
from src.models.country import Country
from src.athlete_duplicates import resolve_existing_athlete
import requests
from flask import current_app, has_app_context

from src.ibu_api import IbuApiClient, IbuApiError, race_is_importable

logger = logging.getLogger(__name__)


class Discipline(BaseModel):
    EVENT_IMPORT_MODE_MANUAL = "manual"
    EVENT_IMPORT_MODE_OFFICIAL_API = "official_api"
    RESULT_MODE_MANUAL = "manual"
    RESULT_MODE_OFFICIAL_API = "official_api"

    def __init__(self, discipline_id: str, name: str, event_types: list[EventType], result_url: str = None,
                 events_url: str = None, event_import_mode: str = EVENT_IMPORT_MODE_MANUAL,
                 result_mode: str = RESULT_MODE_MANUAL):
        self.id = discipline_id
        self.name = name
        self.event_types = event_types
        self.result_url = result_url
        self.events_url = events_url
        self.event_import_mode = event_import_mode
        self.result_mode = result_mode

    def fetch_importable_events(self, game_id, now=None):
        return [], "Disziplin nicht auswertbar"

    def process_official_results(self, event):
        return [], "Disziplin nicht auswertbar"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "event_types": [e.to_dict() for e in self.event_types],
            "result_url": self.result_url,
            "events_url": self.events_url,
            "event_import_mode": self.event_import_mode,
            "result_mode": self.result_mode,
        }

    @staticmethod
    def from_dict(a_dict, event_types):
        result_url = None
        events_url = None
        event_import_mode = Discipline.EVENT_IMPORT_MODE_MANUAL
        result_mode = Discipline.RESULT_MODE_MANUAL
        if "result_url" in a_dict:
            result_url = a_dict["result_url"]
        if "events_url" in a_dict:
            events_url = a_dict["events_url"]
        if "event_import_mode" in a_dict and a_dict["event_import_mode"]:
            event_import_mode = a_dict["event_import_mode"]
        if "result_mode" in a_dict and a_dict["result_mode"]:
            result_mode = a_dict["result_mode"]
        if a_dict:
            try:
                if a_dict['id'] == 'biathlon':
                    return Biathlon(
                        discipline_id=a_dict['id'], name=a_dict['name'],
                        event_types=event_types, result_url=result_url, events_url=events_url,
                        event_import_mode=event_import_mode, result_mode=result_mode
                    )

                elif a_dict['id'] == 'skispringen':
                    return Skispringen(
                        discipline_id=a_dict['id'], name=a_dict['name'],
                        event_types=event_types, result_url=result_url, events_url=events_url,
                        event_import_mode=event_import_mode, result_mode=result_mode
                    )
                # no matching Discipline
                return None
            except KeyError as e:
                print("Could not instantiate discipline with given values:", a_dict)
                return None
        else:
            return None

    @staticmethod
    def get_all():
        sql = f"SELECT * FROM {db_manager.TABLE_DISCIPLINES}"
        res = db_manager.query(sql)
        event_types = [EventType.get_by_discipline_id(d['id']) for d in res]
        return [Discipline.from_dict(a, e) for a, e in zip(res, event_types)]

    @staticmethod
    def get_by_id(name):
        sql = f"SELECT d.* FROM {db_manager.TABLE_DISCIPLINES} d WHERE d.id = ?"
        discipline = db_manager.query_one(sql, [name])
        if discipline:
            event_types = EventType.get_by_discipline_id(discipline['id'])
            return Discipline.from_dict(discipline, event_types)
        return None

    def save_to_db(self):
        sql = f"""
            INSERT OR IGNORE INTO {db_manager.TABLE_DISCIPLINES}
            (id, name, result_url, events_url, event_import_mode, result_mode)
            VALUES (?,?,?,?,?,?)
            """
        success = db_manager.execute(
            sql,
            [
                self.id,
                self.name,
                self.result_url,
                self.events_url,
                self.event_import_mode,
                self.result_mode,
            ],
        )
        return success, self.id

    @staticmethod
    def get_base_data():
        disciplines = db_manager.load_csv("disciplines.csv")
        event_types = [EventType.get_by_discipline_id(d["id"]) for d in disciplines]
        disciplines = [Discipline.from_dict(d, event_type) for d, event_type in zip(disciplines, event_types)]
        return disciplines

    @staticmethod
    def _logger():
        if has_app_context():
            return current_app.logger
        return logger

    @staticmethod
    def _reload_persisted_athlete(athlete: Athlete | None):
        if athlete is None:
            return None
        persisted_athlete = Athlete.get_by_id(athlete.id)
        if persisted_athlete is not None:
            return persisted_athlete
        if athlete.ibu_id:
            return Athlete.get_by_ibu_id(athlete.ibu_id)
        return None

class Biathlon(Discipline):
    RESULT_PAGE_PREFIX = "https://www.biathlonworld.com/results/"
    NON_CLASSIFIED_PLACE = 9999

    def fetch_importable_events(self, game_id, now=None):
        try:
            races = IbuApiClient().get_importable_races(now=now)
        except (IbuApiError, requests.RequestException):
            return [], "Die Events konnten nicht von der offiziellen IBU-Quelle geladen werden."

        events = []
        for race in races:
            if not race_is_importable(race, now=now):
                continue
            event_type = self._resolve_event_type_from_race(race)
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

    def _resolve_event_type_from_race(self, race):
        title = " ".join((race.title or "").lower().split())
        gender = (race.gender or "").lower()
        if "relay" in title:
            return next((event_type for event_type in self.event_types if event_type.name == "relay"), None)
        if gender in {"w", "women", "female", "ladies"} or "women" in title:
            return next((event_type for event_type in self.event_types if event_type.name == "women"), None)
        if gender in {"m", "men", "male"} or "men" in title:
            return next((event_type for event_type in self.event_types if event_type.name == "men"), None)
        return None

    def process_official_results(self, event):
        try:
            rows = IbuApiClient().get_results(event.source_race_id)
        except (IbuApiError, requests.RequestException):
            return [], "Die Ergebnisse konnten nicht von der offiziellen IBU-Quelle geladen werden."
        if not rows:
            return [], "Die offizielle IBU-Quelle enthält keine Ergebnisse."

        if event.event_type.betting_on == "countries":
            rows = self._dedupe_country_result_rows(rows)
            results = []
            for row in rows:
                if not row.nation_code:
                    continue
                country = Country.get_by_id(row.nation_code)
                if country is None:
                    country = Country(row.nation_code, row.country_name or row.nation_code, "🏴‍☠️")
                    country.save_to_db()
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
                country = Country.get_by_id(row.nation_code)
                if country is None:
                    country = Country(row.nation_code, row.country_name or row.nation_code, "🏴‍☠️")
                    country.save_to_db()
                athletes.append(
                    Athlete(
                        athlete_id=None,
                        ibu_id=row.athlete_id,
                        first_name=row.first_name,
                        last_name=row.last_name,
                        country_code=row.nation_code,
                        gender=gender,
                        discipline="biathlon",
                    )
                )
                row_data.append(row)
            resolved_athletes = self.process_athletes(athletes)
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
                Discipline._logger().warning(
                    "Received multiple official country result rows for %s; keeping better rank %s over %s.",
                    row.nation_code,
                    row.rank,
                    existing_row.rank,
                )
                deduped_rows[row.nation_code] = row
                continue

            Discipline._logger().info(
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

    def process_athletes(self, athletes: list[Athlete]):
        """
        Saves all athletes (existing as well as new) to database and
        reuses existing IDs for strong duplicate matches.
        """
        known_athletes = Athlete.get_all()
        inferred_gender = None

        for a in athletes:
            if a.ibu_id:
                athlete_from_db = Athlete.get_by_ibu_id(a.ibu_id)
                if athlete_from_db is not None and athlete_from_db.gender != "?":
                    inferred_gender = athlete_from_db.gender
                    break
            athlete_from_db, _ = resolve_existing_athlete(a, existing_athletes=known_athletes)
            if athlete_from_db is not None and athlete_from_db.gender != "?":
                inferred_gender = athlete_from_db.gender
                break

        resolved_athletes = []
        for a in athletes:
            if inferred_gender is not None and a.gender == "?":
                a.gender = inferred_gender

            athlete_from_db = Athlete.get_by_ibu_id(a.ibu_id) if a.ibu_id else None
            if athlete_from_db is not None:
                resolved_athletes.append(Discipline._reload_persisted_athlete(athlete_from_db) or athlete_from_db)
                continue

            athlete_from_db, _ = resolve_existing_athlete(a, existing_athletes=known_athletes)
            if athlete_from_db is not None:
                if a.ibu_id and athlete_from_db.ibu_id != a.ibu_id:
                    athlete_from_db.set_ibu_id(a.ibu_id)
                    athlete_from_db = Athlete.get_by_id(athlete_from_db.id) or athlete_from_db
                Discipline._logger().info(
                    "Resolved imported athlete '%s %s' (%s/%s) to existing athlete '%s %s' [%s].",
                    a.first_name,
                    a.last_name,
                    a.country_code,
                    a.discipline,
                    athlete_from_db.first_name,
                    athlete_from_db.last_name,
                    athlete_from_db.id,
                )
                resolved_athletes.append(Discipline._reload_persisted_athlete(athlete_from_db) or athlete_from_db)
                continue

            a.save_to_db()
            saved_athlete = Discipline._reload_persisted_athlete(a)
            if saved_athlete is None:
                raise RuntimeError(
                    f"Imported athlete '{a.first_name} {a.last_name}' [{a.id}] could not be reloaded after save."
                )
            Discipline._logger().info(
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


    def process_countries(self, countries):
        for c in countries:
            c.save_to_db()


class Skispringen(Discipline):
    pass
