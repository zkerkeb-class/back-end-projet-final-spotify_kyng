const rateLimit = require('express-rate-limit');
const  RedisStore  = require('rate-limit-redis');
const redisClient = require('../config/redis');

  const globalRateLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: async (command, ...args) => {
        try {
          const result = await redisClient.sendCommand(command, args);
          return result;
        } catch (error) {
          console.error('Error in RedisStore sendCommand:', error);
          throw error;
        }
      },
    }),
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = globalRateLimiter;
