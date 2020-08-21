const { Pool } = require("pg");

const pol = require('pg').Pool;
const connectionString = 'postgresql://doadmin:rso6y5hsgulz6icl@tomato-do-user-7906046-0.a.db.ondigitalocean.com:25060/defaultdb?sslmode=require'

const pool = new pol(

);


module.exports = {
    query: (text, params) => pool.query(text, params),
}