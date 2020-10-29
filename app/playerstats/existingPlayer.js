const async  = require('express-async-await');
const db = require("../db");
//calculates snapshot index closest to certain time
const recentTime = require('../functions/RecentTime.js');
//calculates snapshot index closest to certain num of battles
const recentBattles = require('../functions/RecentBattles.js');

async function existingPlayer(res, stats, data1, currentTime, server, id, exists, compressedStats, battles) {
    const numEntries = exists.rows[0].numentries;
    const timeArr = exists.rows[0].timestamps;
    const battlesArr = exists.rows[0].battlestamps;
    // returns the index of respective stats snapshots for each period
    const index24hr = recentTime(exists.rows[0].stats, numEntries, currentTime, timeArr, 1740);
    const index3days = recentTime(exists.rows[0].stats, numEntries, currentTime, timeArr, 4720);
    const index1week = recentTime(exists.rows[0].stats, numEntries, currentTime, timeArr, 10800);
    const index30days = recentTime(exists.rows[0].stats, numEntries, currentTime, timeArr, 43200);
    // const index24hr = recentTime(exists.rows[0].stats, numEntries, currentTime, timeArr, 3500);
    // const index3days = recentTime(exists.rows[0].stats, numEntries, currentTime, timeArr, 4320);
    // const index1week = recentTime(exists.rows[0].stats, numEntries, currentTime, timeArr, 12800);
    // const index30days = recentTime(exists.rows[0].stats, numEntries, currentTime, timeArr, 43200);

    const index1000 = recentBattles(exists.rows[0].stats, numEntries, compressedStats.battles, battlesArr, 1000);
    const index500 = recentBattles(exists.rows[0].stats, numEntries, compressedStats.battles, battlesArr, 100);

    console.log('battles dif: ' + (compressedStats.battles - battlesArr[battlesArr.length - 1]));
    // Only updates stats if account has played at least one game since last snapshot
    if ((compressedStats.battles - battlesArr[battlesArr.length - 1] > 0) || (currentTime - timeArr[timeArr.length - 1] > 360)) {
        console.log(`update happens battles passed:  ${compressedStats.battles - battlesArr[battlesArr.length - 1]} time:  ${currentTime - timeArr[timeArr.length - 1]}`);
        const numBattles = compressedStats.battles;
        let newCompressed = compressedStats;
        if (compressedStats.battles - battlesArr[battlesArr.length - 1] === 0) {
            newCompressed = {};
        }
        await db.query(
            `UPDATE dev${server} SET 
            numEntries = numEntries + 1, 
            lastUpdate = $2,
            timestamps = array_append(timestamps, $2),
            battlestamps = array_append(battlestamps, $3),
            stats = array_append(stats, $4)
            WHERE player_id = $1`,
            [id, currentTime, numBattles, newCompressed]);
        }
    // if (compressedStats.battles - battlesArr[battlesArr.length - 1] > 10) {
    //     const WN8 = calculateWN8(stats);
    //     //console.log(`wn8: ${WN8}`);
    //     const winrate = (data1.data[id].statistics.all.wins/battles);
    //     //console.log(`winrate: ${winrate}`);
    //     const avgDamage = (data1.data[id].statistics.all.damage_dealt/battles);
    //     //console.log(`avgDamage: ${avgDamage}`);
    //     const newLineIns = JSON.stringify([
    //         battles,
    //         WN8,
    //         winrate,
    //         avgDamage
    //     ]);
    //     await db.query(`UPDATE dev${server} SET linegraph = array_append(linegraph, $2) WHERE player_id = $1`, [id, newLineIns])
    // }
    // Removes oldest snapshot if it is more than 180 days old
    if (currentTime - timeArr[0] > 259200) {
        console.log('delete old data');
        if (exists.rows[0].stats.length > 3) {
            try {
                await db.query(`
                UPDATE dev${server} 
                    SET stats[2] = (
                        CASE WHEN stats[2] = '{}'::JSONB THEN stats[1]
                        ELSE stats[2]
                    END )
                WHERE player_id = $1;`, [id]);
            } catch(err) {
                console.log(err);
            }
            try {
                await db.query(`UPDATE dev${server} SET 
                timeStamps = timeStamps[2:],
                battleStamps = battleStamps[2:],
                stats = stats[2:],
                numEntries = numEntries - 1
                WHERE player_id = $1`, [id]);
            } catch(err) {
                console.log(err);
            }
        }
    }

    console.log('index 24hr: ' + index24hr);
    console.log('index 500: ' + index500);

    console.log('timestamps ct: ' + exists.rows[0].timestamps.length);
    console.log('timestamps: ' + exists.rows[0].timestamps);
    res.status(200).json({ 
        server: server,
        username: exists.rows[0].username,
        status: 'success', 
        linegraph: exists.rows[0].linegraph,
        overall: compressedStats,
        recent24hr: exists.rows[0].stats[index24hr] || 'frog',
        recent1week: exists.rows[0].stats[index3days] || 'frog',
        recent30days: exists.rows[0].stats[index1week] || 'frog',
        recent60days: exists.rows[0].stats[index30days] || 'frog',
        recent1000: exists.rows[0].stats[index1000] || 'frog',
        recent500: exists.rows[0].stats[index500] || 'frog',
        // test: exists.rows[0].stats[exists.rows[0].stats.length - 1]
        test: exists.rows[0].stats
    });
}

module.exports = existingPlayer;