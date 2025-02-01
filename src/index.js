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

const path = require('path');
// const scheduleBackup = require('./services/backupService.js');
const { scheduleTemporaryFileCleanup } = require('./services/cleanService.js');

const router = require('./routes/index.js');
const config = require('./config/config.js')[process.env.NODE_ENV || 'development'];
const querycacheMiddleware = require('./middlewares/querycache.js');
const globalRateLimiter = require('./middlewares/rateLimiter.js');
const socketHandler = require('./socket/socketHandler.js');

dotenv.config();

const app = express();
const port = 8000;
const server = http.createServer(app);
app.use(helmet());

/*app.use(responseTime((req, res, time) => {
  console.log(`Requête ${req.method} ${req.url} - Temps de réponse : ${time.toFixed(2)} ms`);
}));*/
const metrics = {
  responseTime: 0, // Initialiser le temps de réponse à 0
};

// Middleware pour mesurer le temps de réponse
app.use(responseTime((req, res, time) => {
  metrics.responseTime = time; // Mettre à jour le temps de réponse dans l'objet global
  console.log(`Requête ${req.method} ${req.url} - Temps de réponse : ${time.toFixed(2)} ms`);
}));

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

// Enable CORS
app.use(cors(corsOptions));

const io = new Server(server);
socketHandler(io);

// Database connection function
/*const connectDB = async () => {
  try {
    await mongoose.connect(config.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 5000, 
      socketTimeoutMS: 45000,// timeout pour les req si une req prend plus de 45s elle sera annulee
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};*/
async function connectWithRetry() {
  const pRetry = (await import('p-retry')).default;
  return pRetry(() => mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }), {
    retries: 3,
    onFailedAttempt: (error) => {
      console.log(`Tentative ${error.attemptNumber} échouée. Erreur: ${error.message}`);
    },
  });
}

// Application initialization function
const initializeApp = async () => {
  try {
    // Step 1: Connect to the database
    //await connectDB();
    await connectWithRetry()
      .then(() => console.log('Connecté à MongoDB'))
      .catch(err => console.error('Impossible de se connecter après 3 tentatives.', err));
    mongoose.set('debug', true);//Temps d'exécution des requêtes de base de données

    // Step 2: Configure and start the backup service
    // const backupConfig = {
    //   backupDir: path.join(__dirname, 'backups'),
    //   s3Bucket: process.env.S3_BUCKET_NAME,
    //   dbName: process.env.DB_NAME,
    //   notificationUrl: process.env.NOTIFICATION_URL,
    // };

    // const backupService = new BackupService(backupConfig);
    // backupService.scheduleBackup(); // Schedule backups to run periodically

    // scheduleBackup(backupConfig);
    scheduleTemporaryFileCleanup(path.join(__dirname, 'temp'), 7);

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Initialization failed:', error);
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
app.get('/api/response-time', (req, res) => {
  const responseTimeData = {
    responseTime: metrics.responseTime, // Récupérer le temps de réponse
  };
  res.json(responseTimeData); // Renvoyer le temps de réponse au format JSON
});
// Routes

app.use('/api', router);
app.use(timeout.handler({
  timeout: 10000,
  onTimeout: (req, res) => {
    res.status(503).json({ error: 'Requête expirée, veuillez réessayer plus tard.' });
  },
  disable: ['write', 'setHeaders'], // Empêche de modifier les headers après timeout
}));
app.use((err, req, res, next) => {
  if (err.code === 'ETIMEDOUT') {
    return res.status(504).json({ error: 'Timeout serveur, veuillez réessayer plus tard.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

app.use(querycacheMiddleware);

const startServer = async () => {
  initializeApp();
  // const redisUrlEx = process.env.REDIS_URL_EX;

  // redisClient = await connectRedis(redisUrlEx);



  // Start Express server
  app.listen(port, () => {
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

