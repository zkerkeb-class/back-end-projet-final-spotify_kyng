const express = require('express');
const { measureResponseTime,getServerMetrics, trackBandwidth, trackSuccessFailure, resetMetrics } = require('../services/monitoringService');

const router = express.Router();

// Middleware pour mesurer le temps de réponse des requêtes API
router.use(measureResponseTime);

// Middleware pour suivre la bande passante
router.use(trackBandwidth);

// Middleware pour suivre le taux de succès / échec des requêtes
router.use(trackSuccessFailure);

// Route pour récupérer les métriques
router.get('/', (req, res) => {
  //await measureRedisLatency();
  const metrics = getServerMetrics();

  // Ajouter le temps de réponse
  //metrics.responseTime = req.responseTime || 0;
  console.log(`Temps de réponse dans la route /metrics : ${metrics.responseTime} ms`);
  // Envoyer la réponse
  res.json(metrics);
});

// Route pour réinitialiser les métriques
router.post('/reset', (req, res) => {
  resetMetrics();
  res.json({ message: 'Métriques réinitialisées avec succès' });
});

module.exports = router;