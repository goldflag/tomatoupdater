const tankNames = require('../data/tankNames.json');
const WN8 = require('../data/wn8.json');
const Conversion = require('../data/conversion.json');
const nationConversion = require('../data/nationConversion.json');

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
    const exp = WN8[id];
    const rDAMAGE = avgDamage / exp.expDamage;
    const rSPOT   = avgSpots  / exp.expSpot;
    const rFRAG   = avgFrag   / exp.expFrag;
    const rDEF    = avgDef    / exp.expDef;
    const rWIN    = winrate   / exp.expWinRate;
    return WN8Final(rDAMAGE, rSPOT, rFRAG, rDEF, rWIN);
}

function calculateRecents(statsSnapshot, overall, output) {
    if (statsSnapshot === 'frog') {
        return {
            battles: 0, tier: '-', overallWN8: '-', wins: '-', losses: '-', draws: '-', damage: '-', damage_received: '-', frags: '-', destroyed: '-', survived: '-', spotted: '-', cap: '-', def: '-', xp: '-',
            winrate: '-', lossrate: '-', drawrate: '-', damagerate: '-', fragsrate: '-', survivedrate: '-', spottedrate: '-', caprate: '-', defrate: '-', xprate: '-', KD: '-', DMGratio: '-', tankStats: []
        };
    }
    //the historical snapshot
    let snapshotTanks = statsSnapshot.tankStats;
    let calculatedStats = {
        battles: overall.battles - statsSnapshot.battles,
        tankcount: 0,
        tier: overall.tier - statsSnapshot.tier,
        overallWN8: 0,
        wins: overall.wins - statsSnapshot.wins,
        losses: overall.losses - statsSnapshot.losses,
        draws: overall.draws - statsSnapshot.draws,
        damage: overall.damage - statsSnapshot.damage,
        damage_received: overall.damageR - statsSnapshot.damageR,
        frags: overall.frags - statsSnapshot.frags,
        destroyed: overall.deaths - statsSnapshot.deaths,
        survived: (overall.battles - overall.deaths) - (statsSnapshot.battles - statsSnapshot.deaths),
        spotted: overall.spotted - statsSnapshot.spotted,
        cap: overall.cap - statsSnapshot.cap,
        def: overall.def - statsSnapshot.def,
        xp: overall.xp - statsSnapshot.xp,
        tankStats: [],
        raw: [],
        radar: {
            "rDAMAGE" : 0,
            "rSPOT" : 0,
            "rFRAG" : 0,
            "rDEF" : 0,
            "rWIN" : 0
        },
        time: statsSnapshot.time,
        date: statsSnapshot.date
    };

    const overallWN8 = parseInt(calculatePeriodWN8(overall.tankStats, statsSnapshot.tankStats, calculatedStats.radar));
    calculatedStats.overallWN8 = overallWN8;
    let index = 0;
    overall.tankStats.map((row) => {
        if (row[0] === 52305 && output) console.log('gsor');
        if (snapshotTanks.length < index + 1 || row[0] !== snapshotTanks[index][0]) {
            const avgDamage = row[2] / row[1];
            const avgDef = row[6] / row[1];
            const avgFrag = row[4] / row[1];
            const avgSpots = row[5] / row[1];
            const winrate = row[3] * 100 / row[1];
            const WN8 = calculateWN8(row[0], avgDamage, avgDef, avgFrag, avgSpots, winrate);
            const destroyed = row[1] - row[7];

            let vehicleRecentStats = [
                row[0],
                tankNames[row[0]]['short_name'],
                nationConversion[tankNames[row[0]]['nation']],
                tankNames[row[0]]['tier'],
                Conversion[tankNames[row[0]]['type']],
                row[1],
                (winrate).toFixed(2),
                parseInt(WN8),
                parseInt(avgDamage),
                (avgFrag).toFixed(2),
                (row[2]/row[8]).toFixed(2),
                (row[4]/destroyed).toFixed(2),
                avgSpots.toFixed(2),
                (row[7]*100/row[1]).toFixed(2) + '%',
                tankNames[row[0]]['is_premium']               
            ];
            let raw = {
                id: row[0],
                battles: row[1],
                damage: row[2],
                def: row[6],
                frags: row[4],
                spots: row[5],
                winrate: winrate
            };
            calculatedStats.tankStats.push(vehicleRecentStats);
            calculatedStats.raw.push(raw);
            // calculatedStats.battles += row[1];
            calculatedStats.tankcount++;
        }
        else {
            if (row[1] !== snapshotTanks[index][1]) {
                const battlesDiff = row[1] - snapshotTanks[index][1];
                const dmgDiff = row[2] - snapshotTanks[index][2];
                const defDiff = row[6] - snapshotTanks[index][6];
                const fragDiff = row[4] - snapshotTanks[index][4];
                const spotsDiff = row[5] - snapshotTanks[index][5];
                const winsDiff = row[3] - snapshotTanks[index][3];

                const survivalDiff = row[7] - snapshotTanks[index][7];

                const avgDamage = dmgDiff / battlesDiff;
                const avgDef = defDiff / battlesDiff;
                const avgFrag = fragDiff / battlesDiff;
                const avgSpots = spotsDiff / battlesDiff;
                const winrate = winsDiff * 100 / battlesDiff;
                const WN8 = calculateWN8(row[0], avgDamage, avgDef, avgFrag, avgSpots, winrate);

                const survival = survivalDiff * 100 / battlesDiff;

                const destroyedDiff = (row[1] - row[7]) - (snapshotTanks[index][1] - snapshotTanks[index][7]);

                let DMGRatio;
                if (row[8] - snapshotTanks[index][8] === 0) { DMGRatio = 'No Damage Recieved' }
                else { DMGRatio = ((row[2] - snapshotTanks[index][2])/(row[8] - snapshotTanks[index][8])).toFixed(2) }
                let KDRatio;
                if (destroyedDiff === 0) { KDRatio = 'No Deaths' }
                else { KDRatio = (fragDiff/destroyedDiff).toFixed(2) }
               let vehicleRecentStats = [
                    // <img src={require(`../assets/tankIcons/${row[0]}.png`)} alt={row[0]}/>,
                    row[0],
                    tankNames[row[0]]['short_name'] + (tankNames[row[0]]['is_premium'] ? " 🟊" : ""),
                    nationConversion[tankNames[row[0]]['nation']],
                    tankNames[row[0]]['tier'],
                    Conversion[tankNames[row[0]]['type']],
                    battlesDiff,
                    (winrate).toFixed(2),
                    parseInt(WN8),
                    parseInt(avgDamage),     
                    (avgFrag).toFixed(2),
                    DMGRatio,
                    KDRatio,
                    avgSpots.toFixed(2),
                    survival.toFixed(2) + '%',   
                    tankNames[row[0]]['is_premium']               
                ];
                let raw = {
                    id: row[0],
                    battles: battlesDiff,
                    damage: dmgDiff,
                    def: defDiff,
                    frags: fragDiff,
                    spots: spotsDiff,
                    winrate: winrate
                };
                calculatedStats.tankStats.push(vehicleRecentStats);
                calculatedStats.raw.push(raw);
                // calculatedStats.battles += battlesDiff;
                calculatedStats.tankcount++;
            }
            ++index;
        }
    });
    calculatedStats = zeroBattles(calculatedStats);
    return calculatedStats;
}

