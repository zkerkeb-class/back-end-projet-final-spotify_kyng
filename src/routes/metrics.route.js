const express = require('express');
const {
  getServerMetrics,
  trackBandwidth,
  trackSuccessFailure,
  resetMetrics,
} = require('../services/monitoringService');
const checkPermission = require('../middlewares/rbacMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const responseTime = require('response-time');

const router = express.Router();

const metrics = {
  responseTime: 0,
};

router.use(
  responseTime((req, res, time) => {
    metrics.responseTime = time;
  })
);

router.use(trackBandwidth);
router.use(trackSuccessFailure);
router.get('/', authMiddleware, checkPermission(['view_statistics']), (req, res) => {
  const serverMetrics = getServerMetrics();
  serverMetrics.responseTime = metrics.responseTime; // Ajouter le temps de réponse
  res.json(serverMetrics);
});

router.post('/reset', (req, res) => {
  resetMetrics();
  metrics.responseTime = 0;
  res.json({ message: 'Métriques réinitialisées avec succès' });
});

module.exports = router;
