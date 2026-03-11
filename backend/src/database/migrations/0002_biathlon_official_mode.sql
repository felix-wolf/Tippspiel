UPDATE Disciplines
SET
    result_url = 'biathlonworld.com/results',
    events_url = NULL,
    event_import_mode = 'official_api',
    result_mode = 'official_api'
WHERE id = 'biathlon';
