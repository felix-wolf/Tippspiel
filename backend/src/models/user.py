import logging
import sqlite3
import sys

from flask import current_app, has_app_context

from src.database import db_manager
import src.utils as utils

sys.path.append("..")
logger = logging.getLogger(__name__)

class User:

    def __init__(
        self,
        user_id: str,
        name: str,
        pw_hash: str,
        color: str = None,
        is_admin: bool = False,
        email: str | None = None,
    ):
        self.id = user_id
        self.name = name
        self.pw_hash = pw_hash
        self.color = color
        self.is_admin = is_admin
        self.email = email

    def to_string(self):
        return f"User{self.id, self.name, self.pw_hash}"

    def get_id(self):
        return self.id

    def is_authenticated(self):
        return True

    def is_active(self):
        return True

    def to_dict(self, include_private: bool = False):
        payload = {
            "id": self.id,
            "name": self.name,
            "color": self.color,
            "is_admin": self.is_admin,
        }
        if include_private:
            payload["email"] = self.email
        return payload

    def update_color(self, color):
        sql = f"UPDATE {db_manager.TABLE_USERS} SET color = ? WHERE id = ?"
        success = db_manager.execute(sql, [color, self.id])
        if success:
            self.color = color
        return success

    def update_password_hash(self, pw_hash):
        sql = f"UPDATE {db_manager.TABLE_USERS} SET pw_hash = ? WHERE id = ?"
        success = db_manager.execute(sql, [pw_hash, self.id])
        if success:
            self.pw_hash = pw_hash
        return success

    def update_email(self, email: str | None):
        normalized_email = utils.normalize_email(email)
        sql = f"UPDATE {db_manager.TABLE_USERS} SET email = ? WHERE id = ?"
        try:
            success = db_manager.execute(sql, [normalized_email, self.id])
        except sqlite3.IntegrityError:
            return False
        if success:
            self.email = normalized_email
        return success

    def update_admin_flag(self, is_admin: bool):
        sql = f"UPDATE {db_manager.TABLE_USERS} SET is_admin = ? WHERE id = ?"
        success = db_manager.execute(sql, [1 if is_admin else 0, self.id])
        if success:
            self.is_admin = is_admin
        return success

    @staticmethod
    def configured_admin_usernames():
        if not has_app_context():
            return set()
        return set(current_app.config.get("ADMIN_USERNAMES", []))

    @staticmethod
    def sync_admins(usernames: list[str] | set[str]):
        if not usernames or not db_manager.column_exists(db_manager.TABLE_USERS, "is_admin"):
            return True
        placeholders = ",".join("?" for _ in usernames)
        conn = None
        try:
            conn = db_manager.start_transaction()
            conn.execute(f"UPDATE {db_manager.TABLE_USERS} SET is_admin = 0")
            conn.execute(
                f"UPDATE {db_manager.TABLE_USERS} SET is_admin = 1 WHERE name IN ({placeholders})",
                list(usernames),
            )
            db_manager.commit_transaction(conn)
            return True
        except Exception:
            if conn:
                db_manager.rollback_transaction(conn)
            logger.exception("Failed to sync configured admin users.")
            raise
        finally:
            if conn:
                conn.close()

    @staticmethod
    def from_dict(user_dict):
        if user_dict is None:
            return None
        color = None
        if "color" in user_dict:
            color = user_dict["color"]
        is_admin = bool(user_dict.get("is_admin", False))
        email = user_dict.get("email")
        if user_dict:
            try:
                user = User(user_dict['id'], user_dict['name'], user_dict['pw_hash'], color, is_admin, email)
                if user.name in User.configured_admin_usernames():
                    user.is_admin = True
                return user
            except KeyError as exc:
                logger.warning("Could not instantiate user with given values: %s", user_dict, exc_info=exc)
                return None
        else:
            return None

    @staticmethod
    def create(name, pw_hash, email: str | None = None):
        normalized_email = utils.normalize_email(email)
        user_id = utils.generate_id([name, pw_hash, normalized_email or ""])
        color = utils.generateRandomHexColor()
        is_admin = 1 if name in User.configured_admin_usernames() else 0
        sql = f"INSERT INTO {db_manager.TABLE_USERS} (id, name, pw_hash, color, is_admin, email) VALUES (?,?,?,?,?,?)"
        try:
            success = db_manager.execute(sql, [user_id, name, pw_hash, color, is_admin, normalized_email])
        except sqlite3.IntegrityError:
            return False, user_id
        return success, user_id

    @staticmethod
    def get_by_id(user_id):
        sql = f"""
                SELECT * FROM {db_manager.TABLE_USERS} a
                WHERE a.id = ?
                """
        res = db_manager.query_one(sql, [user_id])
        return User.from_dict(res)

    @staticmethod
    def get_by_game_id(game_id):
        sql = f"""
            SELECT u.* 
            FROM {db_manager.TABLE_USERS} u, {db_manager.TABLE_GAME_PLAYERS} gp
            WHERE u.id = gp.player_id AND
            gp.game_id = ?
            """
        res = db_manager.query(sql, [game_id])
        return [User.from_dict(u) for u in res]

    @staticmethod
    def get_by_name(name):
        sql = f"""
                SELECT * FROM {db_manager.TABLE_USERS} a
                WHERE a.name = ?
                """
        res = db_manager.query_one(sql, [name])
        return User.from_dict(res)

    @staticmethod
    def get_by_email(email):
        normalized_email = utils.normalize_email(email)
        if normalized_email is None:
            return None
        sql = f"""
                SELECT * FROM {db_manager.TABLE_USERS} a
                WHERE a.email = ?
                """
        res = db_manager.query_one(sql, [normalized_email])
        return User.from_dict(res)

    @staticmethod
    def get_by_login_identifier(identifier):
        try:
            if utils.normalize_email(identifier) is not None:
                user = User.get_by_email(identifier)
                if user is not None:
                    return user
        except ValueError:
            pass
        return User.get_by_name(identifier)

    @staticmethod
    def get_by_credentials(name, pw_hash):
        sql = f"""
                SELECT * FROM {db_manager.TABLE_USERS} a
                WHERE a.name = ? and a.pw_hash = ?
                """
        res = db_manager.query_one(sql, [name, pw_hash])
        if not res:
            return None
        return User.from_dict(res)

    @staticmethod
    def authenticate(identifier, password, salt):
        user = User.get_by_login_identifier(identifier)
        if user is None:
            return None
        if not utils.verify_user_password(password, user.pw_hash, salt):
            return None
        if utils.password_hash_needs_upgrade(user.pw_hash):
            user.update_password_hash(utils.hash_user_password(password))
        return user

    @staticmethod
    def does_exist(name, pw_hash):
        return User.get_by_credentials(name, pw_hash) is not None
