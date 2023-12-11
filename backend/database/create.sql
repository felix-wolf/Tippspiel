
CREATE TABLE if not EXISTS Countries (
    code TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    flag TEXT NOT NULL

);

CREATE TABLE if not EXISTS Disciplines (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL
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

CREATE VIEW if not EXISTS VIEW_EVENTS AS
    SELECT e.*, g.discipline FROM Events e, Games g
    WHERE e.game_id = g.id;


CREATE TABLE if not EXISTS Bets (
    id TEXT PRIMARY KEY NOT NULL,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    predicted_place NUMERIC NOT NULL,
    object_id TEXT NOT NULL,
    actual_place NUMERIC,
    score NUMERIC,
    FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY(event_id) REFERENCES Events(id) ON DELETE CASCADE
);

CREATE TABLE if not EXISTS Users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT UNIQUE NOT NULL,
    pw_hash TEXT NOT NULL
);