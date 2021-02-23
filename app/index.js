require("dotenv").config();
const express = require("express");
const db = require("./db");
const morgan = require("morgan");
const cron = require("node-cron");
const helmet = require('helmet');
const async  = require('express-async-await');
const fetch = require('node-fetch');
const tankNames = require('./data/tankNames.json');
const WN8 = require('./data/wn8.json');
const app = express();
const fs = require('fs');
//daily update of player stats
const newupdater = require('./updater/newUpdater.js');
//update 1 player for testing
const APIcall = require('./updater/APIcall.js');
//update recent stats leaderboard
const { recentsLeaderboard, recentsLeaderboardRank, recentTankAverages, tankRank, tankLeaderboards } = require('./cache/recentsLeaderboard');


const PRODUCTION = process.env.PRODUCTION;
const APIKey = process.env.API_KEY;

app.use(morgan('dev'));
app.use(express.json());
app.use(helmet());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

//default port is 5000
const port = process.env.PORT || 5005;
app.listen(port, () => {
    console.log(`server is up on ${port}`);
});

app.get("/downloadFiles/:server", async (req, res) => {
    let IDs;
    if (req.params.server === "com") IDs = await db.query(`SELECT player_id from idscom where active = true`); 
    else if (req.params.server === "eu") IDs = await db.query(`SELECT player_id from idseu where active = true`); 
    else if (req.params.server === "asia") IDs = await db.query(`SELECT player_id from idsasia where active = true`); 

    const arr = [];

    for (let i = 0; i < IDs.rowCount; ++i) {
        if (IDs.rows[i].player_id % 1000 === 0)
            console.log(IDs.rows[i].player_id);
            arr.push(IDs.rows[i].player_id);
        if (i === IDs.rowCount-1) {
            let data = JSON.stringify(arr, null, 2);
            await db.query(`UPDATE IDs SET ids = $1, size = $2 WHERE server = $3`, [arr, arr.length, req.params.server]);

            fs.writeFile(`./app/data/${req.params.server}IDs.json`, data, (err) => {
                if (err) throw err;
                console.log(`${req.params.server}IDs.json Written`);
            });

        }
    }
    res.status(200).send(`downloaded`);
});

function updateWN8(wn8) {
    let newWN8 = {};
    for (let i = 0; i < wn8.length; ++i) {
    newWN8[(wn8[i].IDNum).toString()] = {
            "expDef": wn8[i].expDef,
            "expFrag": wn8[i].expFrag,
            "expSpot": wn8[i].expSpot,
            "expDamage": wn8[i].expDamage,
            "expWinRate": wn8[i].expWinRate
        }
    }
    return newWN8;
}

cron.schedule("45 25 8 * * *", async function() {
    console.log("Running Daily WN8 and TankNames update");
    const wn8data = await fetch(`https://static.modxvm.com/wn8-data-exp/json/wn8exp.json`);
    let wn8 = await wn8data.json();
    wn8 = updateWN8(wn8.data);
    db.query(`UPDATE data SET data = $1 WHERE type = 'wn8'`, [JSON.stringify(wn8, null, 4)]);
    console.log(wn8);
    fs.writeFile("./app/data/wn8.json", JSON.stringify(wn8, null, 4), (err) => {
        if (err) {
            console.error(err);
            return;
        };
        console.log("File has been created");
    });

    console.log('updated WN8')
});

