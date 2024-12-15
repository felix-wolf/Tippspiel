from src.database import db_manager
from src.models.base_model import BaseModel


class Country(BaseModel):

    def __init__(self, code, name, flag):
        self.code = code
        self.name = name
        self.flag = flag

    def to_dict(self):
        return {
            "code": self.code, 
            "name": self.name, 
            "flag": self.flag
            }

    @staticmethod
    def from_dict(c_dict):
        if c_dict:
            try:
                return Country(c_dict['code'], c_dict['name'], c_dict['flag'])
            except KeyError as e:
                print("Could not instantiate country with given values:", c_dict)
                return None
        else:
            return None
        
    @staticmethod
    def get_by_id(id):
        sql = f"SELECT * FROM {db_manager.TABLE_COUNTRIES} WHERE code = ?"
        country = db_manager.query_one(sql, [id])
        if country:
            return Country.from_dict(country)
        return None

    @staticmethod
    def get_all():
        sql = f"""SELECT * FROM {db_manager.TABLE_COUNTRIES}"""
        res = db_manager.query(sql)
        return [Country.from_dict(c) for c in res]

    def save_to_db(self):
        sql = f"""
            INSERT OR IGNORE INTO {db_manager.TABLE_COUNTRIES} 
            (code, name, flag)
            VALUES (?,?,?)
            """
        success = db_manager.execute(sql, [self.code, self.name, self.flag])
        return success, self.code

    @staticmethod
    def get_base_data():
        countries = db_manager.load_csv("countries.csv")
        countries = [Country.from_dict(c) for c in countries]
        return countries
