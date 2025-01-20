const Redis = require('ioredis');

 const redisUrl = process.env.REDIS_URL;
const redisClient = new Redis(redisUrl);
 enableOfflineQueue: false,

redisClient.on('connect', () => console.log('Redis connecté'));
redisClient.on('error', (err) => console.error('Erreur Redis', err));

module.exports = redisClient;
