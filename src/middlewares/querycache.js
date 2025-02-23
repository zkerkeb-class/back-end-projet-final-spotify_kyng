const redisClient = require('../config/redis');
const logger = require('../utils/logger');
const excludedRoutes = ['/auth/login'];

const querycacheMiddleware = async (req, res, next) => {
  if (excludedRoutes.includes(req.path)) {
    return next();
  }

  const key = req.originalUrl;

  try {
    const cachedData = await redisClient.get(key);

    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    res.sendResponse = res.json;
    res.json = (body) => {
      redisClient.setex(key, 3600, JSON.stringify(body));
      res.sendResponse(body);
    };

    next();
  } catch (error) {
    logger.error('Redis cache error:', error);
    next();
  }
};

module.exports = querycacheMiddleware;