function calculatePeriodWN8(overall, historical, radar) {
    let weighedExpDamage = 0, weighedExpSpots = 0, weighedExpFrag = 0, weighedExpDef = 0, weighedExpWinrate = 0;
    let weighedDamage = 0, weighedSpots = 0, weighedFrag = 0, weighedDef = 0, weighedWinrate = 0;

    let index = 0;
    overall.map((row) => {
        const exp = WN8[row[0]];
        if (historical.length < index + 1 || row[0] !== historical[index][0]) {
            weighedExpDamage += row[1]*exp.expDamage;
            weighedExpSpots += row[1]*exp.expSpot;
            weighedExpFrag += row[1]*exp.expFrag;    
            weighedExpDef += row[1]*exp.expDef;    
            weighedExpWinrate += row[1]*exp.expWinRate;
            weighedDamage += row[2];
            weighedSpots += row[5];
            weighedFrag += row[4];
            weighedDef += row[6];
            weighedWinrate += 100*row[3];
        }
        else {
            if (row[1] !== historical[index][1]) {
                const battlesDiff = row[1] - historical[index][1];
                weighedExpDamage += battlesDiff*exp.expDamage;
                weighedExpSpots += battlesDiff*exp.expSpot;
                weighedExpFrag += battlesDiff*exp.expFrag;    
                weighedExpDef += battlesDiff*exp.expDef;    
                weighedExpWinrate += battlesDiff*exp.expWinRate;
                weighedDamage += row[2] - historical[index][2];
                weighedSpots += row[5] - historical[index][5];
                weighedFrag += row[4] - historical[index][4];
                weighedDef += row[6] - historical[index][6];
                weighedWinrate += 100*row[3] - 100*historical[index][3];
            }
            ++index;
        }
    });
    const rDAMAGE = weighedDamage / weighedExpDamage;
    const rSPOT   = weighedSpots  / weighedExpSpots;
    const rFRAG   = weighedFrag   / weighedExpFrag;
    const rDEF    = weighedDef    / weighedExpDef;
    const rWIN    = weighedWinrate   / weighedExpWinrate;

    radar.rDAMAGE = (weighedDamage/weighedExpDamage).toFixed(2);
    radar.rSPOT = (weighedSpots/weighedExpSpots).toFixed(2);
    radar.rFRAG = (weighedFrag/weighedExpFrag).toFixed(2);
    radar.rDEF = (weighedDef/weighedExpDef).toFixed(2);
    radar.rWIN = (weighedWinrate/weighedExpWinrate).toFixed(2);

    return WN8Final(rDAMAGE, rSPOT, rFRAG, rDEF, rWIN);
}

