CREATE TABLE IF NOT EXISTS SharedEvents (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    race_format TEXT,
    event_type_id TEXT NOT NULL,
    datetime DATETIME NOT NULL,
    source_provider TEXT,
    source_event_id TEXT,
    source_race_id TEXT,
    season_id TEXT,
    url TEXT DEFAULT NULL,
    FOREIGN KEY(event_type_id) REFERENCES EventTypes(id) ON DELETE CASCADE
);

ALTER TABLE Events ADD COLUMN shared_event_id TEXT;

UPDATE Events
SET shared_event_id = CASE
    WHEN source_provider IS NOT NULL AND source_race_id IS NOT NULL
        THEN 'official:' || source_provider || ':' || source_race_id
    ELSE id
END
WHERE shared_event_id IS NULL;

INSERT OR IGNORE INTO SharedEvents (
    id,
    name,
    location,
    race_format,
    event_type_id,
    datetime,
    source_provider,
    source_event_id,
    source_race_id,
    season_id,
    url
)
SELECT
    shared_event_id,
    name,
    location,
    race_format,
    event_type_id,
    datetime,
    source_provider,
    source_event_id,
    source_race_id,
    season_id,
    url
FROM Events;

DROP INDEX IF EXISTS idx_events_official_identity;

CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_events_official_identity
ON SharedEvents(source_provider, source_race_id)
WHERE source_provider IS NOT NULL AND source_race_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_game_shared_identity
ON Events(game_id, shared_event_id)
WHERE shared_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_shared_event_lookup
ON Events(shared_event_id);

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
        COALESCE(se.url, e.url) AS url,
        e.shared_event_id,
        g.discipline,
        COUNT(b.id) > 0 AS has_bets
    FROM Events e
    LEFT JOIN SharedEvents se ON se.id = e.shared_event_id
    INNER JOIN Games g ON e.game_id = g.id
    LEFT JOIN Bets b ON e.id = b.event_id
    GROUP BY e.id
    ORDER BY COALESCE(se.datetime, e.datetime);

DROP VIEW IF EXISTS VIEW_GamePredictionStats;

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
    LEFT JOIN VIEW_Predictions vp ON vp.id = p.id;
