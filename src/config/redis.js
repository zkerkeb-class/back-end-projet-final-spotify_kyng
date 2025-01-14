const Redis = require('ioredis');

const redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
});

redisClient.on('connect', () => console.log('Redis connecté'));
redisClient.on('error', (err) => console.error('Erreur Redis', err));

module.exports = redisClient;
