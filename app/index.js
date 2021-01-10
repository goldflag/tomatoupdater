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


//compresses tank stats into more readable form
const IDupdater = require('./updater/IDupdater.js');
//daily update of player stats
const updater = require('./updater/updater.js');

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

app.get("/updateFiles", async (req, res) => {
    updateFiles();
    res.status(200).send(`updating`);
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
    
    // const arr = [];
    // for (let i = 0; i < IDs.length; ++i) {
    //     arr.push(IDs.rows[i].player_id);
    //     console.log(IDs.rows[i].player_id)
    //     if (i === IDs.length - 1) {
    //         let data = JSON.stringify(arr, null, 2);
    //         fs.writeFile(`${req.params.server}IDs.json`, data, (err) => {
    //             if (err) throw err;
    //             console.log(`${req.params.server}IDs.json Written`);
    //         });        
    //     }
    // }
    // console.log(arr);
    res.status(200).send(`downloaded`);
});

app.get("/update/:server", async (req, res) => {
    if (req.params.server === 'eu') updater("eu");
    else if (req.params.server === 'com') updater("com");
    else if (req.params.server === 'asia') updater("asia");
    res.status(200).send(`updating ${req.params.server}`);
});

app.get("/api/abcd/tankNames", async (req, res) => {
    res.status(200).json(tankNames);  
});

app.get("/api/abcd/WN8", async (req, res) => {
    res.status(200).json(WN8);
});
