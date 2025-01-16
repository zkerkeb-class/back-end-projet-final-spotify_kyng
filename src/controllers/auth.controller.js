const authService = require('../services/authService');
const sessionCacheService = require('../services/sessionCacheService');
const jwt = require('jsonwebtoken');

const loginController = async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await authService.loginUser(email, password);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const sessionData = { id: decoded.id, email: decoded.email, role: decoded.role };

    await sessionCacheService.setSession(token, sessionData);
    res.status(200).json({ token });
  } catch (error) {
    console.error('Erreur lors du login:', error.message);
    res.status(400).json({ message: error.message });
  }
};

const logoutController = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1]; // Récupère le token depuis les headers

  if (!token) {
    return res.status(400).json({ message: 'Token manquant.' });
  }
  try {
    const result = await sessionCacheService.deleteSession(token);

    if (result === 0) {
      return res.status(400).json({ message: 'Token non trouvé dans le cache.' });
    }

    res.status(200).json({ message: 'Déconnexion réussie.' });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error.message);
    res.status(500).json({ message: 'Erreur interne lors de la déconnexion.' });
  }
};

/*const registerController = async (req, res) => {
  const { firstname, lastname, email, phone, password, role } = req.body;

  try {
    // Appel du service d'authentification pour créer un utilisateur
    const user = await authService.createUser({ firstname, lastname, email, phone, password, role });
    res.status(201).json({ message: 'Utilisateur créé avec succès', user });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error.message);
    res.status(400).json({ message: error.message });
  }
};*/

module.exports = {
  loginController,
  logoutController,
  //registerController,
};
