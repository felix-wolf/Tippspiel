from __future__ import annotations

from src.database import db_manager
from src.blueprints.service_result import service_error, service_ok
from src.models.admin_operation import AdminOperation
from src.models.country import Country
from src.models.event import Event


PIRATE_FLAG = "🏴‍☠️"


def _normalize_optional_text(value):
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or None
    stripped = str(value).strip()
    return stripped or None


def _serialize_shared_event_flags(item: dict):
    with_results = item["with_results_count"]
    without_results = item["without_results_count"]
    return {
        "can_refresh_results": item["source_provider"] == "ibu" and bool(item["source_race_id"]),
        "missing_results": without_results > 0,
        "has_inconsistent_result_state": with_results > 0 and without_results > 0,
        "missing_source_mapping": not item["source_provider"] or not item["source_race_id"],
        "has_multiple_linked_games": item["linked_event_count"] > 1,
    }


def _serialize_shared_event_item(item: dict):
    flags = _serialize_shared_event_flags(item)
    return {
        "shared_event_id": item["shared_event_id"],
        "target_event_id": item["target_event_id"],
        "name": item["name"],
        "location": item["location"],
        "race_format": item["race_format"],
        "datetime": item["datetime"],
        "event_type_id": item["event_type_id"],
        "source_provider": item["source_provider"],
        "source_event_id": item["source_event_id"],
        "source_race_id": item["source_race_id"],
        "season_id": item["season_id"],
        "linked_event_count": item["linked_event_count"],
        "with_results_count": item["with_results_count"],
        "without_results_count": item["without_results_count"],
        "linked_events": item["linked_events"],
        "flags": flags,
    }


def list_shared_event_diagnostics():
    rows = db_manager.query(
        f"""
        SELECT
            e.shared_event_id,
            e.id AS event_id,
            e.name AS event_name,
            e.location,
            e.race_format,
            e.datetime,
            e.event_type_id,
            e.source_provider,
            e.source_event_id,
            e.source_race_id,
            e.season_id,
            e.game_id,
            g.name AS game_name,
            EXISTS(
                SELECT 1 FROM {db_manager.TABLE_RESULTS} r WHERE r.event_id = e.id
            ) AS has_results
        FROM VIEW_{db_manager.TABLE_EVENTS} e
        INNER JOIN {db_manager.TABLE_GAMES} g ON g.id = e.game_id
        WHERE g.visible = 1
        ORDER BY e.datetime DESC, g.name ASC
        """
    )
    diagnostics_by_shared_id = {}
    for row in rows or []:
        shared_event_id = row["shared_event_id"]
        item = diagnostics_by_shared_id.get(shared_event_id)
        if item is None:
            item = {
                "shared_event_id": shared_event_id,
                "target_event_id": row["event_id"],
                "name": row["event_name"],
                "location": row["location"],
                "race_format": row["race_format"],
                "datetime": row["datetime"],
                "event_type_id": row["event_type_id"],
                "source_provider": row["source_provider"],
                "source_event_id": row["source_event_id"],
                "source_race_id": row["source_race_id"],
                "season_id": row["season_id"],
                "linked_event_count": 0,
                "with_results_count": 0,
                "without_results_count": 0,
                "linked_events": [],
            }
            diagnostics_by_shared_id[shared_event_id] = item
        has_results = bool(row["has_results"])
        item["linked_event_count"] += 1
        if has_results:
            item["with_results_count"] += 1
        else:
            item["without_results_count"] += 1
        item["linked_events"].append(
            {
                "event_id": row["event_id"],
                "event_name": row["event_name"],
                "game_id": row["game_id"],
                "game_name": row["game_name"],
                "has_results": has_results,
            }
        )
    return service_ok([_serialize_shared_event_item(item) for item in diagnostics_by_shared_id.values()])


def get_shared_event_detail(shared_event_id: str):
    diagnostics = list_shared_event_diagnostics()
    for item in diagnostics.payload:
        if item["shared_event_id"] == shared_event_id:
            return service_ok(item)
    return service_error("Das Shared Event wurde nicht gefunden.", 404)


def _load_shared_event_row(shared_event_id: str):
    return db_manager.query_one(
        f"SELECT * FROM {db_manager.TABLE_SHARED_EVENTS} WHERE id = ?",
        [shared_event_id],
    )


