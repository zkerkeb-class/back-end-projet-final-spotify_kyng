const express = require('express');
const helmet = require('helmet');
const timeout = require('express-timeout-handler');
//const csurf = require('csurf');
//const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const responseTime = require('response-time');
const { trackBandwidth, trackSuccessFailure } = require('./services/monitoringService');
const dotenv = require('dotenv');
const http = require('http');
//const Redis = require('ioredis');
//const dns = require('dns').promises;
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config({ path: '../.env.dev' });
const schedule = require('node-schedule');
const path = require('path');
const { scheduleTemporaryFileCleanup } = require('./services/cleanService.js');

const router = require('./routes/index.js');
const config = require('./config/config.js')[process.env.NODE_ENV || 'development'];
const querycacheMiddleware = require('./middlewares/querycache.js');
const globalRateLimiter = require('./middlewares/rateLimiter.js');

const socketHandler = require('./socket/socketHandler.js');

const logger = require('./utils/logger.js');
const { runBackup, cleanupOldBackupsOnAzure } = require('./services/backupService.js');
const metricsRouter = require('../src/routes/metrics.route.js');

dotenv.config();

const app = express();
const port = 8000;
const server = http.createServer(app);
app.use(helmet());

const metrics = {
  responseTime: 0,
};

//app.use(cookieParser());
app.use(express.json()); // Pour parser le JSON dans les requêtes
app.use(express.urlencoded({ extended: true })); // Pour parser les données de formulaire
//const csrfProtection = csurf({ cookie: true });
//app.use(csrfProtection);
app.use(globalRateLimiter);

// Set up CORS options
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  // credentials: true,
};
const io = new Server(server, {
  cors: corsOptions,
});

socketHandler(io);

// Enable CORS
app.use(cors(corsOptions));

/*app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
}); */

// Gestion des erreurs CSRF
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'Token CSRF invalide ou manquant.' });
  }
  next(err);
});
// Database connection function
async function connectWithRetry() {
  const pRetry = (await import('p-retry')).default;
  return pRetry(
    () =>
      mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }),
    {
      retries: 3,
      onFailedAttempt: (error) => {
        console.log(`Tentative ${error.attemptNumber} échouée. Erreur: ${error.message}`);
      },
    }
  );
}

// Configuration de la sauvegarde
const backupConfig = {
  containerName: process.env.AZURE_CONTAINER_NAME_BACKUP, // Nom du conteneur Azure
  notificationUrl: process.env.NOTIFICATION_URL, // URL de notification (ntfy.sh)
};

// Application initialization function
const initializeApp = async () => {
  try {
    // Step 1: Connect to the database
    await connectWithRetry()
      .then(() => console.log('Connecté à MongoDB'))
      .catch((err) => console.error('Impossible de se connecter après 3 tentatives.', err));
    mongoose.set('debug', true); // Temps d'exécution des requêtes de base de données

    // Step 2: Schedule the backup process to run daily at midnight
    schedule.scheduleJob('0 0 * * *', () => {
      console.log('Démarrage de la sauvegarde automatisée...');
      runBackup(backupConfig)
        .then(() => console.log('Sauvegarde terminée avec succès.'))
        .catch((err) => console.error('Erreur lors de la sauvegarde:', err));
    });

    // Step 3: Schedule the cleanup process for Azure backups
    schedule.scheduleJob('0 0 * * *', async () => {
      console.log('Démarrage du nettoyage des sauvegardes sur Azure...');
      try {
        await cleanupOldBackupsOnAzure();
        console.log('Nettoyage des sauvegardes sur Azure terminé avec succès.');
      } catch (error) {
        console.error('Erreur lors du nettoyage des sauvegardes sur Azure:', error);
      }
    });

    logger.info('Application initialisée avec succès');
  } catch (error) {
    logger.error('Initialization failed:', error);
  }
};

app.use(express.json());

/*app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
// Gestion des erreurs CSRF
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
      return res.status(403).json({ message: 'Token CSRF invalide ou manquant.' });
  }
  next(err);
});*/
//app.use(measureResponseTime);
app.use(trackBandwidth);
app.use(trackSuccessFailure);
// Routes

app.use('/api', router);
app.use(
  timeout.handler({
    timeout: 10000,
    onTimeout: (req, res) => {
      res.status(503).json({ error: 'Requête expirée, veuillez réessayer plus tard.' });
    },
    disable: ['write', 'setHeaders'], // Empêche de modifier les headers après timeout
  })
);
app.use((err, req, res, next) => {
  if (err.code === 'ETIMEDOUT') {
    return res.status(504).json({ error: 'Timeout serveur, veuillez réessayer plus tard.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

app.use(querycacheMiddleware);
app.use('/metrics', metricsRouter);
const startServer = async () => {
  initializeApp();
  // const redisUrlEx = process.env.REDIS_URL_EX;

  // redisClient = await connectRedis(redisUrlEx);

   
  // Start Express server
  server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
};

process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

startServer();
