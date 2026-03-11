ALTER TABLE Events ADD COLUMN season_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_official_identity
ON Events(game_id, source_provider, source_race_id)
WHERE source_provider IS NOT NULL AND source_race_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_datetime
ON Events(datetime);

CREATE INDEX IF NOT EXISTS idx_events_source_lookup
ON Events(source_provider, source_race_id);
