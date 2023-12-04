DROP TABLE IF EXISTS Countries;
DROP TABLE IF EXISTS Athletes;

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

CREATE TABLE if not EXISTS Users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT UNIQUE NOT NULL,
    pw_hash TEXT NOT NULL
);