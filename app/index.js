require("dotenv").config();
const express = require("express");
const db = require("./db");
const morgan = require("morgan");
const cron = require("node-cron");
const helmet = require('helmet');
const async  = require('express-async-await')
const fetch = require('node-fetch')
const { PerformanceObserver, performance } = require('perf_hooks');
const tankNames = require('./data/tankNames.js');
const WN8 = require('./data/wn8.js');

const app = express();

//compresses tank stats into more readable form
const tankStatsCompression = require('./functions/tankStatsCompression.js');
//calculates wn8 of snapshot
const calculateWN8 = require('./functions/calculateWN8.js');
//calculates snapshot index closest to certain time
const recentTime = require('./functions/RecentTime.js');
//calculates snapshot index closest to certain num of battles
const recentBattles = require('./functions/RecentBattles.js');
const activeUpdater = require('./updater/activeUpdater.js');
//daily update of player stats
const updater = require('./updater/updater.js');

const APIKey = process.env.API_KEY;

app.use(morgan('dev'));
app.use(express.json());
app.use(helmet());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

cron.schedule("29 * * *", function() {
    console.log("Running NA Update at 3:27am");
    //activeUpdater();
    updater();
}, { timezone: "America/New_York" }
);

/*
There are 4 tables for the servers NA, EU, RU, and ASIA named devcom, deveu, devru, and devasia
SCHEMA OF TABLE FOR EACH SERVER:
    CREATE TABLE [tablename] (
        id serial NOT NULL,
        player_id INTEGER NOT NULL PRIMARY KEY, 
        username VARCHAR(24) NOT NULL, 
        numEntries INTEGER NOT NULL,
        lastUpdate INTEGER NOT NULL,
        timeStamps INTEGER[],
        battleStamps INTEGER[],
        stats JSONB[]
        linegraph JSONB[]
    );
    KEY: 
    id -> serial ID
    player_id -> Wargaming ID of player
    username -> username of player
    numEntries -> number of stat snapshots 
    lastUpdate -> time of the most recent snapshot
    timestamps -> array of times for each snapshot from oldest to newest
    battleStamps -> array of num battles for each snapshot from oldest to newest
    stats -> array of stats json files from tankStatsCompresion.js
    linegraph -> WN8/WR/DPG history for charts
*/

app.get("/api/abcd/:file", async (req, res) => {
    if (req.params.server === 'tankNames') res.status(200).json(tankNames);  
    else res.status(200).json(WN8);
});

app.get("/api/abcd/:server/:id", async (req, res) => {
    try {
        let currentTime = parseInt(Date.now()/60000);
        const server = req.params.server;
        const id = req.params.id;      

        let battles = 0;
        let stats = {};
        let data1;
        let data2;
        await Promise.all([
            fetch(`https://api.worldoftanks.${server}/wot/account/info/?application_id=${APIKey}&account_id=${id}`),
            fetch(`https://api.worldoftanks.${server}/wot/tanks/stats/?application_id=${APIKey}&account_id=${id}&fields=mark_of_mastery%2C+tank_id%2C+all`),
        ])
        .then(([res1, res2]) => Promise.all([res1.json(), res2.json()]))
        .then(([d1, d2]) => 
        {
            data1 = d1;
            data2 = d2;
        });
        //number of battles overall an account has
        battles = data1.data[id].statistics.all.battles;
        if (battles > 0) {
            //array of overall tank stats
            stats = data2.data[id];

            var t0 = performance.now()
            // compresses stats file to save storage space. Also calculates accurate total battles
            const compressedStats = tankStatsCompression(stats, currentTime, battles);
            var t1 = performance.now()
            //console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.")

            const exists = await db.query(`SELECT * FROM dev${server} WHERE player_id = $1`, [id]);
            console.log(currentTime + ' ID: ' + id);
            // if player isn't already in the database, add to database and return empty stats
            if (!exists.rows[0]) {
                newPlayer(res, id, stats, data1, currentTime, compressedStats, server, battles);           
            }
            // if player already exists in database, return recent stats
            else {
                exitingPlayer(res, stats, data1, currentTime, server, id, exists, compressedStats, battles); 
            }   
        }
    } catch(err) {
        console.log(err);
    }
});

async function newPlayer(res, id, stats, data1, currentTime, compressedStats, server, battles) {
    const WN8 = calculateWN8(stats);
    const winrate = (data1.data[id].statistics.all.wins/battles);
    const avgDamage = (data1.data[id].statistics.all.damage_dealt/battles);
    console.log(`wn8: ${WN8} winrate: ${winrate} avgDamage: ${avgDamage}`);
    const username = data1.data[id].nickname;
    // new array of timestamps
    const timeArr = [currentTime];
    // new array of battlestamps
    const battlesArr = [compressedStats.battles];
    // new array of tank stats snapshots
    const newEntry = [compressedStats];
    // new array for line graph progression charts WN8/Winrate/DPG
    const newLine = JSON.stringify([
        battles,
        WN8,
        winrate,
        avgDamage
    ]);

    const newLineIns = [newLine];
    const newPlayer = await db.query(`INSERT INTO dev${server} (player_id, username, numEntries, lastUpdate, timestamps, battlestamps, stats, linegraph) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning *`, 
        [id, username, 1, currentTime, timeArr, battlesArr, newEntry, newLineIns]);
    res.status(200).json({ 
        status: 'success', 
        overall: 'frog',
        linegraph: [],
        recent24hr: 'frog',
        recent1week: 'frog',
        recent30days: 'frog',
        recent60days: 'frog', 
        recent1000: 'frog',
        recent500: 'frog',
    });  
}

