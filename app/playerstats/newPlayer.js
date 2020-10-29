const async  = require('express-async-await');
const db = require("../db");
//calculates wn8 of snapshot
const calculateWN8 = require('../functions/calculateWN8.js');


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

module.exports = newPlayer;