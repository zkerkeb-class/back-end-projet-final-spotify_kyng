const express = require('express');
const helmet = require('helmet');
//const csurf = require('csurf');
//const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
// const scheduleBackup = require('./services/backupService.js');
const { scheduleTemporaryFileCleanup } = require('./services/cleanService.js');
const cacheMiddleware = require('./middlewares/querycache.js');
const router = require('./routes/index.js');
const config = require('./config/config.js')[process.env.NODE_ENV || 'development'];
const globalRateLimiter = require('./middlewares/rateLimiter.js');

dotenv.config();

const app = express();
const port = 8000;

app.use(helmet());
//app.use(cookieParser());
app.use(express.json()); // Pour parser le JSON dans les requêtes
app.use(express.urlencoded({ extended: true })); // Pour parser les données de formulaire
//const csrfProtection = csurf({ cookie: true });
//app.use(csrfProtection);
// app.use(cacheMiddleware);

// Database connection function
const connectDB = async () => {
  try {
    await mongoose.connect(config.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Application initialization function
const initializeApp = async () => {
  try {
    // Step 1: Connect to the database
    await connectDB();

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

//middleware rate limiting application
app.use(globalRateLimiter);

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
app.use('/api', router);

const startServer = () => {
  initializeApp();

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
