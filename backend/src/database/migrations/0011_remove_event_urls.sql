DROP VIEW IF EXISTS VIEW_Events;
DROP VIEW IF EXISTS VIEW_GamePredictionStats;

ALTER TABLE Events DROP COLUMN url;
ALTER TABLE SharedEvents DROP COLUMN url;

CREATE VIEW VIEW_Events AS
    SELECT
        e.id,
        COALESCE(se.name, e.name) AS name,
        COALESCE(se.location, e.location) AS location,
        COALESCE(se.race_format, e.race_format) AS race_format,
        e.game_id,
        COALESCE(se.event_type_id, e.event_type_id) AS event_type_id,
        COALESCE(se.datetime, e.datetime) AS datetime,
        e.num_bets,
        e.points_correct_bet,
        e.allow_partial_points,
        COALESCE(se.source_provider, e.source_provider) AS source_provider,
        COALESCE(se.source_event_id, e.source_event_id) AS source_event_id,
        COALESCE(se.source_race_id, e.source_race_id) AS source_race_id,
        COALESCE(se.season_id, e.season_id) AS season_id,
        e.shared_event_id,
        g.discipline,
        COUNT(b.id) > 0 AS has_bets
    FROM Events e
    LEFT JOIN SharedEvents se ON se.id = e.shared_event_id
    INNER JOIN Games g ON e.game_id = g.id
    LEFT JOIN Bets b ON e.id = b.event_id
    GROUP BY e.id
    ORDER BY COALESCE(se.datetime, e.datetime);

CREATE VIEW VIEW_GamePredictionStats AS
    SELECT
        g.id AS game_id,
        g.name AS game_name,
        g.discipline AS discipline_id,
        e.id AS event_id,
        COALESCE(se.name, e.name) AS event_name,
        COALESCE(se.location, e.location) AS event_location,
        COALESCE(se.race_format, e.race_format) AS event_race_format,
        COALESCE(se.datetime, e.datetime) AS event_datetime,
        e.num_bets,
        e.points_correct_bet,
        e.allow_partial_points,
        COALESCE(se.event_type_id, e.event_type_id) AS event_type_id,
        et.name AS event_type_name,
        et.display_name AS event_type_display_name,
        b.id AS bet_id,
        b.user_id,
        u.name AS user_name,
        COALESCE(b.score, 0) AS bet_score,
        p.id AS prediction_id,
        p.object_id,
        vp.object_name,
        p.predicted_place,
        p.actual_place,
        COALESCE(p.score, 0) AS prediction_score,
        CASE
            WHEN p.actual_place IS NOT NULL AND p.actual_place = p.predicted_place THEN 1
            ELSE 0
        END AS is_exact_hit,
        CASE
            WHEN p.actual_place IS NOT NULL AND COALESCE(p.score, 0) > 0 THEN 1
            ELSE 0
        END AS is_scoring_pick
    FROM Predictions p
    INNER JOIN Bets b ON b.id = p.bet_id
    INNER JOIN Events e ON e.id = b.event_id
    LEFT JOIN SharedEvents se ON se.id = e.shared_event_id
    INNER JOIN Games g ON g.id = e.game_id
    INNER JOIN Users u ON u.id = b.user_id
    INNER JOIN EventTypes et ON et.id = COALESCE(se.event_type_id, e.event_type_id)
    LEFT JOIN VIEW_Predictions vp ON vp.id = p.id
    WHERE COALESCE(se.source_race_id, e.source_race_id) IS NOT NULL;
