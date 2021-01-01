const fetch = require('node-fetch');

async function mastery(res, server) {
    const servers = ['com', 'eu', 'ru', 'asia'];
    if (!(servers.includes(server))) res.status(404).send('itsover');
    let data = await fetch(`https://mastery.poliroid.ru/api/${server}/vehicles`);
    data = await data.json();
    let newData = [];
    for (let i = 0; i < data.data.length; ++i) {
        let entry = {};
        entry.id = data.data[i].id;
        entry['3rd'] = data.data[i].mastery[0];
        entry['2nd'] = data.data[i].mastery[1];
        entry['1st'] = data.data[i].mastery[2];
        entry['ace'] = data.data[i].mastery[3];
        newData.push(entry);
    }
    res.status(200).json(newData);
}

module.exports = mastery;