const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redisClient = require('../config/redis');

module.exports = session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }, 
});
