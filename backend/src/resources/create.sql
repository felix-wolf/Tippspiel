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
);

CREATE VIEW if not EXISTS VIEW_Athletes AS
    SELECT a.*, c.flag FROM Athletes a
    LEFT JOIN Countries c ON a.country_code = c.code;

CREATE TABLE if not EXISTS Users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT UNIQUE NOT NULL,
    pw_hash TEXT NOT NULL,
    color TEXT
);

CREATE TABLE if not EXISTS Disciplines (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    result_url TEXT,
    events_url TEXT
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
    FOREIGN KEY(player_id) REFERENCES Users(id) ON DELETE CASCADE
    FOREIGN KEY(game_id) REFERENCES Games(id) ON DELETE CASCADE
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
    num_bets INTEGER NOT NULL DEFAULT 5,
    points_correct_bet INTEGER NOT NULL DEFAULT 5,
    allow_partial_points INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY(game_id) REFERENCES Games(id) ON DELETE CASCADE
);

CREATE TABLE if not EXISTS Results (
    id TEXT PRIMARY KEY NOT NULL,
    event_id NOT NULL,
    place INTEGER NOT NULL,
    object_id TEXT NOT NULL,
    time TEXT DEFAULT NULL,
    behind TEXT DEFAULT NULL,
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
    SELECT e.*, g.discipline, COUNT(b.id) > 0 as has_bets
    FROM Events e
    INNER JOIN Games g on e.game_id = g.id
    LEFT JOIN Bets b ON e.id = b.event_id
    GROUP BY e.id
    ORDER BY e.datetime;


CREATE TABLE if not EXISTS Bets (
    id TEXT PRIMARY KEY NOT NULL,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    score INTEGER,
    FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY(event_id) REFERENCES Events(id) ON DELETE CASCADE
);

CREATE TABLE if not EXISTS Predictions (
    id TEXT PRIMARY KEY NOT NULL,
    bet_id TEXT NOT NULL,
    predicted_place INTEGER NOT NULL,
    object_id TEXT NOT NULL,
    actual_place INTEGER,
    score INTEGER,
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

CREATE TABLE if not EXISTS DeviceTokens (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    device_token TEXT NOT NULL,
    platform TEXT,
    created_at DATETIME NOT NULL DEFAULT NOW(),
    updated_at DATETIME NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
)