import hashlib
import io
from datetime import datetime

import pandas as pd
from selenium.common import NoSuchElementException

from database import db_manager
from database import chrome_manager
from models.bet import Bet
from models.event_type import EventType
import utils


class Event:

    def __init__(self, name: str, game_id: str, event_type: EventType, dt: datetime, event_id: str = None,
                 bets: [Bet] = None):
        if bets is None:
            bets = []
        if event_id:
            self.id = event_id
        else:
            self.id = hashlib.md5("".join([name, game_id, event_type.id, str(dt)]).encode('utf-8')).hexdigest()
        self.name = name
        self.game_id = game_id
        self.event_type = event_type
        self.dt = dt
        self.bets = bets

    def to_dict(self):
        bets = []
        if len(self.bets) > 0:
            bets = [b.to_dict() for b in self.bets] if self.bets else []
        return {
            "id": self.id,
            "name": self.name,
            "game_id": self.game_id,
            "event_type": self.event_type.to_dict(),
            "datetime": self.dt.strftime("%Y-%m-%d %H:%M:%S"),
            "bets": bets
        }

    def save_to_db(self):
        sql = f"INSERT INTO {db_manager.TABLE_EVENTS} (id, name, game_id, event_type_id, datetime) VALUES (?,?,?,?,?)"
        success = db_manager.execute(
            sql, [
                self.id, self.name, self.game_id,
                self.event_type.id, self.dt.strftime("%Y-%m-%d %H:%M:%S")
            ])
        return success, self.id

    def save_bet(self, user_id, predictions):
        bet = Bet.get_by_event_id_user_id(self.id, user_id)
        if not bet:
            bet = Bet(user_id, self.id)
        return bet.update_predictions(predictions), self.id

    def process_url_for_result(self, url: str):
        driver = chrome_manager.configure_driver()
        driver.implicitly_wait(30)
        driver.get(url)
        return self.preprocess_results_for_discipline(driver)

    def process_results(self, results):
        """
        Process results by comparing predicted with actual places, calculating score and saving to database.
        :param results: list of dicts with AT LEAST "id" as object_id and "place" as actual_place
        :return: True and None if successful, False and error string if error
        """
        for bet in self.bets:
            if not bet.calc_score(results):
                return False, "Ergebnisse konnten nicht gespeichert werden"
        return True, None

    def preprocess_results_for_discipline(self, driver):
        if self.event_type.discipline_id == "biathlon":
            try:
                html = io.StringIO(driver.find_element(by="id", value="thistable").get_attribute('outerHTML'))
                df = pd.read_html(html)[0]

                if self.event_type.betting_on == "countries":
                    if "Rank" not in df or "Country" not in df or "Nation" not in df:
                        return [], "Webseite enthält nicht die erwarteten Daten"
                    df = df[["Rank", "Country", "Nation"]]
                    df = df[df["Country"].notnull()]
                    results = [dict(zip(["place", "object", "id"], result)) for result in df.values]
                    return results, None

                elif self.event_type.betting_on == "athletes":
                    if "Rank" not in df or "Family\xa0Name" not in df or "Given Name" not in df or "Nation" not in df:
                        return [], "Webseite enthält nicht die erwarteten Daten"
                    df = df[["Rank", "Family\xa0Name", "Given Name", "Nation"]]
                    results = [dict(zip(["place", "last_name", "first_name", "country_code"], result)) for result in
                               df.values]
                    for result in results:
                        result["id"] = utils.generate_id(
                            [result["last_name"], result["first_name"], result["country_code"]])
                    return results, None

                else:
                    return [], "Wettobjekt nicht bekannt"

            except NoSuchElementException as exc:
                return [], "Fehler beim Parsen der Webseite"
        else:
            return [], "Disziplin nicht auswertbar"

    @staticmethod
    def get_by_id(event_id):
        sql = f"SELECT e.* FROM VIEW_{db_manager.TABLE_EVENTS} e WHERE e.id = ?"
        event_data = db_manager.query_one(sql, [event_id])
        if not event_data:
            return None
        # get event_type
        event_type = EventType.get_by_id(event_data["event_type_id"])
        event = Event.from_dict(event_data, event_type)
        # get bets
        sql = f"SELECT b.* FROM {db_manager.TABLE_BETS} b WHERE b.event_id = ?"
        bets_data = db_manager.query(sql, [event.id])
        if bets_data:
            bets = [Bet.get_by_event_id_user_id(b["event_id"], b["user_id"]) for b in bets_data]
            event.bets = bets
        return event

    @staticmethod
    def from_dict(e_dict, event_type):
        if e_dict:
            try:
                return Event(
                    event_id=e_dict['id'], name=e_dict['name'],
                    game_id=e_dict['game_id'], event_type=event_type,
                    dt=datetime.strptime(e_dict['datetime'], "%Y-%m-%d %H:%M:%S")
                )
            except KeyError as e:
                print("Could not instantiate event with given values:", e_dict, e)
                return None
        else:
            return None

    @staticmethod
    def get_all_by_game_id(game_id):
        sql = f"""
            SELECT e.* FROM {db_manager.TABLE_EVENTS} e
            WHERE e.game_id = ?
            """
        res = db_manager.query(sql, [game_id])
        if res:
            return [Event.get_by_id(e["id"]) for e in res]
        return []

    @staticmethod
    def create(name: str, game_id: str, event_type_id: str, dt: str):
        # insert event
        dt = datetime.strptime(dt, "%d.%m.%Y, %H:%M:%S")
        event_type = EventType.get_by_id(event_type_id)
        if not event_type:
            return False, None
        event = Event(name=name, game_id=game_id, event_type=event_type, dt=dt)
        return event.save_to_db()