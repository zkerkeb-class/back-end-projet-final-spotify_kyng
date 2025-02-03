const authService = require('../services/authService');
const sessionCacheService = require('../services/sessionCacheService');
const jwt = require('jsonwebtoken');

const loginController = async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await authService.loginUser(email, password);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const sessionData = { id: decoded.id, email: decoded.email, role: decoded.role };
    console.log('Calling setSession with token:', token, 'and data:', sessionData);
    await sessionCacheService.setSession(token, sessionData);
    res.status(200).json({ token });
  } catch (error) {
    console.error('Erreur lors du login:', error.message);
    res.status(400).json({ message: error.message });
  }
};

const logoutController = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(400).json({ message: 'Token manquant.' });
  }

  try {
    await sessionCacheService.addToBlacklist(token);
    await sessionCacheService.deleteSession(token);

    res.status(200).json({ message: 'Déconnexion réussie.' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error.message);
    res.status(500).json({ message: 'Erreur interne lors de la déconnexion.' });
  }
};


module.exports = {
  loginController,
  logoutController,
};
