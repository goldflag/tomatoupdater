const async  = require('express-async-await');
const db = require("../db");
//calculates wn8 of snapshot
const calculateWN8 = require('../functions/calculateWN8.js');
const calcOverall = require('../functions/calcOverall.js');
//calculates recent stats
const calcRecents = require('../functions/calcRecents.js');
async function newPlayer(res, id, stats, data1, currentTime, compressedStats, server, battles, stats, moeData) {
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

    const recents = {
        recent24hr: calcRecents(compressedStats, compressedStats),
        recent3days: calcRecents(compressedStats, compressedStats),
        recent7days: calcRecents(compressedStats, compressedStats),
        recent30days: calcRecents(compressedStats, compressedStats),
        recent60days: calcRecents(compressedStats, compressedStats),
        recent1000: calcRecents(compressedStats, compressedStats),
        recent100: calcRecents(compressedStats, compressedStats),
    }

    const overallStats = calcOverall(stats, moeData);
    res.status(200).json({ 
        status: 'success', 
        linegraph: [],
        overall: compressedStats,
        overallStats: overallStats,
        sessions: [],
        recents: recents
    });  
}

module.exports = newPlayer;