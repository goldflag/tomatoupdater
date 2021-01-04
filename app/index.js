require("dotenv").config();
const express = require("express");
const db = require("./db");
const morgan = require("morgan");
const cron = require("node-cron");
const helmet = require('helmet');
const async  = require('express-async-await');
const fetch = require('node-fetch');
const { PerformanceObserver, performance } = require('perf_hooks');
const tankNames = require('./data/tankNames.json');
const WN8 = require('./data/wn8.json');
const app = express();

//compresses tank stats into more readable form
const tankStatsCompression = require('./functions/tankStatsCompression.js');
const IDupdater = require('./updater/IDupdater.js');
//daily update of player stats
const updater = require('./updater/updater.js');
const newPlayer = require('./playerstats/newPlayer.js');
const existingPlayer = require('./playerstats/existingPlayer.js')
const updateFiles = require('./functions/updateFiles.js');

const mastery = require('./gunmarks/mastery.js');
const MoE = require('./gunmarks/MoE.js');
const masteryTank = require('./gunmarks/masteryTank.js');
const MoETank = require('./gunmarks/MoETank.js');
const MoETracker = require('./gunmarks/MoETracker');

const APIKey = process.env.API_KEY;

app.use(morgan('dev'));
app.use(express.json());
app.use(helmet());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

//default port is 5000
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`server is up on ${port}`);
});

app.get("/updateFiles", async (req, res) => {
    updateFiles();
    res.status(200).send(`updating`);
});

app.get("/update/:server", async (req, res) => {
    if (req.params.server === 'eu') updater("eu");
    if (req.params.server === 'com') updater("com");
    res.status(200).send(`updating ${req.params.server}`);
});

cron.schedule("0 2 * * *", function() {
    console.log("Running Daily EU Update at 1:30AM EST");
    fetch(`https://tomatobackend-oswt3.ondigitalocean.app/update/eu`);
});

cron.schedule("30 9 * * *", function() {
    console.log("Running Daily NA Update at 8AM EST");
    fetch(`https://tomatobackend-oswt3.ondigitalocean.app/update/com`);
});

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

app.get("/api/abcd/tankNames", async (req, res) => {
    res.status(200).json(tankNames);  
});

app.get("/api/abcd/WN8", async (req, res) => {
    res.status(200).json(WN8);
});

// app.get("/api/abcd/serverpop/:server", async (req, res) => {
//     const servers = ['com', 'eu', 'ru', 'asia'];
//     if (!(servers.includes(server))) res.status(404).send('itsover');
// });

app.get("/api/abcd/moetracker/update", async (req, res) => {
    const servers = ['com', 'eu', 'ru', 'asia'];
    servers.forEach((server) => MoETracker(server, res));
    await MoETracker('com', res);
    await MoETracker('eu', res);
    await MoETracker('ru', res);
    await MoETracker('asia', res);

    res.status(200).send(`Updated moetracker`);

});

app.get("/api/abcd/moetracker/get/:server", async (req, res) => {
    const servers = ['com', 'eu', 'ru', 'asia'];
    if (servers.includes(req.params.server)) {
        const data = await db.query(`SELECT data FROM moetracker WHERE server = $1`, [req.params.server]);
        res.send(data.rows[0].data.data);
    } 
    else res.status(404).send('invalid server');
});

app.get("/api/abcd/moe/:server", async (req, res) => {
    return MoE(res, req.params.server);
});

app.get("/api/abcd/moetank/:id/:server", async (req, res) => {
    return MoETank(res, req.params.id, req.params.server);
});

app.get("/api/abcd/mastery/:server", async (req, res) => {
    return mastery(res, req.params.server);
});

app.get("/api/abcd/masterytank/:id/:server", async (req, res) => {
    return masteryTank(res, req.params.id, req.params.server);
});

app.get("/api/abcd/stats/tankstats", async (req, res) => {
    const data = await db.query(`SELECT overall FROM serverstats WHERE server = 'com'`);
    res.status(200).json(data.rows[0]);
});

