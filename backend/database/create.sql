DROP TABLE IF EXISTS Countries;
DROP TABLE IF EXISTS Athletes;
DROP TABLE IF EXISTS Bets;
DROP TABLE IF EXISTS Placements;
DROP TABLE IF EXISTS Events;

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
     FOREIGN KEY(country_code) REFERENCES Countries(code) ON DELETE CASCADE
);

CREATE TABLE if not EXISTS Games (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    pw_hash TEXT,
    owner_id TEXT NOT NULL,
    FOREIGN KEY(owner_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE if not EXISTS GamePlayers (
    player_id NOT NULL,
    game_id NOT NULL,
    PRIMARY KEY (player_id, game_id)
);

CREATE TABLE if not EXISTS Events (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    game_id TEXT NOT NULL,
    type TEXT NOT NULL,
    datetime DATETIME NOT NULL,
    FOREIGN KEY(game_id) REFERENCES Games(id) ON DELETE CASCADE
);

CREATE TABLE if not EXISTS Bets (
    id TEXT PRIMARY KEY NOT NULL,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    FOREIGN KEY(event_id) REFERENCES Events(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES Users(id) ON DELETE CASCADE
);

CREATE TABLE if not EXISTS Placements (
    id TEXT PRIMARY KEY NOT NULL,
    bet_id TEXT NOT NULL,
    predicted_place NUMERIC NOT NULL,
    object_id TEXT NOT NULL,
    actual_place NUMERIC,
    FOREIGN KEY(bet_id) REFERENCES Bets(id) ON DELETE CASCADE
);

CREATE TABLE if not EXISTS Users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT UNIQUE NOT NULL,
    pw_hash TEXT NOT NULL
);