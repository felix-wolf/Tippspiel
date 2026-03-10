from dataclasses import dataclass
from datetime import datetime, timedelta
import json
import re
from xml.etree import ElementTree
from zoneinfo import ZoneInfo

import requests


BERLIN_TZ = ZoneInfo("Europe/Berlin")


@dataclass(frozen=True)
class IbuRace:
    season_id: str
    event_id: str
    race_id: str
    location: str
    title: str
    starts_at: datetime
    gender: str | None = None
    nation_code: str | None = None
    race_format: str | None = None


@dataclass(frozen=True)
class IbuResultRow:
    rank: int | None
    first_name: str | None
    last_name: str | None
    athlete_id: str | None
    nation_code: str | None
    country_name: str | None
    time: str | None
    behind: str | None
    shooting: str | None = None
    shooting_time: str | None = None


@dataclass(frozen=True)
class IbuAthleteRow:
    athlete_id: str | None
    first_name: str | None
    last_name: str | None
    nation_code: str | None
    gender: str | None


class IbuApiError(RuntimeError):
    pass


class IbuApiClient:
    BASE_URL = "https://api.biathlonresults.com/modules/sportapi/api"
    SUPPORTED_LEVELS = (1, 2, 3, 4)

    def __init__(self, session=None, timeout=15):
        self.session = session or requests.Session()
        self.timeout = timeout

    @staticmethod
    def current_season_id(now=None):
        current_time = now.astimezone(BERLIN_TZ) if now else datetime.now(BERLIN_TZ)
        start_year = current_time.year if current_time.month >= 5 else current_time.year - 1
        return IbuApiClient.format_season_id(start_year)

    @staticmethod
    def format_season_id(start_year: int):
        return f"{start_year % 100:02d}{(start_year + 1) % 100:02d}"

    @staticmethod
    def iter_import_season_ids(now=None):
        current_time = now.astimezone(BERLIN_TZ) if now else datetime.now(BERLIN_TZ)
        start_year = current_time.year if current_time.month >= 5 else current_time.year - 1
        return [
            IbuApiClient.format_season_id(start_year),
            IbuApiClient.format_season_id(start_year + 1),
        ]

    def get_importable_races(self, now=None):
        races = []
        for season_id in self.iter_import_season_ids(now):
            races.extend(self.get_races_for_season(season_id))
        deduped = {}
        for race in races:
            deduped[race.race_id] = race
        return sorted(deduped.values(), key=lambda race: race.starts_at)

    def get_races_for_season(self, season_id: str):
        races = []
        for level in self.SUPPORTED_LEVELS:
            for event in self._fetch_records("Events", {"SeasonId": season_id, "Level": level}):
                event_id = self._get_text(event, "EventId", "Id", "EventID")
                if not event_id:
                    continue
                location = self._build_event_location(event)
                for competition in self._fetch_records("Competitions", {"EventId": event_id}):
                    race = self._build_race_from_competition(
                        competition=competition,
                        season_id=season_id,
                        event_id=event_id,
                        default_location=location,
                    )
                    if race is not None:
                        races.append(race)
        return races

    def get_results(self, race_id: str):
        return [
            self._build_result_row(record)
            for record in self._fetch_records("Results", {"RaceId": race_id})
        ]

    def get_athletes(self, season_id: str):
        return [
            self._build_athlete_row(record)
            for record in self._fetch_records("athletes", {"SeasonId": season_id})
        ]

    def _build_race_from_competition(
            self,
            competition,
            season_id: str,
            event_id: str,
            default_location: str | None,
            ):
        race_id = self._get_text(competition, "RaceId", "Id", "CompetitionId", "CompetitionID")
        if not race_id:
            return None
        title = self._get_text(
            competition,
            "ShortDescription",
            "Description",
            "Competition",
            "CompetitionDescription",
        )
        if not title:
            return None
        starts_at = self._parse_datetime(
            self._get_text(
                competition,
                "StartTime",
                "StartDate",
                "Date",
                "CompetitionDate",
                "StartDateTime",
            )
        )
        if starts_at is None:
            return None
        location = default_location or self._get_text(competition, "Location", "Venue", "Organizer") or ""
        gender = self._get_text(competition, "Gender", "GenderCode", "Cat", "catId", "GenderOrder")
        nation_code = self._get_text(competition, "Nat", "NAT", "NationCode", "CountryCode")
        race_format = self._get_text(competition, "Discipline", "Format")
        return IbuRace(
            season_id=season_id,
            event_id=event_id,
            race_id=race_id,
            location=location.strip(),
            title=" ".join(title.split()),
            starts_at=starts_at.replace(tzinfo=None),
            gender=gender,
            nation_code=nation_code,
            race_format=" ".join(race_format.split()) if race_format else None,
        )

    def _build_event_location(self, event):
        stop_name = self._get_text(
            event,
            "ShortDescription",
            "Organizer",
            "Location",
            "Description",
            "EventDescription",
        )
        country_code = self._get_text(event, "Nat", "NAT", "NationCode", "CountryCode")
        if stop_name and country_code:
            return f"{stop_name} ({country_code})"
        return stop_name

    def _build_result_row(self, record):
        return IbuResultRow(
            rank=self._to_int(self._get_text(record, "Rank", "ResultOrder", "Place")),
            first_name=self._get_text(record, "GivenName", "FirstName", "Firstname"),
            last_name=self._get_text(record, "FamilyName", "LastName", "Lastname"),
            athlete_id=self._get_text(record, "IBUId", "AthleteId", "AthleteID", "BibAthleteId"),
            nation_code=self._get_text(record, "Nat", "NAT", "NationCode", "CountryCode"),
            country_name=self._get_text(record, "Country", "Nation", "CountryName"),
            time=self._get_text(record, "Result", "TotalTime", "Time"),
            behind=self._get_text(record, "Behind", "Diff"),
            shooting=self._build_shooting_summary(record),
            shooting_time=self._get_normalized_text(
                record,
                "shootingtime",
                "shottime",
                "rangetime",
                "totalrangetime",
                "totalshootingtime",
            ),
        )

    def _build_athlete_row(self, record):
        return IbuAthleteRow(
            athlete_id=self._get_text(record, "IBUId", "AthleteId", "AthleteID"),
            first_name=self._get_text(record, "GivenName", "FirstName", "Firstname"),
            last_name=self._get_text(record, "FamilyName", "LastName", "Lastname"),
            nation_code=self._get_text(record, "Nat", "NAT", "NationCode", "CountryCode"),
            gender=self._get_text(record, "GenderId", "Gender", "GenderCode", "Sex"),
        )

    def _fetch_records(self, path: str, params: dict[str, str | int]):
        response = self.session.get(
            f"{self.BASE_URL}/{path}",
            params=params,
            timeout=self.timeout,
        )
        response.raise_for_status()
        response_text = response.text.lstrip()
        if response_text and not response_text.startswith("<"):
            return self._json_records_for_path(path, response_text)
        try:
            root = ElementTree.fromstring(response.text)
        except ElementTree.ParseError as exc:
            raise IbuApiError(f"Could not parse IBU response for {path}.") from exc
        return self._iter_records(root)

    @staticmethod
    def _json_records_for_path(path: str, response_text: str):
        try:
            payload = json.loads(response_text)
        except json.JSONDecodeError as exc:
            raise IbuApiError(f"Could not parse IBU response for {path}.") from exc
        if isinstance(payload, list):
            return payload
        if not isinstance(payload, dict):
            return []

        if path == "Results":
            results = payload.get("Results")
            return results if isinstance(results, list) else []
        if path.lower() == "athletes":
            athletes = payload.get("Athletes")
            return athletes if isinstance(athletes, list) else []

        for value in payload.values():
            if isinstance(value, list):
                return value
        return []

    @staticmethod
    def _iter_records(root):
        children = [child for child in list(root) if isinstance(child.tag, str)]
        if not children:
            return []
        if len(children) == 1:
            nested_children = [child for child in list(children[0]) if isinstance(child.tag, str)]
            if nested_children and any(list(child) for child in nested_children):
                return nested_children
        return children

    @staticmethod
    def _get_text(element, *field_names):
        if isinstance(element, dict):
            for field_name in field_names:
                value = element.get(field_name)
                if value is not None and value != "":
                    return str(value).strip()
            return None
        for field_name in field_names:
            child = element.find(field_name)
            if child is not None and child.text:
                value = child.text.strip()
                if value:
                    return value
        return None

    @staticmethod
    def _normalize_field_name(value: str):
        return re.sub(r"[^a-z0-9]", "", value.lower())

    @classmethod
    def _field_map(cls, element):
        if isinstance(element, dict):
            items = element.items()
        else:
            items = [
                (child.tag, child.text)
                for child in list(element)
                if isinstance(child.tag, str)
            ]
        field_map = {}
        for key, value in items:
            if value is None:
                continue
            normalized_value = str(value).strip()
            if normalized_value == "":
                continue
            field_map[cls._normalize_field_name(str(key))] = normalized_value
        return field_map

    @classmethod
    def _get_normalized_text(cls, element, *field_names):
        field_map = cls._field_map(element)
        for field_name in field_names:
            value = field_map.get(cls._normalize_field_name(field_name))
            if value is not None:
                return value
        return None

    @classmethod
    def _build_shooting_summary(cls, record):
        direct_value = cls._get_normalized_text(
            record,
            "shooting",
            "shootingtotal",
            "shootingscore",
            "shootingresult",
            "shootresult",
        )
        if direct_value:
            return " ".join(direct_value.split())

        field_map = cls._field_map(record)
        shooting_series = []
        for key, value in field_map.items():
            match = re.fullmatch(r"(shoot|shooting|shootresult|shootingresult)(\d+)", key)
            if not match:
                continue
            shooting_series.append((int(match.group(2)), value))
        if not shooting_series:
            return None
        return " ".join(value for _, value in sorted(shooting_series))

    @staticmethod
    def _parse_datetime(value: str | None):
        if not value:
            return None
        normalized = value.strip().replace("Z", "+00:00")
        for candidate in (normalized, normalized.replace(" ", "T")):
            try:
                parsed = datetime.fromisoformat(candidate)
                if parsed.tzinfo is None:
                    return parsed
                return parsed.astimezone(BERLIN_TZ)
            except ValueError:
                continue
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
            try:
                return datetime.strptime(value, fmt)
            except ValueError:
                continue
        return None

    @staticmethod
    def _to_int(value):
        if value is None or value == "":
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            return None


def race_is_importable(race: IbuRace, now=None):
    current_time = now.astimezone(BERLIN_TZ) if now else datetime.now(BERLIN_TZ)
    comparison_time = current_time.replace(tzinfo=None) - timedelta(hours=24)
    return race.starts_at >= comparison_time
