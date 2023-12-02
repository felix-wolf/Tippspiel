from backend.database import db_manager


class Athlete:

    def __init__(self, athlete_id, name, surname, country):
        self.id = athlete_id
        self.name = name
        self.surname = surname
        self.country = country

    @staticmethod
    def get_all():
        sql = f"""
            SELECT * FROM {db_manager.TABLE_NAME_ATHLETES} 
        """
        athletes = db_manager.query(sql)
        print(athletes)
        return athletes

