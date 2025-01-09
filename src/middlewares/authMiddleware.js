const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis'); // Redis importé
const User = require('../models/user')(require('mongoose')); // Ton modèle utilisateur

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ message: 'Access denied, no token provided.' });
  }

  try {
    // Étape 1 : Vérifie si les données de session sont en cache
    const cachedSession = await redisClient.get(token);
    if (cachedSession) {
      req.user = JSON.parse(cachedSession); // Si trouvé, on parse et on passe
      return next();
    }

    // Étape 2 : Décoder le token JWT et récupérer l'utilisateur depuis la base
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }

    // Étape 3 : Stocker les données utilisateur dans Redis avec une expiration
    const sessionData = { id: user._id, email: user.email, role: user.role };
    await redisClient.set(token, JSON.stringify(sessionData), 'EX', 3600); // Expire dans 1 heure

    req.user = sessionData;
    next();
  } catch (err) {
    console.error('AuthMiddleware Error:', err.message);
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