cron.schedule("45 50 13 * * *", async function() {
    const nationConv = {
        usa: "USA",
        china: "China",
        czech: "Czech",
        france: "France",
        germany: "Germany",
        italy: "Italy",
        japan: "Japan",
        poland: "Poland",
        sweden: "Sweden",
        uk: "UK",
        ussr: "USSR",
    };

    const classConv = {
        "lightTank": "LT",
        "mediumTank": "MT",
        "heavyTank": "HT",
        "AT-SPG": "TD",
        "SPG": "SPG"
    };

    const tankNamesData = await fetch(`https://api.worldoftanks.com/wot/encyclopedia/vehicles/?application_id=${APIKey}&fields=short_name%2C+tier%2C+type%2C+nation%2C+is_premium%2C+is_gift`);
    let tankNames = await tankNamesData.json();
    tankNames = tankNames.data;

    for (const key in tankNames) {
        let tankNamesQueryStr = `INSERT INTO tanknames (id, tier, type, nation, is_gift, is_premium, short_name) VALUES `;
        tankNamesQueryStr += `($1, $2, $3, $4, $5, $6, $7) `
        tankNamesQueryStr += `ON CONFLICT DO NOTHING`;
        await db.query(tankNamesQueryStr, [key, tankNames[key].tier, classConv[tankNames[key].type], nationConv[tankNames[key].nation], tankNames[key].is_gift, tankNames[key].is_premium, tankNames[key].short_name]);
    }

    await db.query(`UPDATE data SET data = $1 WHERE type = 'tanknames'`, [JSON.stringify(tankNames, null, 4)]);
    fs.writeFile("./app/data/tankNames.json", JSON.stringify(tankNames, null, 4), (err) => {
        if (err) {
            console.error(err);
            return;
        };
        console.log("File has been created");
    });
    console.log('updated tankNames');
});

// cron.schedule("0 1 19 * * *", async function() {
//     if (PRODUCTION === "TRUE") {
//         console.log("Running Daily recents leaderboard Update at 9:30PM EST");
//         const servers = ["com", "eu", "asia"];
//         const types = ["wn8", "winrate", "kd", "dpg"];
//         const times = [60];
//         const tiers = [6, 8];
//         for (w in servers) {
//             for (y in times) {
//                 recentTankAverages(servers[w], times[y]);
//                 for (x in types) {
//                     for (z in tiers) {
//                         await sleep(20000);
//                         recentsLeaderboard(servers[w], types[x], times[y], tiers[z]);
//                     }
//                 }
//             }
//         }

//         const types2 = ["wn8", "winrate", "kd", "dpg", "frags", "dmg_ratio", "battles"];
//         for (x in types2) {
//             for (y in servers) {
//                 await sleep(20000);
//                 recentsLeaderboardRank(servers[y], types2[x], 60);
//             }
//         }
//     }
// });

cron.schedule("0 5 22 * * *", function() {
    if (PRODUCTION === "TRUE") {
        console.log("Running Daily NA recents tank Update at 9:30PM EST");
        const servers = ["com", "eu", "asia"];
        // const types = ["wn8", "winrate", "dpg"];
        const types = ["dpg", "wn8", "frags", "winrate"];
        const times = [60, 30];
        for (y in servers) {
            for (x in types) {
                tankLeaderboards(servers[y], types[x], 60);
            }
            tankRank(servers[y], "dpg", 60);
        }
    }
});

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }   

cron.schedule("0 48 23 * * *", function() {
    if (PRODUCTION === "TRUE") {
        console.log("Running Daily EU Update at 9:30PM EST");
        newupdater("eu");
    }
});

cron.schedule("30 8 * * *", function() {
    if (PRODUCTION === "TRUE") {
        console.log("Running Daily NA Update at 7:30AM EST");
        newupdater("com");
    }
});

cron.schedule("30 17 * * *", function() {
    if (PRODUCTION === "TRUE") {
        console.log("Running Daily ASIA Update at 5:30PM EST");
        newupdater("asia");
    }
});

app.get("/updatePlayer/:server/:id", async (req, res) => {
    APIcall(1, req.params.server, req.params.id);
    res.status(200).send(`updating ${req.params.id}`);
});

app.get("/newupdate/:server", async (req, res) => {
    if (req.params.server === 'eu') newupdater("eu");
    else if (req.params.server === 'com') newupdater("com");
    else if (req.params.server === 'asia') newupdater("asia");
    res.status(200).send(`updating ${req.params.server}`);
});

app.get("/api/abcd/tankNames", async (req, res) => {
    res.status(200).json(tankNames);  
});

app.get("/api/abcd/WN8", async (req, res) => {
    res.status(200).json(WN8);
});


// APIcall(1, "com", 1002613089);
//APIcall(1, "com", 1011694618);