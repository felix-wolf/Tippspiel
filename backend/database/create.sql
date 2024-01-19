
CREATE TABLE if not EXISTS Countries (
    code TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    flag TEXT NOT NULL

);

CREATE TABLE if not EXISTS Athletes (
     id TEXT PRIMARY KEY NOT NULL,
     first_name TEXT NOT NULL,
     last_name TEXT NOT NULL,
     country_code TEXT NOT NULL,
     gender TEXT NOT NULL,
     discipline TEXT NOT NULL,
     FOREIGN KEY(discipline) REFERENCES Disciplines(id) ON DELETE CASCADE
     FOREIGN KEY(country_code) REFERENCES Countries(code) ON DELETE CASCADE
);

CREATE VIEW if not EXISTS VIEW_Athletes AS
    SELECT a.*, c.flag FROM Athletes a, Countries c
    WHERE a.country_code = c.code;


CREATE TABLE if not EXISTS Users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT UNIQUE NOT NULL,
    pw_hash TEXT NOT NULL,
    color TEXT
);


CREATE TABLE if not EXISTS Disciplines (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    result_url TEXT
);

CREATE TABLE if not EXISTS Games (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    discipline TEXT NOT NULL,
    pw_hash TEXT,
    owner_id TEXT NOT NULL,
    FOREIGN KEY(owner_id) REFERENCES Users(id) ON DELETE CASCADE
    FOREIGN KEY(discipline) REFERENCES Disciplines(id) ON DELETE CASCADE
);

CREATE TABLE if not EXISTS GamePlayers (
    player_id NOT NULL,
    game_id NOT NULL,
    PRIMARY KEY (player_id, game_id)
);

CREATE TABLE if not EXISTS EventTypes (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    discipline_id TEXT NOT NULL,
    betting_on TEXT NOT NULL,
    FOREIGN KEY(discipline_id) REFERENCES Disciplines(id) ON DELETE CASCADE
);

CREATE TABLE if not EXISTS Events (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    game_id TEXT NOT NULL,
    event_type_id TEXT NOT NULL,
    datetime DATETIME NOT NULL,
    FOREIGN KEY(game_id) REFERENCES Games(id) ON DELETE CASCADE
);

CREATE TABLE if not EXISTS Results (
    id TEXT PRIMARY KEY NOT NULL,
    event_id NOT NULL,
    place NUMERIC NOT NULL,
    object_id TEXT NOT NULL,
    FOREIGN KEY(event_id) REFERENCES Events(id) ON DELETE CASCADE
);

CREATE VIEW if not EXISTS VIEW_Results AS
    SELECT
        r.*,
        CASE
            WHEN va.id IS NOT NULL THEN va.flag || '  ' || va.first_name || ' ' || va.last_name
            WHEN c.code IS NOT NULL THEN c.flag || '  ' || c.name
            ELSE 'unknown'
        END AS 'object_name'
    FROM
        Results r
    LEFT JOIN
        VIEW_Athletes va ON r.object_id  = va.id
    LEFT JOIN
        Countries c ON r.object_id = c.code;

CREATE VIEW if not EXISTS VIEW_Events AS
    SELECT e.*, g.discipline FROM Events e, Games g
    WHERE e.game_id = g.id;


CREATE TABLE if not EXISTS Bets (
    id TEXT PRIMARY KEY NOT NULL,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    score NUMERIC,
    FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY(event_id) REFERENCES Events(id) ON DELETE CASCADE
);


CREATE TABLE if not EXISTS Predictions (
    id TEXT PRIMARY KEY NOT NULL,
    bet_id TEXT NOT NULL,
    predicted_place NUMERIC NOT NULL,
    object_id TEXT NOT NULL,
    actual_place NUMERIC,
    score NUMERIC,
    FOREIGN KEY(bet_id) REFERENCES Bets(id) ON DELETE CASCADE
);

CREATE VIEW if not EXISTS VIEW_Predictions AS
    SELECT
        p.*,
        CASE
            WHEN va.id IS NOT NULL THEN va.flag || '  ' || va.first_name || ' ' || va.last_name
            WHEN c.code IS NOT NULL THEN c.flag || '  ' || c.name
            ELSE 'unknown'
        END AS 'object_name'
    FROM
        Predictions p
    LEFT JOIN
        VIEW_Athletes va ON p.object_id  = va.id
    LEFT JOIN
        Countries c ON p.object_id = c.code;