app.get("/api/abcd/leaderboards/:type/:count", async (req, res) => {
    const types = ['wn8', 'winrate', 'battles', 'moecount', 'moe10'];
    if (req.params.type in types) res.status(404).send('itsover');
    else if (isNaN(req.params.count)) res.status(404).send('itsover num');
    else {
        console.log(req.params.type);
        const data = await db.query(`SELECT rank() OVER (ORDER BY ${req.params.type} DESC)rank, username, wn8, winrate, battles, avgtier, moecount, moe10, player_id from com_player WHERE battles > 5000 LIMIT $1`, [req.params.count]);
        res.status(200).json(data.rows);
    }
});

app.get("/api/abcd/leaderboards/custom/:type/:count/:mintier/:maxtier/:minbattles/:maxbattles/:minwn8/:maxwn8/:minwinrate/:maxwinrate", async (req, res) => {
    const types = ['wn8', 'winrate', 'battles', 'moecount', 'moe10', 'pr'];
    if (req.params.type in types) res.status(404).send('itsover');
    else if (isNaN(req.params.count)) res.status(404).send('itsover num');
    else {
        console.log(req.params.type);

        let querystr = `
        SELECT rank() OVER (ORDER BY ${req.params.type} DESC)rank, 
        username, wn8, winrate, battles, avgtier, moecount, moe10, player_id from com_player WHERE battles > 0`;
        if (req.params.mintier != 1) querystr += ` AND avgtier > ${req.params.mintier}`
        if (req.params.maxtier != 10) querystr += ` AND avgtier < ${req.params.maxtier}`
        if (req.params.minbattles != 0) querystr += ` AND battles > ${req.params.minbattles}`
        if (req.params.maxbattles != 999999) querystr += ` AND battles < ${req.params.maxbattles}`
        if (req.params.minwn8 != 0) querystr += ` AND wn8 > ${req.params.minwn8}`
        if (req.params.maxwn8 != 999999) querystr += ` AND wn8 < ${req.params.maxwn8}`
        if (req.params.minwinrate != 0) querystr += ` AND winrate > ${req.params.minwinrate}`
        if (req.params.maxwinrate != 100) querystr += ` AND winrate < ${req.params.maxwinrate}`

        querystr += ` LIMIT ${req.params.count}`
        const data = await db.query(querystr);
        res.status(200).json(data.rows);
    }
});

app.get("/api/abcd/:server/:id", async (req, res) => {
    try {
        await db.query(`UPDATE userCount SET count = count + 1 WHERE id = 1`);
        let currentTime = parseInt(Date.now()/60000);
        const server = req.params.server;
        const id = req.params.id;      

        let battles = 0;
        let stats = {};
        let data1;
        let data2;
        let data3;

        await Promise.all([
            fetch(`https://api.worldoftanks.${server}/wot/account/info/?application_id=${APIKey}&account_id=${id}`),
            fetch(`https://api.worldoftanks.${server}/wot/tanks/stats/?application_id=${APIKey}&account_id=${id}&fields=mark_of_mastery%2C+tank_id%2C+all`),
            fetch(`https://api.worldoftanks.${server}/wot/tanks/achievements/?application_id=${APIKey}&account_id=${id}&fields=achievements%2C+tank_id`)
        ])
        .then(([res1, res2, res3]) => Promise.all([res1.json(), res2.json(), res3.json()]))
        .then(([d1, d2, d3]) => 
        {
            data1 = d1;
            data2 = d2;
            data3 = d3;
        });
        //number of battles overall an account has
        battles = data1.data[id].statistics.all.battles;
        if (battles > 0) {
            //array of overall tank stats
            stats = data2.data[id];
            // compresses stats file to save storage space. Also calculates accurate total battles
            const compressedStats = tankStatsCompression(stats, currentTime, battles);
            const exists = await db.query(`SELECT * FROM dev${server} WHERE player_id = $1`, [id]);
            console.log(currentTime + ' ID: ' + id);
            // if player isn't already in the database, add to database and return empty stats
            if (!exists.rows[0]) newPlayer(res, id, stats, data1, currentTime, compressedStats, server, battles, stats, data3.data[id]);           
            // if player already exists in database, return recent stats
            else existingPlayer(res, currentTime, server, id, exists, compressedStats, stats, data3.data[id]); 
        }
    } catch(err) {
        console.log(err);
    }
});
