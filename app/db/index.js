const { Pool } = require("pg");

const pol = require('pg').Pool;

const pool = new pol();

module.exports = {
    query: (text, params) => pool.query(text, params),
}