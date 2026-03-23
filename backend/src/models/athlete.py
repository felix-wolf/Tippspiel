from dataclasses import dataclass
from datetime import datetime
import logging

import requests

from src.database import db_manager
from src.ibu_api import IbuApiClient, IbuApiError
import src.utils as utils

logger = logging.getLogger(__name__)


@dataclass(eq=False)
class Athlete:

    id: str
    ibu_id: str | None
    first_name: str
    last_name: str
    country_code: str
    gender: str
    discipline: str
    flag: str = None

    def __init__(self, athlete_id, first_name, last_name, country_code, gender, discipline, flag=None, ibu_id=None):
        object.__setattr__(self, "id", athlete_id or utils.generate_id([last_name, first_name, country_code]))
        object.__setattr__(self, "ibu_id", ibu_id)
        object.__setattr__(self, "first_name", first_name)
        object.__setattr__(self, "last_name", last_name)
        object.__setattr__(self, "country_code", country_code)
        object.__setattr__(self, "gender", gender)
        object.__setattr__(self, "discipline", discipline)
        object.__setattr__(self, "flag", flag or "🏴‍☠️")

    def __eq__(self, other):
        if isinstance(other, Athlete):
            return (self.id == other.id) and \
                (self.first_name == other.first_name) and \
                (self.last_name == other.last_name)
        else:
            return False

    def __hash__(self):
        return hash(self.id)

    def to_dict(self):
        return {
            "id": self.id,
            "ibu_id": self.ibu_id,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "country_code": self.country_code,
            "gender": self.gender,
            "discipline": self.discipline,
            "flag": self.flag
        }

    @staticmethod
    def from_dict(a_dict):
        if a_dict:
            flag = None
            a_id = None
            if "flag" in a_dict:
                flag = a_dict["flag"]
            if flag is None:
                flag = "🏴‍☠️"
            if "id" in a_dict:
                a_id = a_dict["id"]
            ibu_id = a_dict.get("ibu_id")
            try:
                return Athlete(
                    athlete_id=a_id, first_name=a_dict['first_name'], last_name=a_dict['last_name'],
                    country_code=a_dict['country_code'], gender=a_dict['gender'],
                    discipline=a_dict['discipline'], flag=flag, ibu_id=ibu_id
                )
            except KeyError as exc:
                logger.warning("Could not instantiate athlete with given values: %s", a_dict, exc_info=exc)
                return None
        else:
            return None

    @staticmethod
    def get_all():
        sql = f"SELECT * FROM VIEW_{db_manager.TABLE_ATHLETES}"
        res = db_manager.query(sql)
        return [Athlete.from_dict(a) for a in res]

    @staticmethod
    def get_by_id(athlete_id):
        sql = f"SELECT * FROM {db_manager.TABLE_ATHLETES} a WHERE a.id = ?"
        res = db_manager.query_one(sql, [athlete_id])
        if not res:
            return None
        return Athlete.from_dict(res)

    @staticmethod
    def get_by_ibu_id(ibu_id):
        if not ibu_id:
            return None
        sql = f"SELECT * FROM {db_manager.TABLE_ATHLETES} a WHERE a.ibu_id = ?"
        res = db_manager.query_one(sql, [ibu_id])
        if not res:
            return None
        return Athlete.from_dict(res)

    def save_to_db(self):
        sql = f"""
            INSERT OR IGNORE INTO {db_manager.TABLE_ATHLETES} 
            (id, ibu_id, first_name, last_name, country_code, gender, discipline)
            VALUES (?,?,?,?,?,?,?)
            """
        success = db_manager.execute(sql, [
            self.id, self.ibu_id, self.first_name, self.last_name, self.country_code, self.gender, self.discipline
        ])
        return success, self.id

    def set_ibu_id(self, ibu_id):
        self.ibu_id = ibu_id
        return db_manager.execute(
            f"UPDATE {db_manager.TABLE_ATHLETES} SET ibu_id = ? WHERE id = ?",
            [ibu_id, self.id],
        )

    @staticmethod
    def _normalize_ibu_gender(value: str | None):
        normalized = (value or "").strip().lower()
        if normalized in {"w", "women", "female", "f"} or normalized.startswith("w") or normalized.endswith("w"):
            return "f"
        if normalized in {"m", "men", "male", "m"} or normalized.startswith("m") or normalized.endswith("m"):
            return "m"
        return "?"

    @staticmethod
    def _biathlon_seed_season_ids(now: datetime | None = None):
        current_season_id = IbuApiClient.current_season_id(now=now)
        current_start_year = 2000 + int(current_season_id[:2])
        return [
            IbuApiClient.format_season_id(current_start_year - 1),
            current_season_id,
        ]

    @staticmethod
    def _merge_seed_athlete(athletes_by_key: dict[str, "Athlete"], athlete: "Athlete | None"):
        if athlete is None:
            return
        key = athlete.ibu_id or athlete.id
        existing = athletes_by_key.get(key)
        if existing is not None and existing.gender != "?" and athlete.gender == "?":
            return
        athletes_by_key[key] = athlete

    @staticmethod
    def get_biathlon_base_data(client: IbuApiClient | None = None, now: datetime | None = None):
        client = client or IbuApiClient()
        athletes_by_key: dict[str, Athlete] = {}

        for season_id in Athlete._biathlon_seed_season_ids(now=now):
            try:
                official_athletes = client.get_athletes(season_id)
            except (IbuApiError, requests.RequestException):
                official_athletes = []

            for official_athlete in official_athletes:
                if not official_athlete.first_name or not official_athlete.last_name or not official_athlete.nation_code:
                    continue
                Athlete._merge_seed_athlete(
                    athletes_by_key,
                    Athlete(
                        athlete_id=None,
                        ibu_id=official_athlete.athlete_id,
                        first_name=official_athlete.first_name,
                        last_name=official_athlete.last_name,
                        country_code=official_athlete.nation_code,
                        gender=Athlete._normalize_ibu_gender(official_athlete.gender),
                        discipline="biathlon",
                    ),
                )

            try:
                races = client.get_races_for_season(season_id)
            except (IbuApiError, requests.RequestException):
                races = []

            for race in races:
                if "relay" in (race.title or "").lower():
                    continue
                race_gender = Athlete._normalize_ibu_gender(race.gender)
                try:
                    results_response = client.get_results(race.race_id)
                except (IbuApiError, requests.RequestException):
                    continue
                if getattr(results_response, "kind", "results") != "results":
                    continue
                results = results_response.rows if hasattr(results_response, "rows") else results_response
                for result in results:
                    if not result.first_name or not result.last_name or not result.nation_code:
                        continue
                    Athlete._merge_seed_athlete(
                        athletes_by_key,
                        Athlete(
                            athlete_id=None,
                            ibu_id=result.athlete_id,
                            first_name=result.first_name,
                            last_name=result.last_name,
                            country_code=result.nation_code,
                            gender=race_gender,
                            discipline="biathlon",
                        ),
                    )

        return list(athletes_by_key.values())

    @staticmethod
    def get_csv_base_data():
        csv_athletes = [Athlete.from_dict(a) for a in db_manager.load_csv("athletes.csv", generate_id=False)]
        return [athlete for athlete in csv_athletes if athlete is not None]

    @staticmethod
    def get_base_data():
        csv_athletes = Athlete.get_csv_base_data()
        official_biathlon_athletes = Athlete.get_biathlon_base_data()
        if official_biathlon_athletes:
            non_biathlon_athletes = [
                athlete for athlete in csv_athletes if athlete.discipline != "biathlon"
            ]
            return list(set(non_biathlon_athletes + official_biathlon_athletes))

        return csv_athletes
