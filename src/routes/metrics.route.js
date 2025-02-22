// routes/metrics.route.js
const express = require('express');
const {
  getServerMetrics,
  trackBandwidth,
  trackSuccessFailure,
  resetMetrics
} = require('../services/monitoringService');
const checkPermission = require('../middlewares/rbacMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const responseTime = require('response-time');

const router = express.Router();

const metrics = {
  responseTime: 0,
};

router.use(responseTime((req, res, time) => {
  metrics.responseTime = time; 
}));

router.use(trackBandwidth);
router.use(trackSuccessFailure);

/**
 * @swagger
 * tags:
 *   name: Metrics
 *   description: Gestion des métriques de performance du serveur
 */

/**
 * @swagger
 * /metrics:
 *   get:
 *     tags: [Metrics]
 *     summary: Récupère les métriques du serveur
 *     description: Retourne les métriques de performance du serveur, y compris le temps de réponse, la bande passante, et les taux de succès/échec.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Métriques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 responseTime:
 *                   type: number
 *                   description: Temps de réponse moyen en millisecondes
 *                 bandwidthUsage:
 *                   type: number
 *                   description: Utilisation de la bande passante en octets
 *                 successRate:
 *                   type: number
 *                   description: Taux de succès des requêtes (en pourcentage)
 *                 failureRate:
 *                   type: number
 *                   description: Taux d'échec des requêtes (en pourcentage)
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permission refusée
 */
router.get('/', authMiddleware, checkPermission(['view_statistics']), (req, res) => {
  const serverMetrics = getServerMetrics();
  serverMetrics.responseTime = metrics.responseTime; // Ajouter le temps de réponse
  res.json(serverMetrics);
});

/**
 * @swagger
 * /metrics/reset:
 *   post:
 *     tags: [Metrics]
 *     summary: Réinitialise les métriques du serveur
 *     description: Réinitialise toutes les métriques de performance du serveur (temps de réponse, bande passante, taux de succès/échec).
 *     responses:
 *       200:
 *         description: Métriques réinitialisées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Métriques réinitialisées avec succès"
 */
router.post('/reset', (req, res) => {
  resetMetrics();
  metrics.responseTime = 0; 
  res.json({ message: 'Métriques réinitialisées avec succès' });
});

module.exports = router;