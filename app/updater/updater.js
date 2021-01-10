const fetch = require("node-fetch");
const db = require("../db");
const async  = require('express-async-await');

async function playerUpdater(server) {
    let IDs;
    if (server === "com") IDs = await db.query(`SELECT player_id from idscom where active = true`); 
    else if (server === "eu") IDs = await db.query(`SELECT player_id from idseu where active = true`); 
    else if (server === "asia") IDs = await db.query(`SELECT player_id from idsasia where active = true`); 

    console.log(IDs.rows.length);

    IDs = IDs.rows;

    let count = 1;
    for (let i = 0; i < IDs.length; ++i) {
        setTimeout(function () {
            // console.log(`count: ${i} id: ${IDs[i + 0]}`);
            APIcall(count, IDs[i + 0].player_id);
            count++;
            if (count == 22) {
                count = 1;
            }
        }, i * 30);
    }

    async function APIcall(count, id) {
        if (count === 20) console.log("id" + id);
        await fetch(`https://tomatoserver${count}.herokuapp.com/update/${server}/${id}`);
    }
}

module.exports = playerUpdater;