const tankNames = require('../data/tankNames.json');
const wn8 = require('../data/wn8.json');

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

// compresses 100kb stats file into 7-8kb 
function tankStatsCompression(stats, time) {
    const date = new Date();
    let newStats = {
        tankStats: [], 
        time: time,
        date: formatDate(date),
        battles: 0,
        tier: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        damage: 0,
        damageR: 0,
        frags: 0,
        destroyed: 0,
        spotted: 0,
        cap: 0,
        def: 0,
        xp: 0,
        shots: 0,
        hits: 0,
        piercings: 0
    };
    stats.map((row) => { 
        if (row[conv.tank_id] in tankNames && row[conv.tank_id] in wn8) {
            const tankStat = [
                row[conv.tank_id],
                row[conv.battles],
                row[conv.damage_dealt],
                row[conv.wins],
                row[conv.frags],
                row[conv.spotted],
                row[conv.dropped_capture_points],
                row[conv.survived_battles],
                row[conv.damage_received],
                row[conv.capture_points],
                row[conv.xp],
                row[conv.shots],
                row[conv.hits]
            ];
            newStats.tankStats.push(tankStat);
            newStats.battles += row[conv.battles];
            newStats.tier += tankNames[row[conv.tank_id]]['tier']*row[conv.battles];
            newStats.wins += row[conv.wins];
            newStats.losses += row[conv.losses];
            newStats.draws += row[conv.draws];
            newStats.damage += row[conv.damage_dealt];
            newStats.damageR += row[conv.damage_received];
            newStats.frags += row[conv.frags];
            newStats.destroyed += row[conv.battles] - row[conv.survived_battles];
            newStats.spotted += row[conv.spotted];
            newStats.cap += row[conv.capture_points];
            newStats.def += row[conv.dropped_capture_points];
            newStats.xp += row[conv.xp];
            newStats.shots += row[conv.shots];
            newStats.hits += row[conv.hits];
            newStats.piercings += row[conv.piercings];
        }
    });
    newStats.tankStats.sort((a, b) => Number(a[0]) - Number(b[0]));
    // newStats.tankStats.forEach((row) => {
    //     if (row[0] === 65073) console.log("Fsddf")
    // })
    return newStats;
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

module.exports = tankStatsCompression;