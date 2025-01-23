const jwt = require('jsonwebtoken');
const sessionCacheService = require('../services/sessionCacheService');
const User = require('../models/user')(require('mongoose'));

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Access denied, no token provided.' });
  }

  try {
    const cachedSession = await sessionCacheService.getSession(token);
    if (cachedSession) {
      req.user = cachedSession; 
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }
    const sessionData = { id: user._id, email: user.email, role: user.role };
    await sessionCacheService.setSession(token, sessionData);
    req.user = sessionData;
    next();
  } catch (err) {
    console.error('AuthMiddleware Error:', err.message);
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
