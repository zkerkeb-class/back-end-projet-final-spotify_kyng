const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/test-auth', authMiddleware, (req, res) => {
  res.status(200).json({
    message: 'Utilisateur authentifié',
    user: req.user,
  });
});

module.exports = router;
