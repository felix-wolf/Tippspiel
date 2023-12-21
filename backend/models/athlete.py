from database import db_manager
from models.base_model import BaseModel
import utils
import chrome_manager


class Athlete(BaseModel):

    def __init__(self, athlete_id, first_name, last_name, country_code, gender, discipline, flag=None):
        if athlete_id is None:
            self.id = utils.generate_id([last_name, first_name, country_code])
        else:
            self.id = athlete_id
        self.first_name = first_name
        self.last_name = last_name
        self.country_code = country_code
        self.gender = gender
        self.discipline = discipline
        self.flag = flag

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
            if "id" in a_dict:
                a_id = a_dict["id"]
            try:
                return Athlete(
                    athlete_id=a_id, first_name=a_dict['first_name'], last_name=a_dict['last_name'],
                    country_code=a_dict['country_code'], gender=a_dict['gender'],
                    discipline=a_dict['discipline'], flag=flag
                )
            except KeyError as e:
                print("Could not instantiate athlete with given values:", a_dict, e)
                return None
        else:
            return None

    @staticmethod
    def get_all():
        sql = f"SELECT * FROM VIEW_{db_manager.TABLE_ATHLETES}"
        res = db_manager.query(sql)
        return [Athlete.from_dict(a) for a in res]

    def save_to_db(self):
        sql = f"""
            INSERT OR IGNORE INTO {db_manager.TABLE_ATHLETES} 
            (id, first_name, last_name, country_code, gender, discipline)
            VALUES (?,?,?,?,?,?)
            """
        success = db_manager.execute(sql, [
            self.id, self.first_name, self.last_name, self.country_code, self.gender, self.discipline
        ])
        return success, self.id

    @staticmethod
    def load_into_db():
        # insert athletes from csv
        athletes = db_manager.load_csv("athletes.csv", generate_id=False)
        athletes = [Athlete.from_dict(a) for a in athletes]

        # insert athletes from world cup standing
        athlete_url_objects = db_manager.load_csv("athlete_urls.csv", generate_id=False)
        for url_object in athlete_url_objects:
            df = chrome_manager.read_table_into_df(
                url=url_object["url"],
                table_element_key=url_object['htmlKey'],
                table_element_value=url_object['htmlValue']
            )
            url_object["lastNameColumn"] = url_object["lastNameColumn"].replace('$%$', '\xa0')
            df = df[[url_object["firstNameColumn"], url_object["lastNameColumn"], url_object["countryColumn"]]]
            results = [dict(zip(["first_name", "last_name", "country_code"], result)) for result in df.values]
            for result in results:
                result["gender"] = url_object["gender"]
                result["discipline"] = url_object["discipline"]
            athletes.extend([Athlete.from_dict(a) for a in results])
            athletes = list(set(athletes))

        for athlete in athletes:
            if not athlete.save_to_db():
                print("Error saving athlete")
