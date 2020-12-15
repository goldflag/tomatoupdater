const fetch = require('node-fetch');

async function updateFiles() {
    for (let i = 1; i < 22; ++i) {
        const WN8 = await fetch(`https://tomatoserver${i}.herokuapp.com/updateWN8`);
        const TankNames = await fetch(`https://tomatoserver${i}.herokuapp.com/updatetankNames`);
    }
}

module.exports = updateFiles;