const tankNames = require('../data/tankNames.json');
const WN8 = require('../data/wn8.json');

function WN8Final(rDAMAGE, rSPOT, rFRAG, rDEF, rWIN) {
    const rWINc    = Math.max(0,                          (rWIN    - 0.71) / (1 - 0.71) );
    const rDAMAGEc = Math.max(0,                          (rDAMAGE - 0.22) / (1 - 0.22) );
    const rFRAGc   = Math.max(0, Math.min(rDAMAGEc + 0.2, (rFRAG   - 0.12) / (1 - 0.12)));
    const rSPOTc   = Math.max(0, Math.min(rDAMAGEc + 0.1, (rSPOT   - 0.38) / (1 - 0.38)));
    const rDEFc    = Math.max(0, Math.min(rDAMAGEc + 0.1, (rDEF    - 0.10) / (1 - 0.10)));
    const WN8 = 980*rDAMAGEc + 210*rDAMAGEc*rFRAGc + 155*rFRAGc*rSPOTc + 75*rDEFc*rFRAGc + 145*Math.min(1.8,rWINc);
    return WN8;
}

function calculateWN8(stats) {
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
        const exp = WN8[id];
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
        return parseInt(WN8Final(rDAMAGE, rSPOT, rFRAG, rDEF, rWIN));
    }

    stats.map((row) => {
        if (tankNames[row.tank_id]) {
            calculateWeighedOverall(row.tank_id, row.all.damage_dealt, row.all.dropped_capture_points, row.all.frags, row.all.spotted, row.all.wins, row.all.battles);
        }
    });

    return calculateOverallWN8();
}

module.exports = calculateWN8;