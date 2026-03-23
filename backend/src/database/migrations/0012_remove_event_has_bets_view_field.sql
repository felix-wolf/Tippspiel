DROP VIEW IF EXISTS VIEW_Events;

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
        g.discipline
    FROM Events e
    LEFT JOIN SharedEvents se ON se.id = e.shared_event_id
    INNER JOIN Games g ON e.game_id = g.id
    ORDER BY COALESCE(se.datetime, e.datetime);
