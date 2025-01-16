const Redis = require('ioredis');
const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
});

// routes à exclure du cache (cache de session)
//const excludedRoutes = ['/login','/register'];

const cacheMiddleware = async (req, res, next) => {
    // Si la route est exclue du cache, on passe directement au middleware suivant
   /* if (excludedRoutes.includes(req.path)) {
        return next();
    }*/

    const key = req.originalUrl; 

    try {
        const cachedData = await redisClient.get(key);

        if (cachedData) {
            console.log('Cache hit');
            return res.json(JSON.parse(cachedData)); 
        }

        console.log('Cache miss');
        
        res.sendResponse = res.json;
        res.json = (body) => {
            redisClient.setex(key, 3600, JSON.stringify(body)); 
            res.sendResponse(body);
        };

        next(); 
    } catch (error) {
        console.error('Redis cache error:', error);
        next(); 
    }
};

module.exports = cacheMiddleware;
