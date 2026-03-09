from src.database import db_manager


STATS_VIEW = "VIEW_GamePredictionStats"


def _round(value, digits=2):
    if value is None:
        return None
    return round(float(value), digits)


def _normalize_stat_row(row, rename_name_to=None):
    if row is None:
        return None
    normalized = dict(row)
    if rename_name_to and "name" in normalized:
        normalized[rename_name_to] = normalized.pop("name")
    for key in ["points", "average_points", "opponent_average_points", "delta", "exact_hit_rate", "scoring_pick_rate", "average_points_per_event"]:
        if key in normalized and normalized[key] is not None:
            normalized[key] = _round(normalized[key])
    return normalized


class GameStats:
    @staticmethod
    def _query_one(sql: str, params: list):
        row = db_manager.query_one(sql, params)
        return _normalize_stat_row(row)

    @staticmethod
    def _query_top_object(
        game_id: str,
        user_id: str,
        order_by: str,
        betting_on: str,
        min_picks: int | None = None,
    ):
        having_clause = ""
        params = [game_id, user_id, betting_on]
        if min_picks is not None:
            having_clause = "HAVING COUNT(*) >= ?"
            params.append(min_picks)
        sql = f"""
            SELECT
                object_id AS id,
                object_name AS name,
                COUNT(*) AS pick_count,
                SUM(prediction_score) AS points,
                AVG(prediction_score) AS average_points
            FROM {STATS_VIEW}
            WHERE game_id = ? AND user_id = ? AND actual_place IS NOT NULL
              AND event_type_id IN (
                  SELECT id FROM {db_manager.TABLE_EVENT_TYPES} WHERE betting_on = ?
              )
            GROUP BY object_id, object_name
            {having_clause}
            ORDER BY {order_by}
            LIMIT 1
        """
        return GameStats._query_one(sql, params)

    @staticmethod
    def get_for_game_user(game_id: str, user_id: str):
        overview = GameStats._query_one(
            f"""
            SELECT
                COALESCE(SUM(prediction_score), 0) AS total_points,
                COUNT(*) AS resolved_predictions,
                COUNT(DISTINCT event_id) AS resolved_events,
                COALESCE(SUM(is_exact_hit), 0) AS exact_hits,
                COALESCE(SUM(is_scoring_pick), 0) AS scoring_picks,
                CASE
                    WHEN COUNT(*) = 0 THEN 0
                    ELSE (100.0 * SUM(is_exact_hit)) / COUNT(*)
                END AS exact_hit_rate,
                CASE
                    WHEN COUNT(*) = 0 THEN 0
                    ELSE (100.0 * SUM(is_scoring_pick)) / COUNT(*)
                END AS scoring_pick_rate,
                CASE
                    WHEN COUNT(DISTINCT event_id) = 0 THEN 0
                    ELSE (1.0 * SUM(prediction_score)) / COUNT(DISTINCT event_id)
                END AS average_points_per_event
            FROM {STATS_VIEW}
            WHERE game_id = ? AND user_id = ? AND actual_place IS NOT NULL
            """,
            [game_id, user_id],
        ) or {
            "total_points": 0,
            "resolved_predictions": 0,
            "resolved_events": 0,
            "exact_hits": 0,
            "scoring_picks": 0,
            "exact_hit_rate": 0.0,
            "scoring_pick_rate": 0.0,
            "average_points_per_event": 0.0,
        }

        best_location = GameStats._query_one(
            f"""
            SELECT
                event_location AS name,
                SUM(prediction_score) AS points,
                COUNT(*) AS pick_count,
                COUNT(DISTINCT event_id) AS event_count,
                AVG(prediction_score) AS average_points
            FROM {STATS_VIEW}
            WHERE game_id = ? AND user_id = ? AND actual_place IS NOT NULL AND event_location IS NOT NULL
            GROUP BY event_location
            ORDER BY points DESC, event_count DESC, name ASC
            LIMIT 1
            """,
            [game_id, user_id],
        )

        best_location_vs_opponents = GameStats._query_one(
            f"""
            WITH user_location AS (
                SELECT
                    event_location AS name,
                    SUM(prediction_score) AS user_points,
                    COUNT(DISTINCT event_id) AS event_count
                FROM {STATS_VIEW}
                WHERE game_id = ? AND user_id = ? AND actual_place IS NOT NULL AND event_location IS NOT NULL
                GROUP BY event_location
            ),
            opponent_location AS (
                SELECT
                    event_location AS name,
                    user_id,
                    SUM(prediction_score) AS opponent_points
                FROM {STATS_VIEW}
                WHERE game_id = ? AND user_id != ? AND actual_place IS NOT NULL AND event_location IS NOT NULL
                GROUP BY event_location, user_id
            )
            SELECT
                ul.name,
                ul.user_points AS points,
                ul.event_count,
                AVG(ol.opponent_points) AS opponent_average_points,
                ul.user_points - AVG(ol.opponent_points) AS delta
            FROM user_location ul
            LEFT JOIN opponent_location ol ON ol.name = ul.name
            GROUP BY ul.name, ul.user_points, ul.event_count
            HAVING COUNT(ol.user_id) > 0
            ORDER BY delta DESC, points DESC, ul.name ASC
            LIMIT 1
            """,
            [game_id, user_id, game_id, user_id],
        )

        best_race_format = GameStats._query_one(
            f"""
            SELECT
                event_race_format AS name,
                SUM(prediction_score) AS points,
                COUNT(*) AS pick_count,
                COUNT(DISTINCT event_id) AS event_count,
                AVG(prediction_score) AS average_points
            FROM {STATS_VIEW}
            WHERE game_id = ? AND user_id = ? AND actual_place IS NOT NULL AND event_race_format IS NOT NULL
            GROUP BY event_race_format
            ORDER BY points DESC, event_count DESC, name ASC
            LIMIT 1
            """,
            [game_id, user_id],
        )

        worst_race_format = GameStats._query_one(
            f"""
            SELECT
                event_race_format AS name,
                SUM(prediction_score) AS points,
                COUNT(*) AS pick_count,
                COUNT(DISTINCT event_id) AS event_count,
                AVG(prediction_score) AS average_points
            FROM {STATS_VIEW}
            WHERE game_id = ? AND user_id = ? AND actual_place IS NOT NULL AND event_race_format IS NOT NULL
            GROUP BY event_race_format
            ORDER BY points ASC, event_count DESC, name ASC
            LIMIT 1
            """,
            [game_id, user_id],
        )

        most_picked_athlete = GameStats._query_top_object(
            game_id,
            user_id,
            "pick_count DESC, points DESC, name ASC",
            "athletes",
        )
        most_points_athlete = GameStats._query_top_object(
            game_id,
            user_id,
            "points DESC, pick_count DESC, name ASC",
            "athletes",
        )
        low_return_frequent_athlete = GameStats._query_top_object(
            game_id,
            user_id,
            "pick_count DESC, average_points ASC, points ASC, name ASC",
            "athletes",
            min_picks=2,
        ) or GameStats._query_top_object(
            game_id,
            user_id,
            "pick_count DESC, average_points ASC, points ASC, name ASC",
            "athletes",
        )
        most_points_country = GameStats._query_top_object(
            game_id,
            user_id,
            "points DESC, pick_count DESC, name ASC",
            "countries",
        )
        low_return_frequent_country = GameStats._query_top_object(
            game_id,
            user_id,
            "pick_count DESC, average_points ASC, points ASC, name ASC",
            "countries",
            min_picks=2,
        ) or GameStats._query_top_object(
            game_id,
            user_id,
            "pick_count DESC, average_points ASC, points ASC, name ASC",
            "countries",
        )

        best_event = GameStats._query_one(
            f"""
            SELECT
                event_id AS id,
                event_name AS name,
                event_location AS location,
                event_race_format AS race_format,
                SUM(prediction_score) AS points
            FROM {STATS_VIEW}
            WHERE game_id = ? AND user_id = ? AND actual_place IS NOT NULL
            GROUP BY event_id, event_name, event_location, event_race_format
            ORDER BY points DESC, name ASC
            LIMIT 1
            """,
            [game_id, user_id],
        )

        worst_event = GameStats._query_one(
            f"""
            SELECT
                event_id AS id,
                event_name AS name,
                event_location AS location,
                event_race_format AS race_format,
                SUM(prediction_score) AS points
            FROM {STATS_VIEW}
            WHERE game_id = ? AND user_id = ? AND actual_place IS NOT NULL
            GROUP BY event_id, event_name, event_location, event_race_format
            ORDER BY points ASC, name ASC
            LIMIT 1
            """,
            [game_id, user_id],
        )

        return {
            "overview": overview,
            "locations": {
                "best_total_points": best_location,
                "best_vs_opponents": best_location_vs_opponents,
            },
            "race_formats": {
                "best_total_points": best_race_format,
                "worst_total_points": worst_race_format,
            },
            "athletes": {
                "most_picked": most_picked_athlete,
                "most_points": most_points_athlete,
                "low_return_frequent": low_return_frequent_athlete,
            },
            "countries": {
                "most_points": most_points_country,
                "low_return_frequent": low_return_frequent_country,
            },
            "events": {
                "best_event": best_event,
                "worst_event": worst_event,
            },
        }
