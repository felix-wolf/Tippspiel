DROP TABLE IF EXISTS Countries;
CREATE TABLE if not EXISTS Countries (
    code TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    flag TEXT NOT NULL
);

DROP TABLE IF EXISTS Athletes;
CREATE TABLE if not EXISTS Athletes (
     id TEXT PRIMARY KEY NOT NULL,
     first_name TEXT NOT NULL,
     last_name TEXT NOT NULL,
     country_code TEXT NOT NULL,
     gender TEXT NOT NULL,
     FOREIGN KEY(country_code) REFERENCES Countries(code)
);

CREATE TABLE if not EXISTS Users (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    pw_hash TEXT NOT NULL
);