async function exitingPlayer(res, stats, data1, currentTime, server, id, exists, compressedStats, battles) {
    const numEntries = exists.rows[0].numentries;
    const timeArr = exists.rows[0].timestamps;
    const battlesArr = exists.rows[0].battlestamps;
    // returns the index of respective stats snapshots for each period
    const index24hr = recentTime(exists.rows[0].stats, numEntries, currentTime, timeArr, 1440);
    const index3days = recentTime(exists.rows[0].stats, numEntries, currentTime, timeArr, 4320);
    const index1week = recentTime(exists.rows[0].stats, numEntries, currentTime, timeArr, 10800);
    const index30days = recentTime(exists.rows[0].stats, numEntries, currentTime, timeArr, 43200);
    const index1000 = recentBattles(exists.rows[0].stats, numEntries, compressedStats.battles, battlesArr, 1000);
    const index500 = recentBattles(exists.rows[0].stats, numEntries, compressedStats.battles, battlesArr, 100);

    console.log('battles dif: ' + (compressedStats.battles - battlesArr[battlesArr.length - 1]));
    // Only updates stats if account has played at least one game since last snapshot
    if ((compressedStats.battles - battlesArr[battlesArr.length - 1] > 0) || (currentTime - timeArr[timeArr.length - 1] > 0)) {
        console.log(`update happens battles passed:  ${compressedStats.battles - battlesArr[battlesArr.length - 1]} time:  ${currentTime - timeArr[timeArr.length - 1]}`);
        const numBattles = compressedStats.battles;
        let newCompressed = compressedStats;
        if (compressedStats.battles - battlesArr[battlesArr.length - 1] === 0) {
            newCompressed = {};
        }
        await db.query(
            `UPDATE dev${server} SET 
            numEntries = numEntries + 1, 
            lastUpdate = $2,
            timestamps = array_append(timestamps, $2),
            battlestamps = array_append(battlestamps, $3),
            stats = array_append(stats, $4)
            WHERE player_id = $1`,
            [id, currentTime, numBattles, newCompressed]);
        }
    if (compressedStats.battles - battlesArr[battlesArr.length - 1] > 10) {
        const WN8 = calculateWN8(stats);
        //console.log(`wn8: ${WN8}`);
        const winrate = (data1.data[id].statistics.all.wins/battles);
        //console.log(`winrate: ${winrate}`);
        const avgDamage = (data1.data[id].statistics.all.damage_dealt/battles);
        //console.log(`avgDamage: ${avgDamage}`);
        const newLineIns = JSON.stringify([
            battles,
            WN8,
            winrate,
            avgDamage
        ]);
        await db.query(`UPDATE dev${server} SET linegraph = array_append(linegraph, $2) WHERE player_id = $1`, [id, newLineIns])

    }
    // Removes oldest snapshot if it is more than 180 days old
    if (currentTime - timeArr[0] > 259200) {
        console.log('delete old data');
        if (exists.rows[0].stats.length > 3) {
            try {
                await db.query(`
                UPDATE dev${server} 
                    SET stats[2] = (
                        CASE WHEN stats[2] = '{}'::JSONB THEN stats[1]
                        ELSE stats[2]
                    END )
                WHERE player_id = $1;`, [id]);
            } catch(err) {
                console.log(err);
            }
            try {
                await db.query(`UPDATE dev${server} SET 
                timeStamps = timeStamps[2:],
                battleStamps = battleStamps[2:],
                stats = stats[2:],
                numEntries = numEntries - 1
                WHERE player_id = $1`, [id]);
            } catch(err) {
                console.log(err);
            }
        }
    }

    res.status(200).json({ 
        server: server,
        username: exists.rows[0].username,
        status: 'success', 
        linegraph: exists.rows[0].linegraph,
        overall: compressedStats,
        recent24hr: exists.rows[0].stats[index24hr] || 'frog',
        recent1week: exists.rows[0].stats[index3days] || 'frog',
        recent30days: exists.rows[0].stats[index1week] || 'frog',
        recent60days: exists.rows[0].stats[index30days] || 'frog',
        recent1000: exists.rows[0].stats[index1000] || 'frog',
        recent500: exists.rows[0].stats[index500] || 'frog',
        // test: exists.rows[0].stats[exists.rows[0].stats.length - 1]
        test: exists.rows[0].stats

    });
}

//default port is 5000
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`server is up on ${port}`);
});