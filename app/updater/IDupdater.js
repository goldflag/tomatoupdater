require("dotenv").config();
const fetch = require("node-fetch");
const db = require("../db");

const key = 'a72c65fd9291777ef394acbbda8b53a7';

async function IDupdater(server) {
    let successful = 0;
    const finalidArr = [];
    const time = Date.now()/1000 - 1209600;
    console.log(time);
    console.log(`currentTime: ${Date.now()}`);

    let counter = 1000000000;
    let max = 41000000;
    if (server === "eu") {
        max = 60000000;
        counter = 500000000;
    }

    for (let i = 0; i <= max; i = i + 100) {
        setTimeout(async function () {
            let firstID = counter + i;
            let idArr = [firstID];
            let idstr = `${firstID}`;
            for (let j = 1; j < 100; ++j) {
                const id = firstID + j; 
                idstr += `%2C+${id}`;
                idArr.push(id);
            }
            APIcall(idstr, i, idArr, time);
        }, i * 1.05);
    }

    async function APIcall(idstr, index, idArr, time) {
        const res = await fetch(`https://api.worldoftanks.${server}/wot/account/info/?application_id=${key}&account_id=${idstr}&fields=last_battle_time%2C+statistics.all.battles`);
        const data = await res.json();
        //console.log(data);
        for (let i = 0; i < idArr.length; ++i) {
            if (data.data[idArr[i]] != null && data.data[idArr[i]].last_battle_time > time && data.data[idArr[i]].statistics.all.battles > 100) {
                finalidArr.push(idArr[i]);
                //db.query(`INSERT INTO active${server}IDs (player_id) VALUES (${idArr[i]})`);
                successful++;
            }
        }
        if (index%1000 === 0) {
            console.log(`successful: ${successful} counter: ${index}`);
        }
        if (index >= max) {
            console.log(finalidArr);
            await db.query(`UPDATE IDs SET ids = $1, size = $2 WHERE server = $3`, [finalidArr, finalidArr.length, server]);
        }
    }
}

function main(server) {
    IDupdater(server);
}

module.exports = main;