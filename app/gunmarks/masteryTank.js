const tankNames = require('../data/tankNames.json');
const fetch = require('node-fetch');


async function masteryTank(res, id, server) {
    const servers = ['com', 'eu', 'ru', 'asia'];
    if (!(servers.includes(server))) res.status(404).send('itsover');
    if (!(id in tankNames)) res.status(404).send('itsover');
    let data = await fetch(`https://mastery.poliroid.ru/api/${server}/vehicle/${id}`);
    data = await data.json();
    let newData = [];
    for (let i = 0; i < 4; ++i) {
        let line = {
            "id": i,
            "data": [],
        };
        for (let j = data.data.length - 1; j >= 0; --j) {
            let entry = {};
            entry.x = data.data[j].date;
            entry.y = data.data[j].mastery[i];
            line.data.push(entry);
        }
        newData.push(line);
    }
    res.status(200).json(newData);
}

module.exports = masteryTank;