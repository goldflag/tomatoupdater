const fetch = require("node-fetch");
const db = require("../db");
const tankNames = require('../data/tankNames.json');
const WN8 = require('../data/wn8.json');
const tankStatsCompression = require('../functions/tankStatsCompression.js');
const calculateWN8 = require('../functions/calculateWN8.js');
const calcWN8 = require('../functions/calcWN8.js');
const TEST = process.env.TEST;

const conv = {
    tank_id: 0,
    battles: 1,
    damage_dealt: 2,
    damage_received: 3,
    frags: 4,
    survived_battles: 5,
    wins: 6,
    losses: 7,
    draws: 8,
    capture_points: 9,
    dropped_capture_points: 10,
    xp: 11,
    spotted: 12,
    tanking_factor: 13,
    avg_damage_blocked: 14,
    shots: 15,
    hits: 16,
    piercings: 17
}

async function APIcall(count, server, id, failcount) {
    const file = await fetch(`https://tomatoupdater${count}.herokuapp.com/fetchPlayer/${server}/${id}`);
    //const file = await fetch(`http://localhost:5003/fetchPlayer/${server}/${id}`);
    try {
        let stats = await file.json();
        if (stats.status === "success") {
            const exists = await db.query(`SELECT player_id, username, lastsnapshot FROM ${server}data WHERE player_id = $1`, [id]);
            let currentTime = parseInt(Date.now()/60000);
            const compressedStats = tankStatsCompression(stats.tankStats, currentTime);
    
            stats.tankStats.sort((a, b) => Number(a[0]) - Number(b[0]));
            // if player isn't already in the database, add to database
            if (!exists.rows[0]) {
                newPlayer(stats.username, server, id, compressedStats, stats.tankStats);    
            }
            // if player already exists in database, update player
            else {
                existingPlayer(stats.username, currentTime, server, id, exists.rows[0], compressedStats, stats.tankStats);
            }   
        }
    }
    catch (err) {
        console.log(`Heroku Timeout: ${server} ${id}`);
        failcount++;
    }
}

async function newPlayer(username, server, id, compressedStats, stats) {
    console.log(`ADDED NEW ${server} PLAYER: ${username} | id: ${id}`);
    if (TEST == "FALSE") db.query(`INSERT INTO ${server}data (player_id, username, lastsnapshot, stats) VALUES ($1, $2, $3, $4)`, [id, username, compressedStats, []]);
    let c = stats;
    let queryStr = `INSERT INTO ${server}.tanks (player_id, tank_id, battles, wins, wn8, damage, damager, frags, survived, cap, decap, xp, shots, hits, spots) VALUES `;
    let anyBattles = false;
    for (i in c) {
        if (c[i][1] > 0 && c[i][0] in tankNames && c[i][0] in WN8) {
            anyBattles = true;
            // console.log(c[i]);
            const battles = c[i][conv.battles];
            const overallWN8 = calcWN8(c[i][conv.tank_id], c[i][conv.damage_dealt]/battles, c[i][conv.dropped_capture_points]/battles, c[i][conv.frags]/battles, c[i][conv.spotted]/battles, c[i][conv.wins]*100/battles)*c[i][conv.battles];
            queryStr += `(${id}, ${c[i][conv.tank_id]}, ${c[i][conv.battles]}, ${c[i][conv.wins]}, ${overallWN8}, ${c[i][conv.damage_dealt]}, ${c[i][conv.damage_received]}, ${c[i][conv.frags]}, 
                        ${c[i][conv.survived_battles]}, ${c[i][conv.capture_points]}, ${c[i][conv.dropped_capture_points]}, ${c[i][conv.xp]}, ${c[i][conv.shots]}, ${c[i][conv.hits]}, ${c[i][conv.spotted]}),`;    
        }
    }
    if (anyBattles) {
        queryStr = queryStr.slice(0, -1);
        if (TEST == "FALSE") db.query(queryStr);   
    }
}