def _build_shared_event_update_payload(current_row: dict, payload: dict):
    source_provider = _normalize_optional_text(payload.get("source_provider"))
    source_event_id = _normalize_optional_text(payload.get("source_event_id"))
    source_race_id = _normalize_optional_text(payload.get("source_race_id"))
    season_id = _normalize_optional_text(payload.get("season_id"))

    if not source_provider or not source_race_id:
        return None, service_error("Source Provider und Source Race ID sind erforderlich.", 400)

    next_shared_event_id = Event.build_shared_event_id(
        event_id=current_row["id"],
        source_provider=source_provider,
        source_race_id=source_race_id,
    )
    next_row = dict(current_row)
    next_row.update(
        {
            "id": next_shared_event_id,
            "source_provider": source_provider,
            "source_event_id": source_event_id,
            "source_race_id": source_race_id,
            "season_id": season_id,
        }
    )
    return next_row, None


def update_shared_event_source(shared_event_id: str, payload: dict):
    current_row = _load_shared_event_row(shared_event_id)
    if not current_row:
        return service_error("Das Shared Event wurde nicht gefunden.", 404)

    next_row, error_result = _build_shared_event_update_payload(current_row, payload)
    if error_result:
        return error_result

    next_shared_event_id = next_row["id"]
    linked_event_rows = db_manager.query(
        f"SELECT id, game_id FROM {db_manager.TABLE_EVENTS} WHERE shared_event_id = ? ORDER BY game_id, id",
        [shared_event_id],
    ) or []
    if not linked_event_rows:
        return service_error("Das Shared Event wurde nicht gefunden.", 404)

    if next_shared_event_id != shared_event_id:
        collision = db_manager.query_one(
            f"SELECT id FROM {db_manager.TABLE_SHARED_EVENTS} WHERE id = ?",
            [next_shared_event_id],
        )
        if collision:
            return service_error("Die Source-Zuordnung würde mit einem bestehenden Shared Event kollidieren.", 409)

        conflicting_games = db_manager.query(
            f"""
            SELECT DISTINCT game_id
            FROM {db_manager.TABLE_EVENTS}
            WHERE shared_event_id = ?
              AND game_id IN ({",".join("?" for _ in linked_event_rows)})
            """,
            [next_shared_event_id, *[row["game_id"] for row in linked_event_rows]],
        )
        if conflicting_games:
            return service_error(
                "Mindestens ein verknüpftes Spiel hat bereits ein Event mit dieser Source-Zuordnung.",
                409,
            )

    conn = None
    try:
        conn = db_manager.start_transaction()
        if next_shared_event_id == shared_event_id:
            conn.execute(
                f"""
                UPDATE {db_manager.TABLE_SHARED_EVENTS}
                SET source_provider = ?, source_event_id = ?, source_race_id = ?, season_id = ?
                WHERE id = ?
                """,
                [
                    next_row["source_provider"],
                    next_row["source_event_id"],
                    next_row["source_race_id"],
                    next_row["season_id"],
                    shared_event_id,
                ],
            )
        else:
            conn.execute(
                f"""
                INSERT INTO {db_manager.TABLE_SHARED_EVENTS}
                (id, name, location, race_format, event_type_id, datetime, source_provider, source_event_id, source_race_id, season_id)
                VALUES (?,?,?,?,?,?,?,?,?,?)
                """,
                [
                    next_row["id"],
                    next_row["name"],
                    next_row["location"],
                    next_row["race_format"],
                    next_row["event_type_id"],
                    next_row["datetime"],
                    next_row["source_provider"],
                    next_row["source_event_id"],
                    next_row["source_race_id"],
                    next_row["season_id"],
                ],
            )
            conn.execute(
                f"""
                UPDATE {db_manager.TABLE_EVENTS}
                SET shared_event_id = ?, source_provider = ?, source_event_id = ?, source_race_id = ?, season_id = ?
                WHERE shared_event_id = ?
                """,
                [
                    next_shared_event_id,
                    next_row["source_provider"],
                    next_row["source_event_id"],
                    next_row["source_race_id"],
                    next_row["season_id"],
                    shared_event_id,
                ],
            )
            conn.execute(
                f"DELETE FROM {db_manager.TABLE_SHARED_EVENTS} WHERE id = ?",
                [shared_event_id],
            )

        if next_shared_event_id == shared_event_id:
            conn.execute(
                f"""
                UPDATE {db_manager.TABLE_EVENTS}
                SET source_provider = ?, source_event_id = ?, source_race_id = ?, season_id = ?
                WHERE shared_event_id = ?
                """,
                [
                    next_row["source_provider"],
                    next_row["source_event_id"],
                    next_row["source_race_id"],
                    next_row["season_id"],
                    next_shared_event_id,
                ],
            )
        db_manager.commit_transaction(conn)
    except Exception as exc:
        if conn:
            db_manager.rollback_transaction(conn)
        return service_error(str(exc), 500)
    finally:
        if conn:
            conn.close()

    return get_shared_event_detail(next_shared_event_id)


