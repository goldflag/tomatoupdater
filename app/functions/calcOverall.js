const tankNames = require('../data/tankNames.json');
const WN8 = require('../data/wn8.json');
const CDF = require('../data/CDF.json');
const jStat = require('jstat');
const Conversion = require('../data/conversion.json');
const nationConversion = require('../data/nationConversion.json');

const oldtanksNames = {
    405: {
        "is_gift": false,
        "short_name": "WT auf E 100",
        "nation": "germany",
        "is_premium": false,
        "tier": 10,
        "type": "AT-SPG"
    },
    447: {
        "is_gift": false,
        "short_name": "Obj. 263",
        "nation": "ussr",
        "is_premium": false,
        "tier": 10,
        "type": "AT-SPG"
    }
}

const oldtanksWN8 = {
    405: {
        "IDNum": 16913,
        "expDef": 0.73,
        "expFrag": 1.267,
        "expSpot": 0.474,
        "expDamage": 2155.153,
        "expWinRate": 48.735
    },
    447: {
        "IDNum": 21249,
        "expDef": 0.578,
        "expFrag": 0.964,
        "expSpot": 0.854,
        "expDamage": 1684.867,
        "expWinRate": 52.093
    }
}

function WN8Final(rDAMAGE, rSPOT, rFRAG, rDEF, rWIN) {
    const rWINc    = Math.max(0,                          (rWIN    - 0.71) / (1 - 0.71) );
    const rDAMAGEc = Math.max(0,                          (rDAMAGE - 0.22) / (1 - 0.22) );
    const rFRAGc   = Math.max(0, Math.min(rDAMAGEc + 0.2, (rFRAG   - 0.12) / (1 - 0.12)));
    const rSPOTc   = Math.max(0, Math.min(rDAMAGEc + 0.1, (rSPOT   - 0.38) / (1 - 0.38)));
    const rDEFc    = Math.max(0, Math.min(rDAMAGEc + 0.1, (rDEF    - 0.10) / (1 - 0.10)));
    const WN8 = 980*rDAMAGEc + 210*rDAMAGEc*rFRAGc + 155*rFRAGc*rSPOTc + 75*rDEFc*rFRAGc + 145*Math.min(1.8,rWINc);
    return WN8;
}

function calculateWN8(id, avgDamage, avgDef, avgFrag, avgSpots, winrate) {
    const exp = WN8[id] || oldtanksWN8[id];
    const rDAMAGE = avgDamage / exp.expDamage;
    const rSPOT   = avgSpots  / exp.expSpot;
    const rFRAG   = avgFrag   / exp.expFrag;
    const rDEF    = avgDef    / exp.expDef;
    const rWIN    = winrate   / exp.expWinRate;
    return WN8Final(rDAMAGE, rSPOT, rFRAG, rDEF, rWIN);
}

