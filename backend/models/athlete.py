from backend.database import db_manager
from backend.models.base_model import BaseModel


class Athlete(BaseModel):

    def __init__(self, athlete_id, name, surname, country_code, gender, discipline, flag=None):
        self.id = athlete_id
        self.name = name
        self.surname = surname
        self.country_code = country_code
        self.gender = gender
        self.discipline = discipline
        self.flag = flag

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.name,
            "last_name": self.surname,
            "country_code": self.country_code,
            "gender": self.gender,
            "discipline": self.discipline,
            "flag": self.flag
        }

    @staticmethod
    def from_dict(a_dict):
        if a_dict:
            flag = None
            if "flag" in a_dict:
                flag = a_dict["flag"]
            try:
                return Athlete(a_dict['id'], a_dict['first_name'], a_dict['last_name'], a_dict['country_code'],
                               a_dict['gender'], a_dict['discipline'], flag)
            except KeyError as e:
                print("Could not instantiate athlete with given values:", a_dict)
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
            self.id, self.name, self.surname, self.country_code, self.gender, self.discipline
        ])
        return success, self.id

    @staticmethod
    def load_into_db():
        # insert athletes
        athletes = db_manager.load_csv("athletes.csv", generate_id=True)
        athletes = [Athlete.from_dict(a) for a in athletes]
        for athlete in athletes:
            if not athlete.save_to_db():
                print("Error saving athlete")
