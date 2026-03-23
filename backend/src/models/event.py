from datetime import datetime
import logging

from src.database import db_manager
from src.models.bet import Bet
from src.models.event_type import EventType
from src.models.result import Result
import src.utils as utils
from zoneinfo import ZoneInfo
from src.models.base_model import BaseModel

logger = logging.getLogger(__name__)


class Event(BaseModel):
    LOCATION_SEPARATOR = " - "
    RACE_FORMAT_PATTERNS = [
        ("single mixed relay", "single mixed relay"),
        ("mixed relay", "mixed relay"),
        ("short individual", "short individual"),
        ("mass start", "mass start"),
        ("super sprint", "super sprint"),
        ("individual", "individual"),
        ("pursuit", "pursuit"),
        ("sprint", "sprint"),
        ("relay", "relay"),
    ]

    @staticmethod
    def current_time():
        return datetime.now(ZoneInfo("Europe/Berlin")).replace(tzinfo=None)

    @staticmethod
    def normalize_location(location: str | None):
        if location is None:
            return None
        normalized = location.strip()
        return normalized or None

    @staticmethod
    def derive_location_from_name(name: str | None, discipline_id: str | None = None):
        if not name:
            return None
        if discipline_id not in (None, "biathlon"):
            return None
        prefix, separator, _ = name.partition(Event.LOCATION_SEPARATOR)
        if not separator:
            return None
        return Event.normalize_location(prefix)

    @staticmethod
    def resolve_location(name: str, event_type: EventType, location: str | None = None):
        normalized_location = Event.normalize_location(location)
        if normalized_location is not None:
            return normalized_location
        return Event.derive_location_from_name(name, event_type.discipline_id)

    @staticmethod
    def normalize_race_format(race_format: str | None):
        if race_format is None:
            return None
        normalized = " ".join(race_format.strip().lower().split())
        return normalized or None

    @staticmethod
    def derive_race_format_from_name(name: str | None, discipline_id: str | None = None):
        if not name:
            return None
        if discipline_id not in (None, "biathlon"):
            return None
        lower_name = " ".join(name.lower().split())
        for pattern, normalized in Event.RACE_FORMAT_PATTERNS:
            if pattern in lower_name:
                return normalized
        return None

    @staticmethod
    def resolve_race_format(name: str, event_type: EventType, race_format: str | None = None):
        normalized_race_format = Event.normalize_race_format(race_format)
        if normalized_race_format is not None:
            return normalized_race_format
        return Event.derive_race_format_from_name(name, event_type.discipline_id)

    def __init__(
            self, name: str, game_id: str, event_type: EventType, dt: datetime,
            allow_partial_points: bool, num_bets: int = None, points_correct_bet: int = None,
            event_id: str = None, bets: list[Bet] = None, results: list[Result] = None,
            location: str = None, race_format: str = None,
            source_provider: str = None, source_event_id: str = None, source_race_id: str = None,
            season_id: str = None, shared_event_id: str = None,
            ):
        if bets is None:
            bets = []
        if results is None:
            results = []
        if num_bets is None:
            num_bets = 5
        if points_correct_bet is None:
            points_correct_bet = 5
        if event_id:
            self.id = event_id
        else:
            self.id = utils.generate_id([name, game_id, event_type.id, dt, num_bets, points_correct_bet])
        self.has_bets_for_users = []
        self.name = name
        self.game_id = game_id
        self.event_type = event_type
        self.dt = dt
        self.allow_partial_points = allow_partial_points
        self.num_bets = num_bets
        self.points_correct_bet = points_correct_bet
        self.bets = bets
        self.results = results
        self.location = Event.resolve_location(name, event_type, location)
        self.race_format = Event.resolve_race_format(name, event_type, race_format)
        self.source_provider = source_provider
        self.source_event_id = source_event_id
        self.source_race_id = source_race_id
        self.season_id = season_id
        self.shared_event_id = shared_event_id or Event.build_shared_event_id(
            event_id=self.id,
            source_provider=self.source_provider,
            source_race_id=self.source_race_id,
        )

    @staticmethod
    def build_shared_event_id(event_id: str, source_provider: str | None = None, source_race_id: str | None = None):
        if source_provider and source_race_id:
            return f"official:{source_provider}:{source_race_id}"
        return event_id

    def to_dict(self):
        bets = []
        if len(self.bets) > 0:
            bets = [b.to_dict() for b in self.bets]
        results = []
        if len(self.results) > 0:
            results = [r.to_dict() for r in self.results]
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "race_format": self.race_format,
            "game_id": self.game_id,
            "event_type": self.event_type.to_dict(),
            "datetime": Event.datetime_to_string(self.dt),
            "num_bets": self.num_bets,
            "points_correct_bet": self.points_correct_bet,
            "allow_partial_points": self.allow_partial_points,
            "bets": bets,
            "results": results,
            "has_bets_for_users": self.has_bets_for_users,
            "source_provider": self.source_provider,
            "source_event_id": self.source_event_id,
            "source_race_id": self.source_race_id,
            "season_id": self.season_id,
            "shared_event_id": self.shared_event_id,

        }

    @staticmethod
    def datetime_to_string(dt):
        return dt.strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def string_to_datetime(dt_string):
        return datetime.strptime(dt_string, "%Y-%m-%d %H:%M:%S")

    @staticmethod
    def get_by_id(
            event_id,
            get_full_object: bool = True,
            user_id: str | None = None,
            process_unscored: bool = True,
    ):
        sql = f"SELECT e.* FROM VIEW_{db_manager.TABLE_EVENTS} e WHERE e.id = ?"
        event_data = db_manager.query_one(sql, [event_id])
        if not event_data:
            return None
        # get event_type
        event_type = EventType.get_by_id(event_data["event_type_id"])
        event = Event.from_dict(event_data, event_type)
        if user_id is not None and not get_full_object:
            return event.load_user_bet(user_id)
        if not get_full_object:
            return event.load_bet_user_ids()
        event = event.get_bets()
        event = event.getResults()
        # check for unprocessed events
        unprocessed_bets = [bet for bet in event.bets if bet.score is None]
        if process_unscored and len(unprocessed_bets) > 0 and event.results is not None and event.results != []:
            success, error = event.process_results(event.results)
            if not success:
                return None
            event = event.get_bets()
        return event

    @staticmethod
    def from_dict(e_dict, event_type):
        if e_dict:
            num_bets = None
            if "num_bets" in e_dict:
                num_bets = e_dict["num_bets"]
            points_correct_bet = None
            if "points_correct_bet" in e_dict:
                points_correct_bet = e_dict["points_correct_bet"]
            try:
                return Event(
                    event_id=e_dict['id'],
                    name=e_dict['name'],
                    game_id=e_dict['game_id'],
                    event_type=event_type,
                    allow_partial_points=bool(e_dict['allow_partial_points']),
                    num_bets=num_bets,
                    points_correct_bet=points_correct_bet,
                    dt=datetime.strptime(e_dict['datetime'], "%Y-%m-%d %H:%M:%S"),
                    location=e_dict.get("location"),
                    race_format=e_dict.get("race_format"),
                    source_provider=e_dict.get("source_provider"),
                    source_event_id=e_dict.get("source_event_id"),
                    source_race_id=e_dict.get("source_race_id"),
                    season_id=e_dict.get("season_id"),
                    shared_event_id=e_dict.get("shared_event_id"),
                )
            except KeyError as exc:
                logger.warning("Could not instantiate event with given values: %s", e_dict, exc_info=exc)
                return None
        else:
            return None

    @staticmethod
    def get_all_by_game_id(game_id: str, get_full_objects: bool, page: int = None, past: bool = False):
        now = datetime.now(ZoneInfo("Europe/Berlin"))
        sql = f"""
            SELECT e.* FROM VIEW_{db_manager.TABLE_EVENTS} e
            WHERE e.game_id = ? and e.datetime {"<" if past else ">"} '{now.strftime("%Y-%m-%d %H:%M:%S")}'
            ORDER BY e.datetime {"DESC" if past else "ASC"}
            """
        if page:
            sql += f"LIMIT {(page - 1) * 5}, {5}"
        res = db_manager.query(sql, [game_id])
        if res:
            if get_full_objects:
                return [Event.get_by_id(e["id"], True) for e in res]
            event_types = {}
            events = []
            for row in res:
                event_type_id = row["event_type_id"]
                event_type = event_types.get(event_type_id)
                if event_type is None:
                    event_type = EventType.get_by_id(event_type_id)
                    event_types[event_type_id] = event_type
                event = Event.from_dict(row, event_type)
                if event is not None:
                    events.append(event)
            if not events:
                return []
            placeholders = ",".join("?" for _ in events)
            bet_rows = db_manager.query(
                f"""
                SELECT event_id, user_id
                FROM {db_manager.TABLE_BETS}
                WHERE event_id IN ({placeholders})
                ORDER BY event_id ASC, user_id ASC
                """,
                [event.id for event in events],
            )
            bet_users_by_event_id = {}
            for row in bet_rows or []:
                bet_users_by_event_id.setdefault(row["event_id"], []).append(row["user_id"])
            for event in events:
                event.has_bets_for_users = bet_users_by_event_id.get(event.id, [])
            return events
        return []

    @staticmethod
    def get_all_by_shared_event_id(shared_event_id: str, get_full_objects: bool = False):
        res = db_manager.query(
            f"SELECT e.id FROM {db_manager.TABLE_EVENTS} e WHERE e.shared_event_id = ? ORDER BY e.game_id",
            [shared_event_id],
        )
        if not res:
            return []
        return [Event.get_by_id(row["id"], get_full_objects) for row in res]

    @staticmethod
    def create(name: str, game_id: str, event_type_id: str, dt: datetime, num_bets: int, points_correct_bet: int, allow_partial_points: bool, location: str = None, race_format: str = None, source_provider: str = None, source_event_id: str = None, source_race_id: str = None, season_id: str = None):
        # insert event
        event_type = EventType.get_by_id(event_type_id)
        if not event_type:
            return False, None, None
        event = Event(
            name=name, game_id=game_id, event_type=event_type, dt=dt, allow_partial_points=allow_partial_points,
            num_bets=num_bets, points_correct_bet=points_correct_bet,
            location=location, race_format=race_format,
            source_provider=source_provider, source_event_id=source_event_id, source_race_id=source_race_id,
            season_id=season_id,
            )
        success, event_id = event.save_to_db()
        return success, event_id, event

    @staticmethod
    def save_events(events):
        if not events:
            return True

        game_ids = sorted({event.game_id for event in events})
        placeholders = ",".join("?" for _ in game_ids)
        existing_rows = db_manager.query(
            f"""
            SELECT id, game_id, shared_event_id
            FROM {db_manager.TABLE_EVENTS}
            WHERE game_id IN ({placeholders})
            """,
            game_ids,
        )
        existing_ids = {row["id"] for row in existing_rows}
        existing_game_shared_keys = {
            (row["game_id"], row["shared_event_id"])
            for row in existing_rows
            if row["shared_event_id"]
        }

        events_to_save = []
        pending_ids = set()
        pending_game_shared_keys = set()
        for event in events:
            event.shared_event_id = Event.build_shared_event_id(
                event_id=event.id,
                source_provider=event.source_provider,
                source_race_id=event.source_race_id,
            )
            game_shared_key = (event.game_id, event.shared_event_id)
            if event.id in existing_ids or event.id in pending_ids:
                continue
            if event.shared_event_id and (
                    game_shared_key in existing_game_shared_keys
                    or game_shared_key in pending_game_shared_keys
            ):
                continue
            events_to_save.append(event)
            pending_ids.add(event.id)
            pending_game_shared_keys.add(game_shared_key)

        if not events_to_save:
            return True

        conn = None
        try:
            conn = db_manager.start_transaction()
            for event in events_to_save:
                if not event._save_shared_event(conn=conn):
                    raise ValueError("shared event could not be saved")
            sql = f"""
                INSERT INTO {db_manager.TABLE_EVENTS}
                (id, name, location, race_format, game_id, event_type_id, datetime, num_bets, points_correct_bet, allow_partial_points, source_provider, source_event_id, source_race_id, season_id, shared_event_id)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """
            conn.executemany(
                sql,
                [
                    (
                        event.id,
                        event.name,
                        event.location,
                        event.race_format,
                        event.game_id,
                        event.event_type.id,
                        Event.datetime_to_string(event.dt),
                        event.num_bets,
                        event.points_correct_bet,
                        1 if event.allow_partial_points else 0,
                        event.source_provider,
                        event.source_event_id,
                        event.source_race_id,
                        event.season_id,
                        event.shared_event_id,
                    )
                    for event in events_to_save
                ],
            )
            db_manager.commit_transaction(conn)
            return True
        except Exception:
            if conn:
                db_manager.rollback_transaction(conn)
            logger.exception("Failed to save %s events in one transaction.", len(events_to_save))
            raise
        finally:
            if conn:
                conn.close()

    def _save_shared_event(self, conn=None):
        sql = f"""
            INSERT INTO {db_manager.TABLE_SHARED_EVENTS}
            (id, name, location, race_format, event_type_id, datetime, source_provider, source_event_id, source_race_id, season_id)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                location = excluded.location,
                race_format = excluded.race_format,
                event_type_id = excluded.event_type_id,
                datetime = excluded.datetime,
                source_provider = excluded.source_provider,
                source_event_id = excluded.source_event_id,
                source_race_id = excluded.source_race_id,
                season_id = excluded.season_id
        """
        params = [
            self.shared_event_id,
            self.name,
            self.location,
            self.race_format,
            self.event_type.id,
            Event.datetime_to_string(self.dt),
            self.source_provider,
            self.source_event_id,
            self.source_race_id,
            self.season_id,
        ]
        if conn:
            conn.execute(sql, params)
            return True
        return db_manager.execute(sql, params)

    def save_to_db(self, commit=True):
        self.shared_event_id = Event.build_shared_event_id(
            event_id=self.id,
            source_provider=self.source_provider,
            source_race_id=self.source_race_id,
        )
        if not self._save_shared_event():
            return False, self.id
        sql = f"""
        INSERT INTO {db_manager.TABLE_EVENTS}
            (id, name, location, race_format, game_id, event_type_id, datetime, num_bets, points_correct_bet, allow_partial_points, source_provider, source_event_id, source_race_id, season_id, shared_event_id)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """
        success = db_manager.execute(
            sql, [
                self.id, self.name, self.location, self.race_format, self.game_id,
                self.event_type.id, Event.datetime_to_string(self.dt),
                self.num_bets, self.points_correct_bet, self.allow_partial_points,
                self.source_provider, self.source_event_id, self.source_race_id,
                self.season_id,
                self.shared_event_id,
            ],
            commit=commit)
        return success, self.id

    def save_bet(self, user_id, predictions):
        bet = Bet.get_by_event_id_user_id(event_id=self.id, user_id=user_id)
        if not bet:
            bet = Bet(user_id=user_id, event_id=self.id)
        if len(predictions) != self.num_bets:
            return False, None
        return bet.update_predictions(predictions), self.id

    def has_started(self, now=None):
        if now is None:
            now = Event.current_time()
        return self.dt <= now

    def creator_can_add_missing_bet(self, user_id):
        if not self.has_started():
            return False
        if Bet.get_by_event_id_user_id(event_id=self.id, user_id=user_id):
            return False
        return True

    def getResults(self):
        # get results
        results = Result.get_by_event_id(self.id)
        self.results = results
        return self

    def get_bets(self):
        # get bets
        sql = f"SELECT b.* FROM {db_manager.TABLE_BETS} b WHERE b.event_id = ?"
        bets_data = db_manager.query(sql, [self.id])
        if bets_data:
            self.bets = [Bet.get_by_event_id_user_id(event_id=b["event_id"], user_id=b["user_id"]) for b in bets_data]
            self.has_bets_for_users = [bet.user_id for bet in self.bets]
        return self

    def load_bet_user_ids(self):
        bet_rows = db_manager.query(
            f"SELECT user_id FROM {db_manager.TABLE_BETS} WHERE event_id = ? ORDER BY user_id ASC",
            [self.id],
        )
        self.has_bets_for_users = [row["user_id"] for row in bet_rows or []]
        return self

    def load_user_bet(self, user_id: str):
        bet = Bet.get_by_event_id_user_id(event_id=self.id, user_id=user_id)
        self.bets = [bet] if bet else []
        self.has_bets_for_users = [user_id] if bet else []
        return self

    def process_results(self, results: list[Result]):
        """
        Process results by comparing predicted with actual places, calculating score and saving to database.
        :param results: list if result objects
        :return: True and None if successful, False and error string if error
        """
        conn = None
        try:
            conn = db_manager.start_transaction()
            # delete existing results
            if not Result.delete_by_event_id(self.id, commit=False, conn=conn):
                raise Exception("Bestehende Ergebnisse konnten nicht gelöscht werden")
            for result in results:
                success, result_id = result.save_to_db(commit=False, conn=conn)
                if not success:
                    raise Exception("Ergebnisse konnten nicht gespeichert werden")
            for bet in self.bets:
                if not bet.calc_score(
                    results,
                    self.points_correct_bet,
                    self.allow_partial_points,
                    commit=False,
                    conn=conn
                ):
                    raise Exception("Ergebnisse konnten nicht gespeichert werden")
            db_manager.commit_transaction(conn)
            return True, None
        except Exception as exc:
            if conn:
                db_manager.rollback_transaction(conn)
            logger.exception("Failed to process results for event %s.", self.id)
            return False, str(exc)
        finally:
            if conn:
                conn.close()

    def update(self, name: str, event_type_id: str, dt: datetime, num_bets: int, points_correct_bet: int, allow_partial_points: bool, location: str = None, race_format: str = None, source_provider: str = None, source_event_id: str = None, source_race_id: str = None):
        """Update an event's information. If the type is changed, all bets are deleted :("""
        success = True
        if name != self.name:
            self.name = name
        if event_type_id != self.event_type.id:
            linked_events = Event.get_all_by_shared_event_id(self.shared_event_id, get_full_objects=False)
            for linked_event in linked_events:
                bets = Bet.get_by_event_id(linked_event.id)
                for bet in bets:
                    deletion_successful = bet.delete()
                    if not deletion_successful:
                        return False, None
            event_type = EventType.get_by_id(event_type_id)
            self.event_type = event_type
        if dt != self.dt:
            self.dt = dt
        if num_bets != self.num_bets:
            # delete all associated bets since num_bets was changed
            bets = Bet.get_by_event_id(self.id)

            for bet in bets:
                deletion_successful = bet.delete()
                if not deletion_successful:
                    return False, None
            event_type = EventType.get_by_id(event_type_id)
            self.num_bets = num_bets
        if points_correct_bet != self.points_correct_bet:
            self.points_correct_bet = points_correct_bet
        if allow_partial_points != self.allow_partial_points:
            self.allow_partial_points = allow_partial_points
        self.location = Event.resolve_location(self.name, self.event_type, location)
        self.race_format = Event.resolve_race_format(self.name, self.event_type, race_format)
        if source_provider is not None or source_event_id is not None or source_race_id is not None:
            self.source_provider = source_provider
            self.source_event_id = source_event_id
            self.source_race_id = source_race_id
        self.shared_event_id = Event.build_shared_event_id(
            event_id=self.id,
            source_provider=self.source_provider,
            source_race_id=self.source_race_id,
        )
        self._save_shared_event()
        if success:
            sql = f"""UPDATE {db_manager.TABLE_EVENTS} SET
                    name = ?,
                    location = ?,
                    race_format = ?,
                    event_type_id = ?,
                    datetime = ?,
                    num_bets = ?,
                    points_correct_bet = ?,
                    allow_partial_points = ?,
                    source_provider = ?,
                    source_event_id = ?,
                    source_race_id = ?,
                    shared_event_id = ?
                    WHERE id = ?
                """
            success = db_manager.execute(
                sql,
                [
                    self.name,
                    self.location,
                    self.race_format,
                    self.event_type.id,
                    Event.datetime_to_string(self.dt),
                    num_bets,
                    points_correct_bet,
                    1 if allow_partial_points else 0,
                    self.source_provider,
                    self.source_event_id,
                    self.source_race_id,
                    self.shared_event_id,
                    self.id,
                ]
            )
        return success, self

    def delete(self):
        conn = None
        try:
            conn = db_manager.start_transaction()
            conn.execute(
                f"DELETE FROM {db_manager.TABLE_EVENTS} WHERE id = ?",
                [self.id],
            )
            remaining_link = conn.execute(
                f"SELECT 1 FROM {db_manager.TABLE_EVENTS} WHERE shared_event_id = ? LIMIT 1",
                [self.shared_event_id],
            ).fetchone()
            if remaining_link is None:
                conn.execute(
                    f"DELETE FROM {db_manager.TABLE_SHARED_EVENTS} WHERE id = ?",
                    [self.shared_event_id],
                )
            db_manager.commit_transaction(conn)
            return True
        except Exception:
            if conn:
                db_manager.rollback_transaction(conn)
            logger.exception("Failed to delete event %s.", self.id)
            raise
        finally:
            if conn:
                conn.close()


    @staticmethod
    def get_all():
        result = db_manager.query(
            sql=f"SELECT id FROM {db_manager.TABLE_EVENTS}"
        )
        if result is not None:
            return [Event.get_by_id(e['id']) for e in result]
        return result

    @staticmethod
    def get_base_data():
        raise NotImplementedError("Event.get_base_data is not implemented")
