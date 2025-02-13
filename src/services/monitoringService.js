const os = require('os');
const mongoose = require('mongoose');
const { execSync } = require('child_process');
const Redis = require('ioredis');
const logger = require('../utils/logger');

// Objet global pour stocker les métriques
const metrics = {
  dataTransferred: 0,
  successCount: 0,
  failureCount: 0,
  redisLatency: 0,
  mediaProcessingTime: 0,
};

// Middleware pour calculer la bande passante
const trackBandwidth = (req, res, next) => {
  let requestSize = 0;

  // Mesurer la taille du corps de la requête
  if (req.body) {
    requestSize += JSON.stringify(req.body).length;
  }

  // Mesurer la taille des en-têtes
  for (const [key, value] of Object.entries(req.headers)) {
    requestSize += key.length + value.length;
  }

  res.on('finish', () => {
    metrics.dataTransferred += requestSize;
    logger.info(`Bande passante utilisée : ${metrics.dataTransferred} octets`);
  });

  next();
};

// Middleware pour suivre le taux de succès / échec des requêtes
const trackSuccessFailure = (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      metrics.successCount++;
    } else {
      metrics.failureCount++;
    }
    logger.info(`Succès : ${metrics.successCount}, Échecs : ${metrics.failureCount}`);
  });
  next();
};

// Fonction pour mesurer la latence Redis
const measureRedisLatency = async () => {
  const redisClient = new Redis(process.env.REDIS_URL);
  const startTime = Date.now();
  await redisClient.ping(); // Exemple de commande Redis
  const latency = Date.now() - startTime;
  metrics.redisLatency = latency;
  logger.info(`Latence Redis : ${latency} ms`);
  return latency;
};

// Fonction pour mesurer le temps de traitement des médias
const measureMediaProcessingTime = async () => {
  const startTime = Date.now();
  // Simuler un traitement de média
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const processingTime = Date.now() - startTime;
  metrics.mediaProcessingTime = processingTime;
  logger.info(`Temps de traitement des médias : ${processingTime} ms`);
  return processingTime;
};

// Fonction pour récupérer les métriques du serveur
const getServerMetrics = () => {
  // CPU
  const cpuUsage = os.loadavg(); // Charge moyenne sur 1, 5 et 15 minutes

  // Mémoire
  const freeMemory = os.freemem();
  const totalMemory = os.totalmem();
  const usedMemory = totalMemory - freeMemory;

  // Temps d'exécution des requêtes DB (améliorable)
  const dbQueryExecutionTime = mongoose.connection.readyState;

  // Utilisation du disque
  let diskUsage = 'N/A';
  try {
    diskUsage = execSync('df -h /').toString().trim(); // Utilisation du disque pour la racine
  } catch (error) {
    logger.error('Erreur récupération disque:', error);
  }

  // Retour des métriques
  return {
    bandePassante: metrics.dataTransferred,
    cpuUsage,
    memoryUsage: {
      freeMemory,
      usedMemory,
      totalMemory,
    },
    dbQueryExecutionTime,
    diskUsage,
    successCount: metrics.successCount,
    failureCount: metrics.failureCount,
    redisLatency: metrics.redisLatency,
    mediaProcessingTime: metrics.mediaProcessingTime,
  };
};

// Fonction pour réinitialiser les métriques
const resetMetrics = () => {
  metrics.dataTransferred = 0;
  metrics.successCount = 0;
  metrics.failureCount = 0;
  metrics.redisLatency = 0;
  metrics.mediaProcessingTime = 0;
  logger.info('Métriques réinitialisées');
};

module.exports = {
  getServerMetrics,
  trackBandwidth,
  trackSuccessFailure,
  resetMetrics,
  measureRedisLatency,
  measureMediaProcessingTime,
};
