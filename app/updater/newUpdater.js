const db = require("../db");
const APIcall = require('./APIcall.js');

async function playerUpdater(server) {
    let IDs;

    if (server === "com") IDs = await db.query(`SELECT player_id from com.ids where active = true`); 
    else if (server === "eu") IDs = await db.query(`SELECT player_id from eu.ids where active = true`); 
    else if (server === "asia") IDs = await db.query(`SELECT player_id from asia.ids where active = true`); 
    IDs = IDs.rows;

    // if (server === "com") IDs = await db.query(`SELECT ids from ids where server = 'com'`); 
    // else if (server === "eu") IDs = await db.query(`SELECT ids from ids where server = 'eu'`); 
    // else if (server === "asia") IDs = await db.query(`SELECT ids from ids where server = 'asia'`); 
    // IDs = IDs.rows[0].ids;
    // console.log(IDs);

    let maxCount = 19;
    let count = 1;
    let total = IDs.length;
    let failcount = 0;
    for (let i = 0; i < IDs.length; ++i) {
        setTimeout(function () {
            if (i%200 === 0) console.log(`===TOTAL: ${i}, FAILCOUNT: ${failcount}===`);
            APIcall(count, server, IDs[i].player_id, failcount);
            count++;
            if (count == maxCount) {
                count = 1;
            }
        }, i * 30);
    }
}

module.exports = playerUpdater;