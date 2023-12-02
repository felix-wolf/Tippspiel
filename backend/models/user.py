import hashlib

from backend.database import db_manager


class User:

    def __init__(self, user_id, name, pw_hash):
        self.id = user_id
        self.name = name
        self.pw_hash = pw_hash

    def to_string(self):
        return f"User{self.id, self.name, self.pw_hash}"

    def get_id(self):
        return self.id

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    @staticmethod
    def from_dict(user_dict):
        if user_dict:
            try:
                return User(user_dict['id'], user_dict['name'], user_dict['pw_hash'])
            except KeyError as err:
                print("Could not instantiate user with given values:", user_dict)
                return None
        else:
            return None

    @staticmethod
    def create(name, pw_hash):
        user_id = hashlib.md5("".join([name, pw_hash]).encode('utf-8')).hexdigest()
        sql = f"INSERT INTO {db_manager.TABLE_NAME_USERS} (id, name, pw_hash) VALUES (?,?,?)"
        return db_manager.execute(sql, [user_id, name, pw_hash])

    @staticmethod
    def get_by_id(user_id):
        sql = f"""
                SELECT * FROM {db_manager.TABLE_NAME_USERS} a
                WHERE a.id = ?
                """
        res = db_manager.query_one(sql, [user_id])
        return User.from_dict(res)

    @staticmethod
    def get_by_credentials(name, pw_hash):
        sql = f"""
                SELECT * FROM {db_manager.TABLE_NAME_USERS} a
                WHERE a.name = ? and a.pw_hash = ?
                """
        res = db_manager.query_one(sql, [name, pw_hash])
        return User.from_dict(res)

    @staticmethod
    def does_exist(name, pw_hash):
        return User.get_by_credentials(name, pw_hash) is not None
