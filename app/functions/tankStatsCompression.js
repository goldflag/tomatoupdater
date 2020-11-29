const tankNames = require('../data/tankNames.json');

// compresses 100kb stats file into 7-8kb 
function tankStatsCompression(stats, time, battles) {
    let newStats = {
        tankStats: [], 
        time: time,
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
    };
    stats.map((row) => { 
        if (row.tank_id in tankNames) {
            const tankStat = [
                row.tank_id,
                row.all.battles,
                row.all.damage_dealt,
                row.all.wins,
                row.all.frags,
                row.all.spotted,
                row.all.dropped_capture_points,
                row.all.survived_battles,
                row.all.damage_received,
            ];
            newStats.tankStats.push(tankStat);
            newStats.battles += row.all.battles;
            newStats.tier += tankNames[row.tank_id]['tier']*row.all.battles;
            newStats.wins += row.all.wins;
            newStats.losses += row.all.losses;
            newStats.draws += row.all.draws;
            newStats.damage += row.all.damage_dealt;
            newStats.damageR += row.all.damage_received;
            newStats.frags += row.all.frags;
            newStats.deaths += row.all.battles - row.all.survived_battles;
            newStats.spotted += row.all.spotted;
            newStats.cap += row.all.capture_points;
            newStats.def += row.all.dropped_capture_points;
            newStats.xp += row.all.xp;
        }
    });
    newStats.tankStats.sort((a, b) => Number(a[0]) - Number(b[0]));
    return newStats;
}

module.exports = tankStatsCompression;