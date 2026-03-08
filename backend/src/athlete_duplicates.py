from dataclasses import dataclass
from difflib import SequenceMatcher
import re
import unicodedata

from src.database import db_manager
from src.models.athlete import Athlete
from src.utils import generate_id


def normalize_name_part(value: str):
    ascii_value = unicodedata.normalize("NFKD", value or "")
    ascii_value = "".join(char for char in ascii_value if not unicodedata.combining(char))
    ascii_value = ascii_value.lower()
    ascii_value = re.sub(r"[^a-z0-9]+", " ", ascii_value)
    return " ".join(ascii_value.split())


def athlete_tokens(athlete: Athlete):
    first_name = normalize_name_part(athlete.first_name).split()
    last_name = normalize_name_part(athlete.last_name).split()
    full_name = " ".join([part for part in [*first_name, *last_name] if part])
    return {
        "first_name": first_name,
        "last_name": last_name,
        "full_name": full_name,
        "all_tokens": set(first_name + last_name),
    }


def duplicate_score(left: Athlete, right: Athlete, allow_unknown_gender=False):
    if left.id == right.id:
        return 0.0
    if left.country_code != right.country_code:
        return 0.0
    if left.discipline != right.discipline:
        return 0.0
    if left.gender != right.gender and not (
        allow_unknown_gender and "?" in {left.gender, right.gender}
    ):
        return 0.0

    left_tokens = athlete_tokens(left)
    right_tokens = athlete_tokens(right)
    if not left_tokens["full_name"] or not right_tokens["full_name"]:
        return 0.0

    full_ratio = SequenceMatcher(None, left_tokens["full_name"], right_tokens["full_name"]).ratio()
    intersection = left_tokens["all_tokens"].intersection(right_tokens["all_tokens"])
    smaller_set_size = min(len(left_tokens["all_tokens"]), len(right_tokens["all_tokens"])) or 1
    token_overlap = len(intersection) / smaller_set_size

    same_first_token = (
        bool(left_tokens["first_name"])
        and bool(right_tokens["first_name"])
        and left_tokens["first_name"][0] == right_tokens["first_name"][0]
    )
    same_last_token = (
        bool(left_tokens["last_name"])
        and bool(right_tokens["last_name"])
        and left_tokens["last_name"][-1] == right_tokens["last_name"][-1]
    )
    subset_match = left_tokens["all_tokens"].issubset(right_tokens["all_tokens"]) or right_tokens["all_tokens"].issubset(left_tokens["all_tokens"])

    if left_tokens["full_name"] == right_tokens["full_name"]:
        return 1.0
    if same_first_token and same_last_token and subset_match:
        return max(full_ratio, 0.95)
    if same_first_token and same_last_token and full_ratio >= 0.84:
        return max(full_ratio, token_overlap)
    return 0.0


def resolve_existing_athlete(athlete: Athlete, existing_athletes=None, min_score=0.95):
    candidates = existing_athletes if existing_athletes is not None else Athlete.get_all()
    exact_match = next((candidate for candidate in candidates if candidate.id == athlete.id), None)
    if exact_match is not None:
        return exact_match, 1.0

    best_match = None
    best_score = 0.0
    allow_unknown_gender = "?" in {athlete.gender}
    for candidate in candidates:
        score = duplicate_score(
            athlete,
            candidate,
            allow_unknown_gender=allow_unknown_gender,
        )
        if score > best_score:
            best_match = candidate
            best_score = score

    if best_match is None or best_score < min_score:
        return None, best_score
    return best_match, best_score


def find_duplicate_candidates(min_score=0.84):
    athletes = Athlete.get_all()
    candidates = []
    for index, left in enumerate(athletes):
        for right in athletes[index + 1:]:
            score = duplicate_score(left, right)
            if score < min_score:
                continue
            candidates.append(
                {
                    "score": round(score, 3),
                    "left": left.to_dict(),
                    "right": right.to_dict(),
                }
            )
    candidates.sort(
        key=lambda item: (
            -item["score"],
            item["left"]["last_name"],
            item["left"]["first_name"],
            item["right"]["last_name"],
            item["right"]["first_name"],
        )
    )
    return candidates


def _load_merge_rows(old_athlete_id: str, new_athlete_id: str):
    prediction_rows = db_manager.query(
        f"SELECT id, bet_id, predicted_place FROM {db_manager.TABLE_PREDICTIONS} WHERE object_id = ?",
        [old_athlete_id],
    ) or []
    result_rows = db_manager.query(
        f"SELECT id, event_id, place FROM {db_manager.TABLE_RESULTS} WHERE object_id = ?",
        [old_athlete_id],
    ) or []

    prediction_updates = [
        {
            "old_id": row["id"],
            "new_id": generate_id([row["bet_id"], new_athlete_id, row["predicted_place"]]),
            "bet_id": row["bet_id"],
            "predicted_place": row["predicted_place"],
        }
        for row in prediction_rows
    ]
    result_updates = [
        {
            "old_id": row["id"],
            "new_id": generate_id([row["event_id"], row["place"], new_athlete_id]),
            "event_id": row["event_id"],
            "place": row["place"],
        }
        for row in result_rows
    ]
    return prediction_updates, result_updates


