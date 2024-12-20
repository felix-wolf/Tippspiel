from abc import abstractmethod

from src.database import db_manager
from src.models.base_model import BaseModel
from src.models.event_type import EventType
from src.models.event import Event
from src.models.result import Result
from src.models.athlete import Athlete
from src.models.country import Country
import src.utils as utils
import src.chrome_manager as chrome_manager
from selenium.webdriver.common.by import By
from selenium.common import NoSuchElementException
from datetime import datetime
import pandas as pd


class Discipline(BaseModel):

    def __init__(self, discipline_id: str, name: str, event_types: list[EventType], result_url: str = None,
                 events_url: str = None):
        self.id = discipline_id
        self.name = name
        self.event_types = event_types
        self.result_url = result_url
        self.events_url = events_url

    @abstractmethod
    def process_events_url(self, url):
        pass

    @abstractmethod
    def process_results_url(self, url, event):
        pass

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "event_types": [e.to_dict() for e in self.event_types],
            "result_url": self.result_url,
            "events_url": self.events_url
        }

    def validate_result_url(self, url):
        return self.result_url is not None and self.result_url in url

    def validate_events_url(self, url):
        return self.events_url is not None and self.events_url in url

    @staticmethod
    def from_dict(a_dict, event_types):
        result_url = None
        events_url = None
        if "result_url" in a_dict:
            result_url = a_dict["result_url"]
        if "events_url" in a_dict:
            events_url = a_dict["events_url"]
        if a_dict:
            try:
                if a_dict['id'] == 'biathlon':
                    return Biathlon(
                        discipline_id=a_dict['id'], name=a_dict['name'],
                        event_types=event_types, result_url=result_url, events_url=events_url
                    )

                elif a_dict['id'] == 'skispringen':
                    return Skispringen(
                        discipline_id=a_dict['id'], name=a_dict['name'],
                        event_types=event_types, result_url=result_url, events_url=events_url
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
            (id, name, result_url, events_url)
            VALUES (?,?,?,?)
            """
        success = db_manager.execute(sql, [self.id, self.name, self.result_url, self.events_url])
        return success, self.id

    @staticmethod
    def get_base_data():
        disciplines = db_manager.load_csv("disciplines.csv")
        event_types = [EventType.get_by_discipline_id(d["id"]) for d in disciplines]
        disciplines = [Discipline.from_dict(d, event_type) for d, event_type in zip(disciplines, event_types)]
        return disciplines

class Biathlon(Discipline):
        
    def process_events_url(self, url, game_id):
        driver = chrome_manager.configure_driver()
        driver.implicitly_wait(3)
        driver.get(url)
        try:
            parent_element = driver.find_element(by=By.XPATH, value='//*[@id="tablesdiv"]')
            tables = parent_element.find_elements(by=By.CLASS_NAME, value="locationdiv")
            events = []
            for t in tables:

                location_name = t.find_element(by=By.TAG_NAME, value='h4').get_attribute('innerHTML').strip()
                table = chrome_manager.read_table_into_df(url=url, table_element_key=By.ID, table_element_value="thistable", element=t)
                for _, row in table.iterrows():
                    event_type_names = [et.name for et in self.event_types]

                    def get_correct_event_type(event_description):
                        if "relay" in event_description.lower():
                            return next((e_type for e_type in self.event_types if e_type.name == "relay"))
                        elif "women" in event_description.lower():
                            return next((e_type for e_type in self.event_types if e_type.name == "women"))
                        else:
                            return next((e_type for e_type in self.event_types if e_type.name == "men"))

                    e = Event(
                        name=location_name.split(" | ")[0] + " - " + row['Description'],
                        game_id=game_id,
                        event_type=get_correct_event_type(row['Description']),
                        dt=datetime.strptime(f"{row['Date']} {row['Time']}", "%Y-%m-%d %H:%M"),
                        allow_partial_points=True,
                        event_id=None,
                        bets=None,
                        results=None
                        )
                    events.append(e)


            return events, None

        except NoSuchElementException as exc:
            return None
        finally:
            driver.close()
            driver.quit()


    def process_results_url(self, url, event):
        df = chrome_manager.read_table_into_df(url, "thistable")
        if df is None:
            return [], "Fehler beim Parsen der Webseite"

        if event.event_type.betting_on == "countries":
            if "Rank" not in df or "Country" not in df or "Nation" not in df:
                return [], "Webseite enthält nicht die erwarteten Daten"
            df = df[df["Country"].notnull()]
            results = []
            for _, row in df.iterrows():
                place = row["Rank"]
                country_name = row["Country"]
                nation = row['Nation']
                time = row.get("Total Time") if pd.notna(row.get("Total Time")) else None
                behind = row.get("Behind") if pd.notna(row.get("Behind")) else None
                country = Country.get_by_id(nation)
                if country is None:
                    country = Country(nation, country_name, "🏴‍☠️")
                    country.save_to_db()
                result = Result(
                    event_id=event.id, 
                    place=utils.validate_int(place), 
                    object_id=country.code, 
                    object_name=country.name,
                    time=time,
                    behind=behind
                )
                results.append(result)
            return results, None

        elif event.event_type.betting_on == "athletes":
            if "Rank" not in df or "Family\xa0Name" not in df or "Given Name" not in df or "Nation" not in df:
                print("Webseite enthält nicht die erwarteten Daten")
                return [], "Webseite enthält nicht die erwarteten Daten"
            results = []
            athletes = []
            for _, row in df.iterrows():
                place = row["Rank"]
                last_name = row["Family\xa0Name"]
                first_name = row["Given Name"]
                country_code = row["Nation"]
                time = row.get("Total Time") if pd.notna(row.get("Total Time")) else None
                behind = row.get("Behind") if pd.notna(row.get("Behind")) else None

                a_id = utils.generate_id([last_name, first_name, country_code])
                a_name = " ".join([first_name, last_name])
                r = Result(
                    event_id=event.id, 
                    place=utils.validate_int(place), 
                    object_id=a_id, 
                    object_name=a_name,
                    time=time,
                    behind=behind
                    )
                results.append(r)
                a = Athlete(
                    athlete_id=a_id, 
                    first_name=first_name,
                    last_name=last_name,
                    country_code=country_code,
                    gender="?",
                    discipline="biathlon"
                )
                athletes.append(a)
            self.process_athletes(athletes)
            return results, None

        else:
            return [], "Wettobjekt nicht bekannt"

    def process_athletes(self, athletes: list[Athlete]):
        """
        Saves all athletes (existing as well as new) to database. 
        Gender is inferred from other competing, known athletes.
        """
        # find gender
        first_existing_althlete = None
        for a in athletes:
            athlete_from_db = Athlete.get_by_id(a.id)
            if athlete_from_db is not None:
                first_existing_althlete = athlete_from_db
                break

        # save gender to athlete object, write athlete into db
        for a in athletes:
            a.gender = first_existing_althlete.gender
            a.save_to_db()

    
    def process_countries(self, countries):
        for c in countries:
            c.save_to_db()


class Skispringen(Discipline):

    def process_events_url(self, url, game_id):
         return [], "Disziplin nicht auswertbar"

    def process_results_url(self, url, event):
        return [], "Disziplin nicht auswertbar"