async function existingPlayer(username, currentTime, server, id, exists, compressedStats, stats) {


    function reduceOverall(newEntry, n) {
        newEntry.battles = n.battles;
        newEntry.tier = n.tier;
        newEntry.wins = n.wins;
        newEntry.losses = n.losses;
        newEntry.draws = n.draws;
        newEntry.damage = n.damage;
        newEntry.damageR = n.damageR;
        newEntry.frags = n.frags;
        newEntry.destroyed = n.destroyed;
        newEntry.spotted = n.spotted;
        newEntry.cap = n.cap;
        newEntry.def = n.def;
        newEntry.xp = n.xp;
    }
    
    function reduceRecent(newEntry, n, o) {
        newEntry.battles = n.battles - o.battles;
        newEntry.tier = n.tier - o.tier;
        newEntry.wins = n.wins - o.wins;
        newEntry.losses = n.losses - o.losses;
        newEntry.draws = n.draws - o.draws;
        newEntry.damage = n.damage - o.damage;
        newEntry.damageR = n.damageR - o.damageR;
        newEntry.frags = n.frags - o.frags;
        newEntry.destroyed = n.destroyed - o.destroyed;
        newEntry.spotted = n.spotted - o.spotted;
        newEntry.cap = n.cap - o.cap;
        newEntry.def = n.def - o.def;
        newEntry.xp = n.xp - o.xp;
    }
    
    
    function reduceStats(n, o) {
        if (o.length <= n.length && n.length > 0 && o.length > 0) {
            const final = {
                period: [],
                overall: []
            };
            let j = 0;    
            for (let i = 0; i < o.length; i++) {
                if (j === n.length) break;
                if (o[i][0] != n[j][0]) {
                    final.period.push(n[j]);
                    final.overall.push(n[j]);
                    i--;  
                }
                else {
                    let nu = [];
                    if (n[j][1] - o[i][1] > 0) {
                        if (n[j][0] != o[i][0]) console.log("tankError");
                        else {
                            nu.push(n[j][0]);
                            for (let k = 1; k < 9; ++k) {
                                nu.push(n[j][k] - o[i][k]);
                            }
                        }
                        final.period.push(nu);
                        final.overall.push(n[j]);
                    }
                }
                j = j + 1;
            }
            for (j; j < n.length; ++j) {
                final.period.push(n[j]);
                final.overall.push(n[j]);
            }
            return final;
        }
        return [];
    }

    // Only updates stats if account has played at least one game since last snapshot
    if (compressedStats.battles === exists.lastsnapshot.battles) {
        console.log(`NO UPDATE ${server} PLAYER: ${username} | id: ${id} | battles: ${compressedStats.battles} | battles passed: ${compressedStats.battles - exists.lastsnapshot.battles} | time: ${currentTime - exists.lastsnapshot.time}`);
    }
    else {
        console.log(`UPDATED ${server} PLAYER: ${username} | id: ${id} | battles: ${compressedStats.battles} | battles passed: ${compressedStats.battles - exists.lastsnapshot.battles} | time: ${currentTime - exists.lastsnapshot.time}`);
        const newEntry = {
            // time: exists.lastsnapshot.time,
            time: currentTime,
            // date: exists.lastsnapshot.date || null,
            date: formatDate(currentTime * 60000),
            overall: {
                battles: 0,
                wn8: 0,
                tier: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                damage: 0,
                damageR: 0,
                frags: 0,
                deaths: 0,
                spotted: 0,
                cap: 0,
                def: 0,
                xp: 0,
            },
            recent: {
                battles: 0,
                tier: 0,
                wins: 0,
                losses: 0,
                draws: 0,
                damage: 0,
                damageR: 0,
                frags: 0,
                deaths: 0,
                spotted: 0,
                cap: 0,
                def: 0,
                xp: 0,
            },
            tankStats: {}
        }

        newEntry.overall.wn8 = calculateWN8(compressedStats.tankStats);
        reduceOverall(newEntry.overall, compressedStats);
        reduceRecent(newEntry.recent, compressedStats, exists.lastsnapshot);
        const reducedStats = reduceStats(compressedStats.tankStats, exists.lastsnapshot.tankStats);
        newEntry.tankStats = reducedStats.period;
        
        if (TEST == "FALSE") {
            db.query(
                `UPDATE ${server}data SET 
                lastsnapshot = $2,
                stats = array_append(stats, $3)
                WHERE player_id = $1`,
                [id, compressedStats, newEntry]);
        }

        let queryStr = `INSERT INTO ${server}.sessions (player_id, timestamp, tank_id, wn8, battles, damage, wins, frags, spots, decap, survived, damageR) VALUES `;
        let newStr = `INSERT INTO ${server}.tanks (player_id, tank_id, battles, wins, wn8, damage, damager, frags, survived, cap, decap, xp, shots, hits, spots) VALUES `
        let added = false;
        // console.log(newEntry.tankStats);
        for (i in reducedStats.period) {
            const tk = reducedStats.period[i];
            const ovTk = reducedStats.overall[i];
            // console.log(reducedStats.period[i]);
            if (tk[1] > 0 && tk[0] in WN8 && tk[0] in tankNames) {
                added = true;
                const wn8 = calcWN8(tk[0], tk[2]/tk[1], tk[6]/tk[1], tk[4]/tk[1], tk[5]/tk[1], tk[3]*100/tk[1])*tk[1];
                queryStr += `(${id}, ${currentTime}, ${tk[0]}, ${wn8}, ${tk[1]}, ${tk[2]}, ${tk[3]}, ${tk[4]}, ${tk[5]}, ${tk[6]}, ${tk[7]}, ${tk[8]}),`;
                const overallWN8 = calcWN8(ovTk[0], ovTk[2]/ovTk[1], ovTk[6]/ovTk[1], ovTk[4]/ovTk[1], ovTk[5]/ovTk[1], ovTk[3]*100/ovTk[1])*ovTk[1];
                newStr += `(${id}, ${ovTk[0]}, ${ovTk[1]}, ${ovTk[3]}, ${overallWN8}, ${ovTk[2]}, ${ovTk[8]}, ${ovTk[4]}, ${ovTk[7]}, 
                            ${ovTk[9]}, ${ovTk[6]}, ${ovTk[10]}, ${ovTk[11]}, ${ovTk[12]}, ${ovTk[5]}),`;
           }
        }
        if (added) {
            queryStr = queryStr.slice(0, -1);
            newStr = newStr.slice(0, -1);
            newStr += ` ON CONFLICT(tank_id, player_id) DO UPDATE SET
            battles = EXCLUDED.battles, wins = EXCLUDED.wins, wn8 = EXCLUDED.wn8, damage = EXCLUDED.damage, damager = EXCLUDED.damager, frags = EXCLUDED.frags, survived = EXCLUDED.survived, 
            cap = EXCLUDED.cap, decap = EXCLUDED.decap, xp = EXCLUDED.xp, shots = EXCLUDED.shots, hits = EXCLUDED.hits, spots = EXCLUDED.spots`;
            if (TEST == "FALSE") {
                db.query(queryStr);
                db.query(newStr);
                db.query(`INSERT INTO ${server}.sessiontotals (player_id, timestamp, battles, tier, wins, losses, draws, damage, damageR, frags, survived, spots, cap, decap, xp) VALUES 
                (${id}, ${currentTime}, ${newEntry.recent.battles}, ${newEntry.recent.tier}, ${newEntry.recent.wins}, ${newEntry.recent.losses}, ${newEntry.recent.draws}, ${newEntry.recent.damage}, 
                ${newEntry.recent.damageR}, ${newEntry.recent.frags}, ${newEntry.recent.battles - newEntry.recent.destroyed}, ${newEntry.recent.spotted}, ${newEntry.recent.cap}, ${newEntry.recent.def}, ${newEntry.recent.xp})`);
            }
        }
    }
}

function formatDate(date) {
    let d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
    return [year, month, day].join('-');
}

module.exports = APIcall;