def list_country_diagnostics():
    rows = db_manager.query(
        f"""
        WITH athlete_usage AS (
            SELECT
                country_code AS code,
                COUNT(*) AS athlete_count
            FROM {db_manager.TABLE_ATHLETES}
            GROUP BY country_code
        ),
        athlete_examples AS (
            SELECT
                country_code AS code,
                GROUP_CONCAT(TRIM(first_name || ' ' || last_name), ' | ') AS athlete_examples
            FROM {db_manager.TABLE_ATHLETES}
            GROUP BY country_code
        ),
        result_usage AS (
            SELECT
                object_id AS code,
                COUNT(*) AS result_count
            FROM {db_manager.TABLE_RESULTS}
            WHERE LENGTH(object_id) = 3
            GROUP BY object_id
        ),
        referenced_codes AS (
            SELECT code FROM athlete_usage
            UNION
            SELECT code FROM result_usage
            UNION
            SELECT code FROM {db_manager.TABLE_COUNTRIES}
        )
        SELECT
            rc.code,
            c.name,
            c.flag,
            COALESCE(au.athlete_count, 0) AS athlete_count,
            COALESCE(ru.result_count, 0) AS result_count,
            ae.athlete_examples,
            CASE WHEN c.code IS NULL THEN 1 ELSE 0 END AS is_missing_row
        FROM referenced_codes rc
        LEFT JOIN {db_manager.TABLE_COUNTRIES} c ON c.code = rc.code
        LEFT JOIN athlete_usage au ON au.code = rc.code
        LEFT JOIN athlete_examples ae ON ae.code = rc.code
        LEFT JOIN result_usage ru ON ru.code = rc.code
        WHERE c.code IS NULL OR c.flag = ?
        ORDER BY athlete_count DESC, result_count DESC, rc.code ASC
        """,
        [PIRATE_FLAG],
    ) or []

    diagnostics = []
    for row in rows:
        examples = []
        athlete_examples = row.get("athlete_examples")
        if athlete_examples:
            examples = [item for item in athlete_examples.split(" | ") if item][:3]
        diagnostics.append(
            {
                "code": row["code"],
                "name": row["name"] or row["code"],
                "flag": row["flag"] or PIRATE_FLAG,
                "athlete_count": row["athlete_count"],
                "result_count": row["result_count"],
                "is_missing_row": bool(row["is_missing_row"]),
                "is_placeholder_flag": (row["flag"] or PIRATE_FLAG) == PIRATE_FLAG,
                "athlete_examples": examples,
            }
        )
    return service_ok(diagnostics)


def update_country_metadata(code: str, payload: dict):
    normalized_code = _normalize_optional_text(code)
    normalized_name = _normalize_optional_text(payload.get("name"))
    normalized_flag = _normalize_optional_text(payload.get("flag"))
    if not normalized_code or not normalized_name or not normalized_flag:
        return service_error("Code, Name und Flag sind erforderlich.", 400)

    country = Country(code=normalized_code, name=normalized_name, flag=normalized_flag)
    success, _ = country.save_or_update()
    if not success:
        return service_error("Das Land konnte nicht gespeichert werden.", 500)
    return service_ok(country.to_dict())


def list_admin_operations(limit: int = 50):
    return service_ok(AdminOperation.summarize_recent(limit))
