const fetch = require("node-fetch");
// const NAids = require('./NAids.json');
const db = require("../db");
const async  = require('express-async-await');

async function playerUpdater(server) {
    let count = 1;
    let IDs;
    if (server === "com") IDs = await db.query(`SELECT ids FROM ids WHERE server = 'com'`); 
    else IDs = await db.query(`SELECT ids FROM ids WHERE server = 'eu'`); 
    IDs = IDs.rows[0].ids;
    console.log(IDs);
    console.log(IDs.length);

    for (let i = 0; i < IDs.length; ++i) {
        setTimeout(function () {
            // console.log(`count: ${i} id: ${IDs[i + 0]}`);
            APIcall(count, IDs[i + 0]);
            count++;
            if (count == 22) {
                count = 1;
            }
        }, i * 30);
    }

    async function APIcall(count, id) {
        // const res = await fetch(`http://localhost:5000/api/abcd/${server}/${id}`);
        if (Math.floor(Math.random() * Math.floor(500) === 1)) console.log(id);
        await fetch(`https://tomatoserver${count}.herokuapp.com/abcd/${server}/${id}`);
    }
}

module.exports = playerUpdater;