const fetch = require('node-fetch');

async function MoE(res, server) {
    const servers = ['com', 'eu', 'ru', 'asia'];
    if (!(servers.includes(server))) res.status(404).send('itsover');
    let data = await fetch(`https://gunmarks.poliroid.ru/api/${server}/vehicles/50,65,85,95,100`);
    data = await data.json();
    let newData = [];
    for (let i = 0; i < data.data.length; ++i) {
        let entry = {};
        entry.id = data.data[i].id;
        entry['50'] = data.data[i].marks['50'];
        entry['65'] = data.data[i].marks['65'];
        entry['85'] = data.data[i].marks['85'];
        entry['95'] = data.data[i].marks['95'];
        entry['100'] = data.data[i].marks['100'];
        newData.push(entry);
    }
    res.status(200).json(newData);
}

module.exports = MoE;