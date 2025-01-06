import src.utils as utils
from src.database import db_manager
from src.models.base_model import BaseModel
from datetime import datetime

class NotificationHelper(BaseModel):

    def to_dict(self):
        return

    @staticmethod
    def from_dict(**kwargs):
        return

    @staticmethod
    def get_by_id(i):
        return

    @staticmethod
    def get_all():
        return

    @staticmethod
    def get_base_data():
        return

    @staticmethod
    def get_token(user_id, platform):
        # check for existing token
        return db_manager.query_one(
            f"SELECT device_token FROM {db_manager.TABLE_DEVICE_TOKENS} WHERE user_id = ? AND platform = ?",
            [user_id, platform]
            )
    
    @staticmethod
    def get_tokens_for_users(user_ids):
        return db_manager.query(f"SELECT device_token FROM {db_manager.TABLE_DEVICE_TOKENS} WHERE user_id IN ({', '.join(map(repr, user_ids))})")

    @staticmethod
    def get_notification_settings_for_user(user_id, platform):
        return db_manager.query_one(
            sql=f"SELECT results_notification, reminder_notification FROM {db_manager.TABLE_DEVICE_TOKENS} WHERE user_id = ? and platform = ?",
            params=[user_id, platform]
        )
    
    @staticmethod
    def save_setting(user_id, platform, setting, value):
        result = db_manager.execute(
            sql=f"UPDATE {db_manager.TABLE_DEVICE_TOKENS} SET {setting}_notification = ? WHERE user_id = ? and platform = ?", 
            params=[value, user_id, platform]
        )
        return result is not None

    @staticmethod
    def save_to_db(token, user_id, platform):
        # check for existing token
        result = db_manager.query_one(
            f"SELECT * FROM {db_manager.TABLE_DEVICE_TOKENS} WHERE user_id = ? AND platform = ?",
            [user_id, platform]
            )
        
        if result is not None:
            db_manager.execute(
            f"DELETE FROM {db_manager.TABLE_DEVICE_TOKENS} WHERE id = ?",
            [result['id']]
            )

        id = utils.generate_id([token, user_id, platform])
        sql = f"""
                INSERT INTO {db_manager.TABLE_DEVICE_TOKENS} 
                (id, user_id, device_token, platform, created_at, updated_at)
                VALUES (?,?,?,?,?,?)
            """
        return db_manager.execute(sql, [id, user_id, token, platform, datetime.now(), datetime.now(),])