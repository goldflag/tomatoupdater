-- help \?
-- list database \l

-- create database CREATE DATABSE [name]

-- list all tables \d
-- list table props \d [tablename]

-- drop table  DROP TABLE [name]
-- drop database  DROP [name]

-- add col   ALTER TABLE [name] ADD COLUMN [colprops];
-- drop col  ALTER TABLE [name] DROP COLUMN [colname];



CREATE TABLE products(
    id INT,
    name VARCHAR(50),
    price INT,
    on_sale BOOLEAN
);

CREATE TABLE restaurants (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    location VARCHAR(50) NOT NULL,
    price_range INT NOT NULL check(price_range >= 1 and price_range <= 5)
);

INSERT INTO restaurants (id, name, location, price_range) VALUES (2112, 'mcdonalds', 'new york', 10);


CREATE TABLE testcom (
    id serial NOT NULL,
    player_id INTEGER NOT NULL PRIMARY KEY, 
    username VARCHAR(24) NOT NULL, 
    numEntries INTEGER NOT NULL,
    lastUpdate INTEGER NOT NULL,
    timeStamps INTEGER[],
    battleStamps INTEGER[],
    stats JSONB[]
);


CREATE TABLE devcom (
    id serial NOT NULL,
    player_id INTEGER NOT NULL PRIMARY KEY, 
    username VARCHAR(24) NOT NULL, 
    numEntries INTEGER NOT NULL,
    lastUpdate INTEGER NOT NULL,
    timeStamps INTEGER[],
    battleStamps INTEGER[],
    stats JSONB[]
);

CREATE TABLE deveu (
    id serial NOT NULL,
    player_id INTEGER NOT NULL PRIMARY KEY, 
    username VARCHAR(24) NOT NULL, 
    numEntries INTEGER NOT NULL,
    lastUpdate INTEGER NOT NULL,
    timeStamps INTEGER[],
    battleStamps INTEGER[],
    stats JSONB[]
);

CREATE TABLE devasia (
    id serial NOT NULL,
    player_id INTEGER NOT NULL PRIMARY KEY, 
    username VARCHAR(24) NOT NULL, 
    numEntries INTEGER NOT NULL,
    lastUpdate INTEGER NOT NULL,
    timeStamps INTEGER[],
    battleStamps INTEGER[],
    stats JSONB[]
);

CREATE TABLE devru (
    id serial NOT NULL,
    player_id INTEGER NOT NULL PRIMARY KEY, 
    username VARCHAR(24) NOT NULL, 
    numEntries INTEGER NOT NULL,
    lastUpdate INTEGER NOT NULL,
    timeStamps INTEGER[],
    battleStamps INTEGER[],
    stats JSONB[]
);


CREATE TABLE test (
    id serial NOT NULL PRIMARY KEY,
    stats JSONB[]
);


UPDATE test SET stats[2] = (
    CASE WHEN stats[2] = '{}'::JSONB THEN stats[1]
         ELSE stats[3]
    END) WHERE id = 1;

    

insert into test (player_id, timestamps, battlestamps, stats) VALUES (1500, ARRAY [2313], ARRAY [2332], '[ {"wins": 10} ]');


INSERT INTO testcom (player_id, username, numEntries, lastUpdate, timestamps, battlestamps) 
VALUES 
(12, 'Player4', 6, 26620833,  ARRAY [26534482, 26558482, 26586322, 26620136, 26611322, 26620882], ARRAY [1498, 1519, 1950, 2001, 2100, 2450]) returning *;


PGUSER=postgres
PGHOST=localhost
PGPASSWORD=12345noob
PGDATABASE=tomato
PGPORT=5432