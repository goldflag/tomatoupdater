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

insert into test (player_id, timestamps, battlestamps, stats) VALUES (1500, ARRAY [2313], ARRAY [2332], '[ {"wins": 10} ]');


INSERT INTO testcom (player_id, username, numEntries, lastUpdate, timestamps, battlestamps) 
VALUES 
(12, 'Player4', 6, 26620833,  ARRAY [26534482, 26558482, 26586322, 26620136, 26611322, 26620882], ARRAY [1498, 1519, 1950, 2001, 2100, 2450]) returning *;


PGUSER=postgres
PGHOST=localhost
PGPASSWORD=12345noob
PGDATABASE=tomato
PGPORT=5432

CREATE TABLE tankStats (
    id SERIAL NOT NULL,
    server TEXT NOT NULL,
    overall JSONB,
    recent JSONB,
)


CREATE TABLE COM_player (
    id SERIAL NOT NULL,
    player_id INTEGER PRIMARY KEY,
    username VARCHAR(24) NOT NULL, 
    PR INTEGER NOT NULL,
    WN8 INTEGER NOT NULL,
    battles INTEGER NOT NULL,
    winrate REAL NOT NULL,
    avgTier REAL NOT NULL,
    MOEcount SMALLINT NOT NULL,
    MOE10 SMALLINT NOT NULL,
    MOE9 SMALLINT NOT NULL,
    MOE8 SMALLINT NOT NULL,
    MOE7 SMALLINT NOT NULL,
    MOE6 SMALLINT NOT NULL,
    MOE5 SMALLINT NOT NULL,
    TwoMOE SMALLINT NOT NULL,
    OneMOE SMALLINT NOT NULL,
    AceCount SMALLINT NOT NULL
);

CREATE TABLE comIDs (
    id SERIAL NOT NULL,
    player_id INTEGER PRIMARY KEY
);

CREATE TABLE ActivecomIDs (
    id SERIAL NOT NULL,
    player_id INTEGER PRIMARY KEY
);


CREATE TABLE ONA.OTank_1 (
    id SERIAL NOT NULL,
    player_id INTEGER PRIMARY KEY,
    username VARCHAR(24) NOT NULL, 
    battles INTEGER NOT NULL,
    winrate REAL NOT NULL,
    WN8 INTEGER NOT NULL,
    DPG SMALLINT NOT NULL,
    KPG REAL NOT NULL,
    spots REAL NOT NULL,
    XP SMALLINT NOT NULL,
    blocked SMALLINT NOT NULL,
    MOE SMALLINT NOT NULL,
    Mastery SMALLINT NOT NULL
);

CREATE TABLE ActiveNA_tank (
    id SERIAL NOT NULL,
    player_id INTEGER NOT NULL,
    username VARCHAR(24) NOT NULL, 
    battles INTEGER NOT NULL,
    wins INTEGER NOT NULL,
    draws INTEGER NOT NULL,
    damage INTEGER NOT NULL,
    WN8 INTEGER NOT NULL,
    frags INTEGER NOT NULL,
    survived INTEGER NOT NULL,
    cap INTEGER NOT NULL,
    def INTEGER NOT NULL,
    spots INTEGER NOT NULL,
    XP INTEGER NOT NULL,
    shots INTEGER NOT NULL,
    hits INTEGER NOT NULL,
    pens INTEGER NOT NULL,
    HEhits INTEGER NOT NULL,
    HEhitsRec INTEGER NOT NULL,
    blocked INTEGER NOT NULL,
    armorEff REAL NOT NULL,
    MOE INTEGER NOT NULL,
    Mastery INTEGER NOT NULL,

    WR REAL NOT NULL,
    DPG INTEGER NOT NULL,
    avgFrags REAL NOT NULL,
    avgSurvived REAL NOT NULL,
    avgCap REAL NOT NULL,
    avgDef REAL NOT NULL,
    avgSpots REAL NOT NULL,
    avgXP INTEGER NOT NULL,
    avgShots REAL NOT NULL,
    avgHits REAL NOT NULL,
    avgPens REAL NOT NULL,
    avgHEhits INTEGER NOT NULL,
    avgHEhitsRec INTEGER NOT NULL,
    avgBlocked INTEGER NOT NULL,
    KDratio REAL NOT NULL, 
    DMGratio REAL NOT NULL, 
);


    recBattles INTEGER NOT NULL,
    recWN8 INTEGER NOT NULL,
    recDPG INTEGER NOT NULL,
    recAvgFrags REAL NOT NULL,
    recAvgSurvived REAL NOT NULL,
    recAvgCap REAL NOT NULL,
    recAvgDef REAL NOT NULL,
    recAvgSpots REAL NOT NULL,
    recAvgXP INTEGER NOT NULL,
    recAvgShots REAL NOT NULL,
    recAvgHits REAL NOT NULL,
    recAvgpens REAL NOT NULL,
    recAvgHEhits INTEGER NOT NULL,
    recAvgHEhitsRec INTEGER NOT NULL,
    recAvgBlocked INTEGER NOT NULL,
    recAvgArmorEff REAL NOT NULL,
    recKDratio REAL NOT NULL, 
    recDMGratio REAL NOT NULL, 

"all": {
    "spotted": 105,
    "battles_on_stunning_vehicles": 0,
    "avg_damage_blocked": 0,
    "capture_points": 0,
    "explosion_hits": 11,
    "piercings": 310,
    "xp": 42908,
    "survived_battles": 8,
    "dropped_capture_points": 1,
    "damage_dealt": 72497,
    "hits_percents": 69,
    "draws": 0,
    "battles": 52,
    "damage_received": 43821,
    "frags": 47,
    "stun_number": 0,
    "direct_hits_received": 162,
    "stun_assisted_damage": 0,
    "hits": 412,
    "battle_avg_xp": 825,
    "wins": 27,
    "losses": 25,
    "piercings_received": 148,
    "no_damage_direct_hits_received": 9,
    "shots": 593,
    "explosion_hits_received": 20,
    "tanking_factor": 0
}
