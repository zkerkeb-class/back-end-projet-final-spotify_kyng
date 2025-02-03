const redisClient = require('../config/redis');
const excludedRoutes = ['/auth/login'];

const querycacheMiddleware = async (req, res, next) => {
  if (excludedRoutes.includes(req.path)) {
        return next();
    }

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

module.exports = querycacheMiddleware; 
