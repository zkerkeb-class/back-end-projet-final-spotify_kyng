// const rateLimit = require('express-rate-limit');
// const  RedisStore  = require('rate-limit-redis');
// const redisClient = require('../config/redis'); 

// const globalRateLimiter = rateLimit({
//   store: new RedisStore({
//     client: redisClient,
//   }),
//   windowMs: 15 * 60 * 1000, 
//   max: 10, 
//   message: 'Too many requests from this IP, please try again later.',
//  standardHeaders: true, 
// legacyHeaders: false, 
// });

 // module.exports = globalRateLimiter;