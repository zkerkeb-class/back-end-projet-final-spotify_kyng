const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL_EX;
const redisClient = new Redis(redisUrl);
//enableOfflineQueue: false,
/*const redisClient = new Redis(redisUrl, {
  tls: {
    rejectUnauthorized: false,
  },
});*/
redisClient.on('connect', () => logger.info('Redis connecté'));
redisClient.on('error', (err) => logger.error(`Erreur Redis :${redisUrl} `, err));

module.exports = redisClient;
