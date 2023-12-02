from backend.database import db_manager


class Athlete:

    def __init__(self, athlete_id, name, surname, country_code, gender):
        self.id = athlete_id
        self.name = name
        self.surname = surname
        self.country_code = country_code
        self.gender = gender

    def to_dict(self):
        return {
            "id": self.id,
            "first_name": self.name,
            "last_name": self.surname,
            "country_code": self.country_code,
            "gender": self.gender
        }

    @staticmethod
    def from_dict(a_dict):
        if a_dict:
            try:
                return Athlete(a_dict['id'], a_dict['first_name'], a_dict['last_name'], a_dict['country_code'],
                               a_dict['gender'])
            except KeyError as e:
                print("Could not instantiate athlete with given values:", a_dict)
                return None
        else:
            return None

    @staticmethod
    def get_all():
        sql = f"SELECT * FROM {db_manager.TABLE_NAME_ATHLETES}"
        res = db_manager.query(sql)
        return [Athlete.from_dict(a) for a in res]
