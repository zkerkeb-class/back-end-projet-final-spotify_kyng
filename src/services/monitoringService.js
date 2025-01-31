const os = require('os');
const mongoose = require('mongoose');
const { execSync } = require('child_process');
const Redis = require('ioredis');

// Objet global pour stocker les métriques
const metrics = {
  dataTransferred: 0,
  successCount: 0,
  failureCount: 0,
  redisLatency: 0,
  mediaProcessingTime: 0,
  responseTime: 0,
};

// Middleware pour calculer la bande passante
const trackBandwidth = (req, res, next) => {
  let requestSize = 0;

  if (req.body) {
    requestSize += JSON.stringify(req.body).length;
  }

  for (const [key, value] of Object.entries(req.headers)) {
    requestSize += key.length + value.length;
  }

  res.on('finish', () => {
    metrics.dataTransferred += requestSize;
    console.log(`Bande passante utilisée : ${metrics.dataTransferred} octets`);
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
    console.log(`Succès : ${metrics.successCount}, Échecs : ${metrics.failureCount}`);
  });
  next();
};

// Middleware pour mesurer le temps de réponse des requêtes API
const measureResponseTime = (req, res, next) => {
  const startTime = process.hrtime();

  res.on('finish', () => {
    const duration = process.hrtime(startTime);
    const responseTimeMs = (duration[0] * 1000) + (duration[1] / 1000000);
    metrics.responseTime = responseTimeMs;
    console.log(`Requête ${req.method} ${req.url} - Temps de réponse : ${responseTimeMs.toFixed(2)} ms`);
  });

  next();
};

// Fonction pour mesurer la latence Redis
const measureRedisLatency = async () => {
  const redisClient = new Redis(process.env.REDIS_URL);
  const startTime = Date.now();
  await redisClient.ping();
  const latency = Date.now() - startTime;
  metrics.redisLatency = latency;
  console.log(`Latence Redis : ${latency} ms`);
  return latency;
};

// Fonction pour récupérer les métriques du serveur
const getServerMetrics = () => {
  return {
    ...metrics,
    cpuUsage: os.loadavg(),
    memoryUsage: {
      freeMemory: os.freemem(),
      usedMemory: os.totalmem() - os.freemem(),
      totalMemory: os.totalmem(),
    },
    dbQueryExecutionTime: mongoose.connection.readyState,
    diskUsage: getDiskUsage(),
  };
};

// Fonction pour réinitialiser les métriques
const resetMetrics = () => {
  metrics.dataTransferred = 0;
  metrics.successCount = 0;
  metrics.failureCount = 0;
  metrics.redisLatency = 0;
  metrics.mediaProcessingTime = 0;
  metrics.responseTime = 0;
  console.log('Métriques réinitialisées');
};

module.exports = {
  getServerMetrics,
  trackBandwidth,
  trackSuccessFailure,
  resetMetrics,
  measureResponseTime,
  measureRedisLatency,
};