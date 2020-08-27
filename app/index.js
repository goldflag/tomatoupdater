require("dotenv").config();
const express = require("express");
const db = require("./db");
const morgan = require("morgan");
const helmet = require('helmet');
const async  = require('express-async-await')
const fetch = require('node-fetch')
const { PerformanceObserver, performance } = require('perf_hooks');

const app = express();

//compresses tank stats into more readable form
const tankStatsCompression = require('./functions/tankStatsCompression.js');
//gives index of which stats json snapshot to attach to return file
const recent24hr = require('./functions/Recent24hr.js');
const recent1week = require('./functions/Recent1week.js');
const recent30days = require('./functions/Recent30days.js');
const recent60days = require('./functions/Recent60days.js');
const recent1000 = require('./functions/Recent1000.js');
const recent500 = require('./functions/Recent500.js');

const APIKey = process.env.API_KEY;

app.use(morgan('dev'));
app.use(express.json());
app.use(helmet());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
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
*/

app.get("/api/abcd/:server/:id", async (req, res) => {
    try {
        let currentTime = parseInt(Date.now()/60000);
        console.log(currentTime)
        const server = req.params.server;
        const id = req.params.id;      

        let battles = 0;
        let stats = {};
        let fetch1 = await fetch(`https://api.worldoftanks.${server}/wot/account/info/?application_id=${APIKey}&account_id=${id}`);
        let fetch2 = await fetch(`https://api.worldoftanks.${server}/wot/tanks/stats/?application_id=${APIKey}&account_id=${id}&fields=mark_of_mastery%2C+tank_id%2C+all`);
        let data1 = await fetch1.json();
        let data2 = await fetch2.json();
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
            console.log('ID: ' + id);
            // if player isn't already in the database, add to database and return empty stats
            if (!exists.rows[0]) {
                const username = data1.data[id].nickname;
                // new array of timestamps
                const timeArr = [currentTime];
                // new array of battlestamps
                const battlesArr = [compressedStats.battles];
                // new array of tank stats snapshots
                const newEntry = [compressedStats];
                const newPlayer = await db.query(`INSERT INTO dev${server} (player_id, username, numEntries, lastUpdate, timestamps, battlestamps, stats) VALUES ($1, $2, $3, $4, $5, $6, $7) returning *`, 
                    [id, username, 1, currentTime, timeArr, battlesArr, newEntry]);
                res.status(200).json({ 
                    status: 'success', 
                    overall: 'frog',
                    recent24hr: 'frog',
                    recent1week: 'frog',
                    recent30days: 'frog',
                    recent60days: 'frog', 
                    recent1000: 'frog',
                    recent500: 'frog',
                });             
            }
            // if player already exists in database, return recent stats
            else {
                const numEntries = exists.rows[0].numentries;
                const timeArr = exists.rows[0].timestamps;
                const battlesArr = exists.rows[0].battlestamps;
                // returns the index of respective stats snapshots for each period
                const index24hr = recent24hr(numEntries, currentTime, timeArr);
                const index1week = recent1week(numEntries, currentTime, timeArr);
                const index30days = recent30days(numEntries, currentTime, timeArr);
                const index60days = recent60days(numEntries, currentTime, timeArr);
                const index1000 = recent1000(numEntries, compressedStats.battles, battlesArr);
                const index500 = recent500(numEntries, compressedStats.battles, battlesArr);

                const newJson = {"wins": 12};
                
                console.log('no update');
                console.log('battles dif: ' + (compressedStats.battles - battlesArr[battlesArr.length - 1]));
                // Only updates stats if account has played at least one game since last snapshot
                if (compressedStats.battles - battlesArr[battlesArr.length - 1] > 0) {
                    console.log('update happens');
                    await db.query(`UPDATE dev${server} SET numEntries = numEntries + 1 WHERE player_id = $1`, [id]);
                    await db.query(`UPDATE dev${server} SET lastUpdate = $1 WHERE player_id = $2`, [currentTime, id]);
                    await db.query(`UPDATE dev${server} SET timestamps = array_append(timestamps, $1) WHERE player_id = $2`, [currentTime, id]);
                    await db.query(`UPDATE dev${server} SET battlestamps = array_append(battlestamps, $1) WHERE player_id = $2`, [compressedStats.battles, id]);
                    await db.query(`UPDATE dev${server} SET stats = array_append(stats, $1) WHERE player_id = $2`, [compressedStats, id]);
                }
                // Removes oldest snapshot if it is more than 180 days old
                if (currentTime - timeArr[0] > 259200) {
                    console.log('delete old data');
                    try {
                        await db.query(`UPDATE dev${server} SET timeStamps = timeStamps[2:] WHERE player_id = $1`, [id]);
                        await db.query(`UPDATE dev${server} SET battleStamps = battleStamps[2:] WHERE player_id = $1`, [id]);
                        await db.query(`UPDATE dev${server} SET stats = stats[2:] WHERE player_id = $1`, [id]);
                        await db.query(`UPDATE dev${server} SET numEntries = numEntries - 1 WHERE player_id = $1`, [id]);
                    } catch(err) {
                        console.log(err);
                    }
                }
                res.status(200).json({ 
                    server: server,
                    username: exists.rows[0].username,
                    status: 'success', 
                    overall: compressedStats,
                    recent24hr: exists.rows[0].stats[index24hr] || 'frog',
                    recent1week: exists.rows[0].stats[index1week] || 'frog',
                    recent30days: exists.rows[0].stats[index30days] || 'frog',
                    recent60days: exists.rows[0].stats[index60days] || 'frog',
                    recent1000: exists.rows[0].stats[index1000] || 'frog',
                    recent500: exists.rows[0].stats[index500] || 'frog',
                }); 
            }   
        }
    } catch(err) {
        console.log(err);
    }
});












