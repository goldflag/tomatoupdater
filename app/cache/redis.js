require("dotenv").config();
const redisPW = process.env.REDISPASSWORD;
const redisHost = process.env.REDISHOST;
const redisPort = process.env.REDISPORT;
const redis = require('redis');
const client = redis.createClient({
  port      : redisPort,
  host      : redisHost,
  password  : redisPW
});

module.exports = client;