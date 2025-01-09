const redisClient = require('../config/redis');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken'); // Ajoute ceci si non inclus

const loginController = async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await authService.loginUser(email, password);

    // Décodage du token pour obtenir les informations de session
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const sessionData = { id: decoded.id, email: decoded.email, role: decoded.role };

    // Utilisation d'un préfixe pour la clé Redis afin d'identifier les sessions utilisateur
    const redisKey = `user_session:${token}`; // Clé formatée pour la session de l'utilisateur
    await redisClient.set(redisKey, JSON.stringify(sessionData), 'EX', 3600); // Expire dans 1 heure

    res.status(200).json({ token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const logoutController = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Récupère le token depuis les headers

  if (!token) {
    return res.status(400).json({ message: 'Token manquant.' });
  }

  try {
    // Création de la clé Redis avec le préfixe
    const redisKey = `user_session:${token}`; // Clé formatée pour la session de l'utilisateur

    // Suppression du token de Redis
    const result = await redisClient.del(redisKey);
    console.log('Token supprimé de Redis :', result);

    const keys = await redisClient.keys('*'); // Récupère toutes les clés
    console.log('Clés restantes dans Redis :', keys); // Affiche les clés restantes après suppression

    if (result === 0) {
      return res.status(400).json({ message: 'Token non trouvé dans le cache.' });
    }

    res.status(200).json({ message: 'Déconnexion réussie.' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion :', error.message);
    res.status(500).json({ message: 'Erreur interne lors de la déconnexion.' });
  }
};

/*const registerController = async (req, res) => {
  const { firstname, lastname, email, phone, password, role } = req.body;

  try {
    const user = await authService.createUser({ firstname, lastname, email, phone, password, role });
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};*/

module.exports = {
  loginController,
  logoutController,
  //registerController,
};
