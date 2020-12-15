const calculateRecents = require('./calcRecents.js');

function sessionstats(stats, num) {
    let prunedStats = [];
    console.log(num);
    for (let i = num - 1; i >= 0; --i) {
        if ('date' in stats[i]) {
            prunedStats.push(stats[i].tankStats);
        }
    }
    let sessions = [];
    // console.log(prunedStats);
    for (let i = 1; i < prunedStats.length; ++i) {
        //console.log(prunedStats[i].battles + "/" + prunedStats[i-1].battles);
        if (prunedStats[i-1].battles - prunedStats[i].battles > 0) {
            // console.log(calculateRecents(stats[i-1], stats[i]))
            sessions.push(calculateRecents(prunedStats[i], prunedStats[i-1], true));
        }
    }
    return sessions;
}

module.exports = sessionstats;