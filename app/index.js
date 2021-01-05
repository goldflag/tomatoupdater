require("dotenv").config();
const express = require("express");
const db = require("./db");
const morgan = require("morgan");
const cron = require("node-cron");
const helmet = require('helmet');
const async  = require('express-async-await');
const fetch = require('node-fetch');
const tankNames = require('./data/tankNames.json');
const WN8 = require('./data/wn8.json');
const app = express();

//compresses tank stats into more readable form
const IDupdater = require('./updater/IDupdater.js');
//daily update of player stats
const updater = require('./updater/updater.js');

app.use(morgan('dev'));
app.use(express.json());
app.use(helmet());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

//default port is 5000
const port = process.env.PORT || 5005;
app.listen(port, () => {
    console.log(`server is up on ${port}`);
});

app.get("/updateFiles", async (req, res) => {
    updateFiles();
    res.status(200).send(`updating`);
});

app.get("/update/:server", async (req, res) => {
    if (req.params.server === 'eu') updater("eu");
    if (req.params.server === 'com') updater("com");
    res.status(200).send(`updating ${req.params.server}`);
});

app.get("/api/abcd/tankNames", async (req, res) => {
    res.status(200).json(tankNames);  
});

app.get("/api/abcd/WN8", async (req, res) => {
    res.status(200).json(WN8);
});
