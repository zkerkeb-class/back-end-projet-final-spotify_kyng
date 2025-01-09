const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user')(mongoose);

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1]; 

  if (!token) {
    return res.status(403).json({ message: 'Access denied, no token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    req.user = await User.findById(decoded.id); 
    next();
  } catch (err) {
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