function zeroBattles(stats) {
    if (stats.battles === 0) {
        stats = {
            battles: 0,
            tier: '-',
            overallWN8: '-',
            wins: '-',
            losses: '-',
            draws: '-',
            damage: '-',
            damage_received: '-',
            frags: '-',
            destroyed: '-',
            survived: '-',
            spotted: '-',
            cap: '-',
            def: '-',
            xp: '-',

            winrate: '-',
            lossrate: '-',
            drawrate: '-',
            damagerate: '-',
            fragsrate: '-',
            survivedrate: '-',
            spottedrate: '-',
            caprate: '-',
            defrate: '-',
            xprate: '-',
            KD: '-',
            DMGratio: '-',
            tankStats: [],
            raw: [],
            radar: {
                "rDAMAGE" : 0,
                "rSPOT" : 0,
                "rFRAG" : 0,
                "rDEF" : 0,
                "rWIN" : 0
            },
            time: 0,
            date: 0
        };
    }
    else {
        stats['winrate'] = (stats.wins*100/stats.battles).toFixed(2);
        stats['lossrate'] = (stats.losses*100/stats.battles).toFixed(2);
        stats['drawrate'] = (stats.draws*100/stats.battles).toFixed(2);
        stats['damagerate'] = (stats.damage/stats.battles).toFixed(0);
        stats['fragsrate'] = (stats.frags/stats.battles).toFixed(2);
        stats['survivedrate'] = (stats.survived*100/stats.battles).toFixed(2);
        stats['spottedrate'] = (stats.spotted/stats.battles).toFixed(2);
        stats['caprate'] = (stats.cap/stats.battles).toFixed(2);
        stats['defrate'] = (stats.def/stats.battles).toFixed(2);
        stats['xprate'] = (stats.xp/stats.battles).toFixed(0);
        stats['tier'] = (stats['tier']/stats.battles).toFixed(2);
        stats['KD'] = (stats.frags/stats.destroyed).toFixed(2);
        stats['DMGratio'] = (stats.damage/stats.damage_received).toFixed(2);
    }
    return stats;
}

module.exports = calculateRecents;