const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redisClient = new Redis({
  host: process.env.REDIS_HOST ,
  port: process.env.REDIS_PORT 
});

const globalRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args), 
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, 
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Retourne les en-têtes RateLimit-* standard
  legacyHeaders: false,  // Désactive les en-têtes X-RateLimit-*
});

module.exports = globalRateLimiter;
