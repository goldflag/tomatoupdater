require("dotenv").config();
const fetch = require("node-fetch");
const fs = require('fs');

let successful = 0;

const finalidArr = [];

async function APIcall(idstr, index, idArr) {
    const res = await fetch(`https://api.worldoftanks.com/wot/account/info/?application_id=0e195fd37cad7175c7b6a033aff0fcff&account_id=${idstr}&fields=last_battle_time%2C+statistics.all.battles`)
    const data = await res.json();
    //console.log(data);
    for (let i = 0; i < idArr.length; ++i) {
        if (data.data[idArr[i]] != null && data.data[idArr[i]].last_battle_time > 1596864797 && data.data[idArr[i]].statistics.all.battles > 100) {
            finalidArr.push(idArr[i]);
            successful++;
        }
    }

    if (index%1000 === 0) {
        console.log(`successful: ${successful} counter: ${index}`);
    }
    if (index >= 4100) {
        let data = JSON.stringify(finalidArr);
        fs.writeFileSync('./NAids.json', data);
        console.log('NA IDs are complete');
    }
}
//40000000
function loop() {
    let counter = 1000000000;
    for (let i = 0; i <= 4100; i = i + 100) {
    //for (let i = 0; i < 41000000; i = i + 100) {
        setTimeout(function () {
            let firstID = counter + i;
            let idArr = [firstID];
            let idstr = `${firstID}`;
            for (let j = 1; j < 100; ++j) {
                const id = firstID + j; 
                idstr += `%2C+${id}`;
                idArr.push(id);
            }
            //console.log('frog');
            APIcall(idstr, i, idArr);
        }, i * 1.1);
    }
}

function main() {
    loop();  
}

module.exports = main;