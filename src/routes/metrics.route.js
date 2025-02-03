const express = require('express');
const {
  getServerMetrics,
  trackBandwidth,
  trackSuccessFailure,
  resetMetrics,
  measureResponseTime,
} = require('../services/monitoringService');
const checkPermission = require('../middlewares/rbacMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

// Middleware pour mesurer le temps de réponse des requêtes API
router.use(measureResponseTime);

// Middleware pour suivre la bande passante
router.use(trackBandwidth);

// Middleware pour suivre le taux de succès / échec des requêtes
router.use(trackSuccessFailure);

// Route pour récupérer les métriques
router.get('/', authMiddleware, checkPermission(['view_statistics']), (req, res) => {
  const metrics = getServerMetrics();

  // Ajouter le temps de réponse
  metrics.responseTime = req.responseTime || 0;

  // Envoyer la réponse
  res.json(metrics);
});

// Route pour réinitialiser les métriques
router.post('/reset', (req, res) => {
  resetMetrics();
  res.json({ message: 'Métriques réinitialisées avec succès' });
});

module.exports = router;