// app.get("/dummy", async (req, res) => {
//     res.status(200).json({ 
//         status: 'success', 
//         recent24hr: {},
//         recent1week: {},
//         recent30days: {},
//         recent60days: {},
//         recent1000: {},
//         recent500: {},
//         stats: {}
//     }); 

// });


// app.get("/Napi/com/:id/test", async (req, res) => {
//     const timeArr = [1000, 1541, 1678, 2210, 3810, 4000];
//     const battlesArr = [1200, 1701, 1750, 1800, 1998, 2001];
//     const stats2 = [{"period": "60 days"}, {"period": "1k"}, {"period": "30days"}, {"period": "1 week"}, {"period": "none"}, {"period": "500"}];
//     try {
//         const newPlayer = await db.query("INSERT INTO testcom (player_id, username, numEntries, lastUpdate, timestamps, battlestamps, stats) VALUES ($1, $2, $3, $4, $5, $6, $7) returning *", 
//         [8, 'tester', 6, 0, timeArr, battlesArr, stats2]);
//         res.send('success');
//     }
//     catch(err){
//         console.log(err);
//     }
// });

// app.get("/oldapi/:server/:id", async (req, res) => {
//     try {
//         let currentTime = parseInt(Date.now()/60000);

//         currentTime = 4001;
//         console.log(currentTime)
//         const server = req.params.server;
//         const id = req.params.id;      

//         let battles = 0;
//         let stats = {};
//         let fetch1 = await fetch(`https://api.worldoftanks.com/wot/account/info/?application_id=bd589e105895f2f6b8af31f27da3e05e&account_id=1011694618`);
//         let fetch2 = await fetch(`https://api.worldoftanks.com/wot/tanks/stats/?application_id=bd589e105895f2f6b8af31f27da3e05e&account_id=1011694618&fields=mark_of_mastery%2C+tank_id%2C+all`);
//         let data1 = await fetch1.json();
//         let data2 = await fetch2.json();
//         //number of battles overall an account has
//         battles = data1.data[1011694618].statistics.all.battles;
//         //array of overall tank stats
//         stats = data2.data[1011694618];
//         // console.log(stats);

//         const compressedStats = tankStatsCompression(stats, currentTime, battles);

//         const exists = await db.query("SELECT * FROM testcom WHERE player_id = $1", [id]);
//         console.log('ID: ' + id + ' exists: ' + exists.rows[0]);
//         if (!exists.rows[0]) {
//             const username = data1.data[1011694618].nickname;
//             console.log(username);

//             const timeArr = [currentTime];
//             const battlesArr = [battles];
//             const stats2 = [{"wins": 10}];
//             const newPlayer = await db.query("INSERT INTO testcom (player_id, username, numEntries, lastUpdate, timestamps, battlestamps, stats) VALUES ($1, $2, $3, $4, $5, $6, $7) returning *", 
//                 [id, username, 1, currentTime, timeArr, battlesArr, stats2]);

//             res.send('new account');
//         }
//         else {
//             const numEntries = exists.rows[0].numentries;
//             const timeArr = exists.rows[0].timestamps;
//             const battlesArr = exists.rows[0].battlestamps;

