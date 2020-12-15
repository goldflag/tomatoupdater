const calculateRecents = require('./calcRecents.js');

function sessionstats(stats, num) {
    const prunedStats = [];
    console.log(num);
    for (let i = num - 1; i >= 0; --i) {
        if ('date' in stats[i]) {
            prunedStats.push(stats[i]);
        }
    }
    // console.log(prunedStats);
    const sessions = [];
    for (let i = 1; i < prunedStats.length; ++i) {
        if (prunedStats[i-1].battles - prunedStats[i].battles > 0) {
            sessions.push(calculateRecents(prunedStats[i], prunedStats[i-1]));
        }
    }
    return sessions;
}

module.exports = sessionstats;