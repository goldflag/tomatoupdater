const fetch = require("node-fetch");
const HttpsProxyAgent = require('https-proxy-agent');
const db = require("../db");
const async  = require('express-async-await');

async function playerUpdater(server, type) {
    let IDs;
    // if (server === "com") IDs = await db.query(`SELECT player_id from idscom where active = true`); 
    // else if (server === "eu") IDs = await db.query(`SELECT player_id from idseu where active = true`); 
    // else if (server === "asia") IDs = await db.query(`SELECT player_id from idsasia where active = true`); 

    if (server === "com") IDs = await db.query(`SELECT ids from ids where server = 'com'`); 
    else if (server === "eu") IDs = await db.query(`SELECT ids from ids where server = 'eu'`); 
    else if (server === "asia") IDs = await db.query(`SELECT ids from ids where server = 'asia'`); 
    IDs = IDs.rows[0].ids;
    console.log(IDs);

    let maxCount = 22;
    if (type == "updater") maxCount = 19;

    let count = 1;
    for (let i = 0; i < IDs.length; ++i) {
        setTimeout(function () {
            APIcall(count, IDs[i]);
            count++;
            if (count == maxCount) {
                count = 1;
            }
        }, i * 25);
    }

    async function APIcall(count, id) {
        if (count === 10) console.log(id);
        await fetch(`https://tomato${type}${count}.herokuapp.com/update/${server}/${id}`);
    }
}

module.exports = playerUpdater;