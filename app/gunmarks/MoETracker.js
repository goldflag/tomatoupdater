const fetch = require('node-fetch');
const tankNames = require('../data/tankNames.json');
const conversion = require('../data/conversion.json');
const nationConversion = require('../data/nationConversion.json');
const db = require("../db");

function round(value, decimals) {
    return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
}

async function MoETracker(server, res) {
    let totaldata = await fetch(`https://gunmarks.poliroid.ru/api/${server}/vehicles/50,65,85,95,100`);
    totaldata = await totaldata.json();
    const table = {
        data: []
    };

    const len = totaldata.data.length;
    //const len = 5;

    for (let i = 0; i < len; ++i) {
        setTimeout(async function () {
            const entry = {};
            let tankData = await fetch(`https://gunmarks.poliroid.ru/api/${server}/vehicle/${totaldata.data[i].id}/50,65,85,95,100`);
            tankData = await tankData.json();
            
            entry.id = totaldata.data[i].id;
            entry.name = tankNames[totaldata.data[i].id].short_name;
            entry.class = conversion[tankNames[totaldata.data[i].id].type];
            entry.tier = tankNames[totaldata.data[i].id].tier;
            entry.nation = nationConversion[tankNames[totaldata.data[i].id].nation];
            entry.isPrem = tankNames[totaldata.data[i].id].is_premium;
            try {
                if (!tankData.data[0].marks['95']) setNull(95);
                else {
                    if (tankData.data[30].marks['95']) {
                        entry["30diff95"] = tankData.data[0].marks['95'] - tankData.data[30].marks['95'];
                        entry["30percent95"] = round(((tankData.data[0].marks['95'] - tankData.data[30].marks['95']) * 100 / tankData.data[30].marks['95']), 2);
                    }
                    else { 
                        entry["30diff95"] = 0;
                        entry["30percent95"] = 0;
                    }
                    if (tankData.data[14].marks['95']) {
                        entry["14diff95"] = tankData.data[0].marks['95'] - tankData.data[14].marks['95'];
                        entry["14percent95"] = round(((tankData.data[0].marks['95'] - tankData.data[14].marks['95']) * 100 / tankData.data[14].marks['95']), 2);
                    }    
                    else {
                        entry["14diff95"] = 0;
                        entry["14percent95"] = 0;
                    }    
                    if (tankData.data[7].marks['95']) {
                        entry["7diff95"] = tankData.data[0].marks['95'] - tankData.data[7].marks['95'];
                        entry["7percent95"] = round(((tankData.data[0].marks['95'] - tankData.data[7].marks['95']) * 100 / tankData.data[7].marks['95']), 2);
                    }    
                    else {
                        entry["7diff95"] = 0;
                        entry["7percent95"] = 0;
                    }
                    entry["95"] = tankData.data[0].marks['95'] || "-";
                }

                if (!tankData.data[0].marks['85']) setNull(85);
                else {
                    if (tankData.data[30].marks['85']) {
                        entry["30diff85"] = tankData.data[0].marks['85'] - tankData.data[30].marks['85'];
                        entry["30percent85"] = round(((tankData.data[0].marks['85'] - tankData.data[30].marks['85']) * 100 / tankData.data[30].marks['85']), 2);
                    }
                    else { 
                        entry["30diff85"] = 0;
                        entry["30percent85"] = 0;
                    }
                    if (tankData.data[14].marks['85']) {
                        entry["14diff85"] = tankData.data[0].marks['85'] - tankData.data[14].marks['85'];
                        entry["14percent85"] = round(((tankData.data[0].marks['85'] - tankData.data[14].marks['85']) * 100 / tankData.data[14].marks['85']), 2);
                    }    
                    else {
                        entry["14diff85"] = 0;
                        entry["14percent85"] = 0;
                    }    
                    if (tankData.data[7].marks['85']) {
                        entry["7diff85"] = tankData.data[0].marks['85'] - tankData.data[7].marks['85'];
                        entry["7percent85"] = round(((tankData.data[0].marks['85'] - tankData.data[7].marks['85']) * 100 / tankData.data[7].marks['85']), 2);
                    }    
                    else {
                        entry["7diff85"] = 0;
                        entry["7percent85"] = 0;
                    } 
                    entry["85"] = tankData.data[0].marks['85'] || "-";
                }

                if (!tankData.data[0].marks['65']) setNull(65);
                else {
                    if (tankData.data[30].marks['65']) {
                        entry["30diff65"] = tankData.data[0].marks['65'] - tankData.data[30].marks['65'];
                        entry["30percent65"] = round(((tankData.data[0].marks['65'] - tankData.data[30].marks['65']) * 100 / tankData.data[30].marks['65']), 2);
                    }
                    else { 
                        entry["30diff65"] = 0;
                        entry["30percent65"] = 0;
                    }
                    if (tankData.data[14].marks['65']) {
                        entry["14diff65"] = tankData.data[0].marks['65'] - tankData.data[14].marks['65'];
                        entry["14percent65"] = round(((tankData.data[0].marks['65'] - tankData.data[14].marks['65']) * 100 / tankData.data[14].marks['65']), 2);
                    }    
                    else {
                        entry["14diff65"] = 0;
                        entry["14percent65"] = 0;
                    }    
                    if (tankData.data[7].marks['65']) {
                        entry["7diff65"] = tankData.data[0].marks['65'] - tankData.data[7].marks['65'];
                        entry["7percent65"] = round(((tankData.data[0].marks['65'] - tankData.data[7].marks['65']) * 100 / tankData.data[7].marks['65']), 2);
                    }    
                    else {
                        entry["7diff65"] = 0;
                        entry["7percent65"] = 0;
                    } 
                    entry["65"] = tankData.data[0].marks['65'] || "-";
                }
            }
            catch (err) {
                setNull();
                console.log(err);
            }

            function setNull(moe) {
                entry[`30diff${moe}`] = 0;
                entry[`30percent${moe}`] = 0;
                entry[`14diff${moe}`] = 0;
                entry[`14percent${moe}`] = 0;
                entry[`7diff${moe}`] = 0;
                entry[`7percent${moe}`] = 0;
                entry[`3diff${moe}`] = 0;
                entry[`${moe}`] = "-";  
            }

            table.data.push(entry);
            if (i === len - 1 ) {
                await db.query(`UPDATE moetracker SET data = $1 WHERE server = $2`, [table, server]);
                return;
            }
        }, i * 50);
    }
}

module.exports = MoETracker;