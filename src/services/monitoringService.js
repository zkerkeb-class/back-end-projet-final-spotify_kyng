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
  const startTime = process.hrtime(); // Temps de départ en nanosecondes

  res.on('finish', () => {
    const duration = process.hrtime(startTime); // Temps écoulé en [secondes, nanosecondes]
    const responseTimeMs = (duration[0] * 1000) + (duration[1] / 1000000); // Convertir en millisecondes
    req.responseTime = responseTimeMs; // Stocker le temps de réponse dans req
    console.log(`Requête ${req.method} ${req.url} - Temps de réponse : ${responseTimeMs.toFixed(2)} ms`);
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
  console.log(`Latence Redis : ${latency} ms`);
  return latency;
};

// Fonction pour mesurer le temps de traitement des médias
const measureMediaProcessingTime = async (file) => {
  const startTime = Date.now();
  // Simuler un traitement de média
  await new Promise(resolve => setTimeout(resolve, 1000)); 
  const processingTime = Date.now() - startTime;
  metrics.mediaProcessingTime = processingTime;
  console.log(`Temps de traitement des médias : ${processingTime} ms`);
  return processingTime;
};

// Fonction pour récupérer les métriques du serveur
const getServerMetrics = () => {
  // CPU
  const cpuUsage = os.loadavg(); 

  // Mémoire
  const freeMemory = os.freemem();
  const totalMemory = os.totalmem();
  const usedMemory = totalMemory - freeMemory;

  // Temps d'exécution des requêtes DB (améliorable)
  const dbQueryExecutionTime = mongoose.connection.readyState;

  // Utilisation du disque
  let diskUsage = "N/A";
  try {
    diskUsage = execSync('df -h /').toString().trim(); // Utilisation du disque pour la racine
  } catch (error) {
    console.error("Erreur récupération disque:", error);
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
  console.log('Métriques réinitialisées');
};

module.exports = {
  getServerMetrics,
  trackBandwidth,
  trackSuccessFailure,
  resetMetrics,
 // measureResponseTime,
  measureRedisLatency,
  measureMediaProcessingTime,
};