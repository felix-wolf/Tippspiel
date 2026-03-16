from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime

import src.utils as utils
from src.database import db_manager


logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class AdminOperationActor:
    actor_type: str
    actor_name: str
    actor_user_id: str | None = None


class AdminOperation:
    TABLE_NAME = "AdminOperations"

    @staticmethod
    def record(
        *,
        actor: AdminOperationActor,
        action_type: str,
        status: str,
        summary: str,
        target_type: str | None = None,
        target_id: str | None = None,
        details: dict | list | None = None,
    ) -> bool:
        details_json = json.dumps(details, ensure_ascii=True, sort_keys=True) if details is not None else None
        operation_id = utils.generate_id(
            [
                actor.actor_type,
                actor.actor_name,
                actor.actor_user_id or "",
                action_type,
                target_type or "",
                target_id or "",
                status,
                summary,
                details_json or "",
                datetime.utcnow().isoformat(),
            ]
        )
        return db_manager.execute(
            f"""
            INSERT INTO {AdminOperation.TABLE_NAME}
            (id, actor_type, actor_user_id, actor_name, action_type, target_type, target_id, status, summary, details)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            """,
            [
                operation_id,
                actor.actor_type,
                actor.actor_user_id,
                actor.actor_name,
                action_type,
                target_type,
                target_id,
                status,
                summary,
                details_json,
            ],
        )

    @staticmethod
    def fetch_recent(limit: int = 50):
        safe_limit = max(1, min(int(limit), 200))
        rows = db_manager.query(
            f"""
            SELECT
                id,
                actor_type,
                actor_user_id,
                actor_name,
                action_type,
                target_type,
                target_id,
                status,
                summary,
                details,
                created_at
            FROM {AdminOperation.TABLE_NAME}
            ORDER BY datetime(created_at) DESC, rowid DESC
            LIMIT ?
            """,
            [safe_limit],
        ) or []
        return [AdminOperation._serialize_row(row) for row in rows]

    @staticmethod
    def summarize_recent(limit: int = 50):
        entries = AdminOperation.fetch_recent(limit)
        return {
            "entries": entries,
            "total_count": len(entries),
            "failure_count": sum(1 for entry in entries if entry["status"] == "failed"),
            "success_count": sum(1 for entry in entries if entry["status"] == "succeeded"),
            "warning_count": sum(1 for entry in entries if entry["status"] == "warning"),
        }

    @staticmethod
    def _serialize_row(row: dict):
        details = None
        raw_details = row.get("details")
        if raw_details:
            try:
                details = json.loads(raw_details)
            except json.JSONDecodeError:
                logger.warning("Could not decode admin operation details for row %s.", row.get("id"))
        return {
            "id": row["id"],
            "actor_type": row["actor_type"],
            "actor_user_id": row["actor_user_id"],
            "actor_name": row["actor_name"],
            "action_type": row["action_type"],
            "target_type": row["target_type"],
            "target_id": row["target_id"],
            "status": row["status"],
            "summary": row["summary"],
            "details": details,
            "created_at": row["created_at"],
        }