function calcOverall(stats, MOEstats) {

    let weighedExpDamage = 0;
    let weighedExpSpots = 0;
    let weighedExpFrag = 0;
    let weighedExpDef = 0;
    let weighedExpWinrate = 0;

    let weighedDamage = 0
    let weighedSpots = 0;
    let weighedFrag = 0;
    let weighedDef = 0;
    let weighedWinrate = 0;

    function calculateWeighedOverall(id, damage, def, frag, spots, wins, battles) {
        const exp = WN8[id] || oldtanksWN8[id];

        weighedExpDamage += battles*exp.expDamage;
        weighedExpSpots += battles*exp.expSpot;
        weighedExpFrag += battles*exp.expFrag;    
        weighedExpDef += battles*exp.expDef;    
        weighedExpWinrate += battles*exp.expWinRate;
    
        weighedDamage += damage;
        weighedSpots += spots;
        weighedFrag += frag;
        weighedDef += def;
        weighedWinrate += 100*wins;
    }
    
    function calculateOverallWN8() {
        const rDAMAGE = weighedDamage / weighedExpDamage;
        const rSPOT   = weighedSpots  / weighedExpSpots;
        const rFRAG   = weighedFrag   / weighedExpFrag;
        const rDEF    = weighedDef    / weighedExpDef;
        const rWIN    = weighedWinrate   / weighedExpWinrate;
        jsonStats.expectedRatios[0].player = (rDAMAGE).toFixed(2);
        jsonStats.expectedRatios[1].player = (rSPOT).toFixed(2);
        jsonStats.expectedRatios[2].player = (rFRAG).toFixed(2);
        jsonStats.expectedRatios[3].player = (rDEF).toFixed(2);
        jsonStats.expectedRatios[4].player = (rWIN).toFixed(2);
        return parseInt(WN8Final(rDAMAGE, rSPOT, rFRAG, rDEF, rWIN));
    }
    
    let counter = 0;
    let jsonStats = {
        battles: 0,
        overallWN8: 0,
        avgTier: 0,
        expectedRatios : [
            { 'stat': "rDAMAGE", 'player': 0 },
            { 'stat': "rSPOT", 'player': 0 },
            { 'stat': "rFRAG", 'player': 0 },
            { 'stat': "rDEF", 'player': 0 },
            { 'stat': "rWIN", 'player': 0 }
        ],
        tankWN8: [],
        radar: {
            "rDAMAGE" : 0,
            "rSPOT" : 0,
            "rFRAG" : 0,
            "rDEF" : 0,
            "rWIN" : 0
        },
        tierMoeDist: [
            { "Tier": "V", "0" : 0, "1" : 0, "2" : 0, "3" : 0},
            { "Tier": "VI", "0" : 0, "1" : 0, "2" : 0, "3" : 0},
            { "Tier": "VII", "0" : 0, "1" : 0, "2" : 0, "3" : 0},
            { "Tier": "VIII", "0" : 0, "1" : 0, "2" : 0, "3" : 0},
            { "Tier": "IX", "0" : 0, "1" : 0, "2" : 0, "3" : 0},
            { "Tier": "X", "0" : 0, "1" : 0, "2" : 0, "3" : 0},
        ],
        tierMasteryDist : [
            { "Tier": "I", "None": 0, "3rd": 0, "2nd": 0, "1st": 0, "Ace": 0 },
            { "Tier": "II", "None": 0, "3rd": 0, "2nd": 0, "1st": 0, "Ace": 0 },
            { "Tier": "III", "None": 0, "3rd": 0, "2nd": 0, "1st": 0, "Ace": 0 },
            { "Tier": "IV", "None": 0, "3rd": 0, "2nd": 0, "1st": 0, "Ace": 0 },
            { "Tier": "V", "None": 0, "3rd": 0, "2nd": 0, "1st": 0, "Ace": 0 },
            { "Tier": "VI", "None": 0, "3rd": 0, "2nd": 0, "1st": 0, "Ace": 0 },
            { "Tier": "VII", "None": 0, "3rd": 0, "2nd": 0, "1st": 0, "Ace": 0 },
            { "Tier": "VIII", "None": 0, "3rd": 0, "2nd": 0, "1st": 0, "Ace": 0 },
            { "Tier": "IX", "None": 0, "3rd": 0, "2nd": 0, "1st": 0, "Ace": 0 },
            { "Tier": "X", "None": 0, "3rd": 0, "2nd": 0, "1st": 0, "Ace": 0 },
        ],
    };

    const numToMastery = { 0 : "None", 1 : "3rd", 2 : "2nd", 3 : "1st", 4 : "Ace" };

    // MOEstats.map((row) => {
    //     if (row.tier > 4) {
    //         jsonStats.tierMoeDist[row.tier - 5][row.moe] += 1;
    //     }
    //     jsonStats.tierMasteryDist[row.tier - 1][numToMastery[row.mastery]] += 1;
    // });

    stats.map((row) => {
        if (tankNames[row.tank_id] || oldtanksNames[row.tank_id]) {
            const avgDamage = row.all.damage_dealt / row.all.battles;
            const avgDef = row.all.dropped_capture_points / row.all.battles;
            const avgFrag = row.all.frags / row.all.battles;
            const avgSpots = row.all.spotted / row.all.battles;
            const winrate = row.all.wins*100/row.all.battles;
            const WN8 = calculateWN8(row.tank_id, avgDamage, avgDef, avgFrag, avgSpots, winrate);

            calculateWeighedOverall(row.tank_id, row.all.damage_dealt, row.all.dropped_capture_points, row.all.frags, row.all.spotted, row.all.wins, row.all.battles);
            
            const destroyed = row.all.battles - row.all.survived_battles;

            let MOE = 0;
            if (MOEstats[counter].achievements.marksOnGun) {
                MOE = MOEstats[counter].achievements.marksOnGun;
            }

            jsonStats.avgTier += row.all.battles* (tankNames[row.tank_id]['tier'] || oldtanksNames[row.tank_id]['tier']);
            jsonStats.battles += row.all.battles;

            let vehicleStats = {
                id: row.tank_id,
                name: tankNames[row.tank_id]['short_name'] || oldtanksNames[row.tank_id]['short_name'] + (tankNames[row.tank_id]['is_premium'] || oldtanksNames[row.tank_id]['is_premium'] ? " 🟊" : ""),
                nation: nationConversion[tankNames[row.tank_id]['nation'] || oldtanksNames[row.tank_id]['nation']],
                tier: tankNames[row.tank_id]['tier'] || oldtanksNames[row.tank_id]['tier'],
                class: Conversion[tankNames[row.tank_id]['type']] || oldtanksNames[row.tank_id]['type'],
                battles: row.all.battles,
                winrate: winrate.toFixed(2),
                wn8: parseInt(WN8),
                dpg: parseInt(avgDamage),
                wn8percent: (jStat.gamma.cdf( WN8, CDF[row.tank_id].wn8.a, CDF[row.tank_id].wn8.b)*100).toFixed(2),
                dpgpercent: (jStat.gamma.cdf( avgDamage, CDF[row.tank_id].dpg.a, CDF[row.tank_id].dpg.b)*100).toFixed(2),
                kpg: avgFrag.toFixed(2),
                dmgratio: (row.all.damage_dealt/row.all.damage_received).toFixed(2),
                kd: (row.all.frags/destroyed).toFixed(2),
                survival: (row.all.survived_battles*100/row.all.battles).toFixed(2) + '%',
                xp: parseInt(row.all.battle_avg_xp), 
                hitratio: row.all.hits_percents + '%',
                spots: avgSpots.toFixed(2),
                armoreff: row.all.tanking_factor,
                moe: MOE,
                mastery: row.mark_of_mastery,
                isPrem: tankNames[row.tank_id]['is_premium'] || false
            };
            if (row.all.battles !== 0) {
                jsonStats.tankWN8.push(vehicleStats);
            }
        }
        ++counter;
        }
    );
    jsonStats.overallWN8 = calculateOverallWN8();
    jsonStats.avgTier /= jsonStats.battles;

    jsonStats.radar.rDAMAGE = (weighedDamage/weighedExpDamage).toFixed(2);
    jsonStats.radar.rSPOT = (weighedSpots/weighedExpSpots).toFixed(2);
    jsonStats.radar.rFRAG = (weighedFrag/weighedExpFrag).toFixed(2);
    jsonStats.radar.rDEF = (weighedDef/weighedExpDef).toFixed(2);
    jsonStats.radar.rWIN = (weighedWinrate/weighedExpWinrate).toFixed(2);

    return jsonStats;
}

module.exports = calcOverall;