const jwt = require('jsonwebtoken');
const sessionCacheService = require('../services/sessionCacheService');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    logger.info('No token provided in the request headers');
    return res.status(403).json({ message: 'Access denied, no token provided.' });
  }

  try {
    const isBlacklisted = await sessionCacheService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Token invalidated. Please log in again.' });
    }

    const cachedSession = await sessionCacheService.getSession(token);
    logger.info('Cached session:', cachedSession);

    if (cachedSession) {
      req.user = cachedSession;
      logger.info('Session found in cache, proceeding to the next middleware');
      return next();
    }
    logger.info('Session not found in cache, verifying JWT');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const sessionData = { id: decoded.id, email: decoded.email, role: decoded.role };

    logger.info('Creating new session in cache:', sessionData);
    await sessionCacheService.setSession(token, sessionData);

    req.user = sessionData;
    next();
  } catch (err) {
    logger.error('Error in authMiddleware:', err.message);
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