//             const index24hr = recent24hr(numEntries, currentTime, timeArr);
//             const index1week = recent1week(numEntries, currentTime, timeArr);
//             const index30days = recent30days(numEntries, currentTime, timeArr);
//             const index60days = recent60days(numEntries, currentTime, timeArr);

//             const index1000 = recent1000(numEntries, 2500, battlesArr);
//             const index500 = recent500(numEntries, 2500, battlesArr);

//             const newJson = {"wins": 12};
//             //console.log(exists.rows[0].stats);
//             if (currentTime - exists.rows[0].lastupdate > 0) {
//                 const updateEntries = await db.query("UPDATE testcom SET numEntries = numEntries + 1 WHERE player_id = $1", [id]);
//                 const updateTime = await db.query("UPDATE testcom SET lastUpdate = $1 WHERE player_id = $2", [currentTime, id]);
//                 const updateTimeArr = await db.query("UPDATE testcom SET timestamps = array_append(timestamps, $1) WHERE player_id = $2", [currentTime, id]);
//                 const updateBattlesArr = await db.query("UPDATE testcom SET battlestamps = array_append(battlestamps, $1) WHERE player_id = $2", [2500, id]);
//                 const updateStats = await db.query("UPDATE testcom SET stats = array_append(stats, $1) WHERE player_id = $2", [newJson, id]);
//             }

//             if (currentTime - timeArr[0] > 100) {
//                 console.log('fuark');
//                 try {
//                     await db.query(`UPDATE testcom SET timeStamps = timeStamps[2:] WHERE player_id = $1`, [id]);
//                     await db.query(`UPDATE testcom SET battleStamps = battleStamps[2:] WHERE player_id = $1`, [id]);
//                     await db.query(`UPDATE testcom SET stats = stats[2:] WHERE player_id = $1`, [id]);
//                     await db.query(`UPDATE testcom SET numEntries = numEntries - 1 WHERE player_id = $1`, [id]);
//                 } catch(err) {
//                     console.log('fuark' + err);
//                 }
//             }
    
//             res.status(200).json({ 
//                 status: 'success', 
//                 recent24hr: exists.rows[0].stats[index24hr] || 'frog',
//                 recent1week: exists.rows[0].stats[index1week] || 'frog',
//                 recent30days: exists.rows[0].stats[index30days] || 'frog',
//                 recent60days: exists.rows[0].stats[index60days] || 'frog',
//                 recent1000: exists.rows[0].stats[index1000] || 'frog',
//                 recent500: exists.rows[0].stats[index500] || 'frog',
//                 stats: exists.rows[0]
//             }); 
//         }   

//     } catch(err) {
//         console.log(err);
//     }
// });


// // get all restaurants
// app.get("/api/v1/getRestaurants", async (req, res) => {
//     try {
//         const results = await db.query("SELECT * FROM restaurants");
//         console.log(results);
//         res.status(200).json({ 
//             status: 'success', 
//             results: results.rows.length,
//             data: {
//                 restaurants: results.rows,
//             }
//         });    
//     } catch(err) {
//         console.log(err);
//     }
// });

// // add a new restaurant
// app.post("/api/v1/restaurants", async (req, res) => {
//     try {
//         const body = req.body;
//         const results = await db.query("INSERT INTO RESTAURANTS (name, location, price_range) VALUES ($1, $2, $3) returning *", [body.name, body.location, body.price_range]);
//         console.log(results);
//         res.status(201).json({ 
//             status: 'success', 
//             results: results.rows.length,
//             data: {
//                 restaurants: results.rows[0],
//             }
//         });    
//     } catch(err) {
//         console.log(err);
//     }
// });

// //update a restaurant
// app.put("/api/v1/restaurants/:id", async (req, res) => {
//     try {
//         const id = req.params.id;
//         const results = await db.query("UPDATE RESTAURANTS SET name = $2, location = $3, price_range = $4 WHERE id = $1 returning *", [id, req.body.name, req.body.location, req.body.price_range]);
//         console.log(results);
//         res.status(200).json({ 
//             status: 'success', 
//             data: {
//                 restaurants: results.rows[0],
//             }
//         });    
//     } catch(err) {
//         console.log(err);
//     }
// });

// //delete
// app.delete("/api/v1/restaurants/:id", async (req,res) => {
//     try {
//         const id = req.params.id;
//         const results = await db.query("DELETE FROM restaurants WHERE id = $1", [id]);
//         console.log(results);
//         res.status(204).json({ 
//             status: 'success', 
//         });    
//     } catch(err) {
//         console.log(err);
//     }
// })

//default port is 5000
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`server is up on ${port}`);
});