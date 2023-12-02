from backend.database import db_manager


class Country:

    def __init__(self, name, flag):
        self.name = name,
        self.flag = flag

    def to_dict(self):
        return {"name": self.name, "flag": self.flag}

    @staticmethod
    def from_dict(c_dict):
        if c_dict:
            try:
                return Country(c_dict['country'], c_dict['flag'])
            except KeyError as e:
                print("Could not instantiate country with given values:", c_dict)
                return None
        else:
            return None

    @staticmethod
    def get_all():
        sql = f"""SELECT * FROM {db_manager.TABLE_NAME_COUNTRIES}"""
        res = db_manager.query(sql)
        return [Country.from_dict(c) for c in res]