def _find_merge_conflicts(prediction_updates, result_updates):
    conflicts = []
    for update in prediction_updates:
        existing = db_manager.query_one(
            f"SELECT id FROM {db_manager.TABLE_PREDICTIONS} WHERE id = ?",
            [update["new_id"]],
        )
        if existing and existing["id"] != update["old_id"]:
            conflicts.append(
                {
                    "table": db_manager.TABLE_PREDICTIONS,
                    "old_id": update["old_id"],
                    "new_id": update["new_id"],
                    "context": f"bet_id={update['bet_id']}, predicted_place={update['predicted_place']}",
                }
            )

    for update in result_updates:
        existing = db_manager.query_one(
            f"SELECT id FROM {db_manager.TABLE_RESULTS} WHERE id = ?",
            [update["new_id"]],
        )
        if existing and existing["id"] != update["old_id"]:
            conflicts.append(
                {
                    "table": db_manager.TABLE_RESULTS,
                    "old_id": update["old_id"],
                    "new_id": update["new_id"],
                    "context": f"event_id={update['event_id']}, place={update['place']}",
                }
            )
    return conflicts


def build_merge_preview(old_athlete_id: str, new_athlete_id: str):
    old_athlete = Athlete.get_by_id(old_athlete_id)
    if old_athlete is None:
        raise ValueError(f"Der alte Athlet wurde nicht gefunden: {old_athlete_id}")

    new_athlete = Athlete.get_by_id(new_athlete_id)
    if new_athlete is None:
        raise ValueError(f"Der Ziel-Athlet wurde nicht gefunden: {new_athlete_id}")

    if old_athlete.id == new_athlete.id:
        raise ValueError("Alter und neuer Athlet sind identisch.")

    warnings = []
    if old_athlete.country_code != new_athlete.country_code:
        warnings.append("Der Ländercode unterscheidet sich.")
    if old_athlete.gender != new_athlete.gender:
        warnings.append("Das Geschlecht unterscheidet sich.")
    if old_athlete.discipline != new_athlete.discipline:
        warnings.append("Die Disziplin unterscheidet sich.")

    prediction_updates, result_updates = _load_merge_rows(old_athlete_id, new_athlete_id)
    conflicts = _find_merge_conflicts(prediction_updates, result_updates)

    return {
        "old_athlete": old_athlete.to_dict(),
        "new_athlete": new_athlete.to_dict(),
        "warnings": warnings,
        "prediction_updates": prediction_updates,
        "result_updates": result_updates,
        "conflicts": conflicts,
    }


@dataclass
class MergeResult:
    deleted_athlete_id: str
    replacement_athlete_id: str
    updated_predictions: int
    updated_results: int


def merge_athletes(old_athlete_id: str, new_athlete_id: str, allow_mismatch=False):
    preview = build_merge_preview(old_athlete_id, new_athlete_id)
    if preview["warnings"] and not allow_mismatch:
        raise ValueError("Der Merge wurde wegen widersprüchlicher Stammdaten blockiert.")
    if preview["conflicts"]:
        raise ValueError("Der Merge wurde wegen kollidierender Referenzen blockiert.")

    conn = None
    try:
        conn = db_manager.start_transaction()
        for update in preview["prediction_updates"]:
            conn.execute(
                f"UPDATE {db_manager.TABLE_PREDICTIONS} SET id = ?, object_id = ? WHERE id = ?",
                [update["new_id"], new_athlete_id, update["old_id"]],
            )
        for update in preview["result_updates"]:
            conn.execute(
                f"UPDATE {db_manager.TABLE_RESULTS} SET id = ?, object_id = ? WHERE id = ?",
                [update["new_id"], new_athlete_id, update["old_id"]],
            )
        conn.execute(
            f"DELETE FROM {db_manager.TABLE_ATHLETES} WHERE id = ?",
            [old_athlete_id],
        )
        db_manager.commit_transaction(conn)
    except Exception:
        if conn:
            db_manager.rollback_transaction(conn)
        raise
    finally:
        if conn:
            conn.close()

    return MergeResult(
        deleted_athlete_id=old_athlete_id,
        replacement_athlete_id=new_athlete_id,
        updated_predictions=len(preview["prediction_updates"]),
        updated_results=len(preview["result_updates"]),
    )
