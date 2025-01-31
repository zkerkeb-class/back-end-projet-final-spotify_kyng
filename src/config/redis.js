const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL_EX;
const redisClient = new Redis(redisUrl);
 //enableOfflineQueue: false,
 /*const redisClient = new Redis(redisUrl, {
  tls: {
    rejectUnauthorized: false,
  },
});*/
redisClient.on('connect', () => console.log('Redis connecté'));
redisClient.on('error', (err) => console.error(`Erreur Redis :${redisUrl} `, err));

module.exports = redisClient;
