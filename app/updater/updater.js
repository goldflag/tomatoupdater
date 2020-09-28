const fetch = require("node-fetch");
const NAids = require('./NAids.json');

async function APIcall(count, id) {
    // const res = await fetch(`http://localhost:5000/api/abcd/com/${id}`);
    await fetch(`https://tomatoproxy${count}.herokuapp.com/abcd/com/${id}`);
}

function playerUpdater() {
    let count = 1;
    // for (let i = 0; i < 178442; ++i) {
    for (let i = 0; i < NAids.length(); ++i) {
        setTimeout(function () {
            console.log(`count: ${i} id: ${NAids[i + 0]}`);
            APIcall(count, NAids[i + 0]);
            count++;
            if (count == 10) {
                count = 1;
            }
            console.log(count);
        }, i * 30);
    }
}

module.exports = playerUpdater;