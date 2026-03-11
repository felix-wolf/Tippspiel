PRAGMA foreign_keys = OFF;

CREATE TABLE Disciplines_new (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    event_import_mode TEXT NOT NULL DEFAULT 'manual',
    result_mode TEXT NOT NULL DEFAULT 'manual'
);

INSERT INTO Disciplines_new (id, name, event_import_mode, result_mode)
SELECT id, name, event_import_mode, result_mode
FROM Disciplines;

DROP TABLE Disciplines;
ALTER TABLE Disciplines_new RENAME TO Disciplines;

PRAGMA foreign_keys = ON;
