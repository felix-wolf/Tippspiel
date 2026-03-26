from datetime import datetime, timedelta, timezone
import hashlib
import secrets

from src.database import db_manager
from src.utils import generate_id


class PasswordResetToken:
    @staticmethod
    def _hash_token(raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    @staticmethod
    def _timestamp_after(minutes: int) -> str:
        return (
            datetime.now(timezone.utc) + timedelta(minutes=minutes)
        ).strftime("%Y-%m-%d %H:%M:%S")

    @staticmethod
    def create_for_user(user_id: str, ttl_minutes: int) -> str:
        raw_token = secrets.token_urlsafe(32)
        token_hash = PasswordResetToken._hash_token(raw_token)
        token_id = generate_id([user_id, token_hash, datetime.now(timezone.utc).isoformat()])
        conn = db_manager.start_transaction()
        try:
            conn.execute(
                """
                UPDATE PasswordResetTokens
                SET used_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND used_at IS NULL
                """,
                [user_id],
            )
            conn.execute(
                """
                INSERT INTO PasswordResetTokens (id, user_id, token_hash, expires_at)
                VALUES (?, ?, ?, ?)
                """,
                [token_id, user_id, token_hash, PasswordResetToken._timestamp_after(ttl_minutes)],
            )
            db_manager.commit_transaction(conn)
        except Exception:
            db_manager.rollback_transaction(conn)
            raise
        finally:
            conn.close()
        return raw_token

    @staticmethod
    def consume(raw_token: str, new_password_hash: str) -> bool:
        token_hash = PasswordResetToken._hash_token(raw_token)
        conn = db_manager.start_transaction()
        try:
            row = conn.execute(
                """
                SELECT user_id
                FROM PasswordResetTokens
                WHERE token_hash = ?
                  AND used_at IS NULL
                  AND expires_at > CURRENT_TIMESTAMP
                ORDER BY created_at DESC
                LIMIT 1
                """,
                [token_hash],
            ).fetchone()
            if row is None:
                db_manager.rollback_transaction(conn)
                return False

            user_id = row[0]
            conn.execute(
                f"UPDATE {db_manager.TABLE_USERS} SET pw_hash = ? WHERE id = ?",
                [new_password_hash, user_id],
            )
            conn.execute(
                """
                UPDATE PasswordResetTokens
                SET used_at = CURRENT_TIMESTAMP
                WHERE user_id = ? AND used_at IS NULL
                """,
                [user_id],
            )
            db_manager.commit_transaction(conn)
            return True
        except Exception:
            db_manager.rollback_transaction(conn)
            raise
        finally:
            conn.close()
