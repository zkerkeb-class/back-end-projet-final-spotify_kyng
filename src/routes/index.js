const express = require('express');
const router = express.Router();
const { 
  generateMp3MetadataController,
  bulkGenerateMp3MetadataController 
} = require('../controllers/songGenerator.controller');
const { seedDatabase } = require('../controllers/seed.controller');
const seedRoutes = require('../routes/seed.route');
const globalRateLimiter = require('../middlewares/rateLimiter');
const routeTest = require('./testroute');

// // Route for generating a specific number of MP3 metadata entries
// router.get('/song', generateMp3MetadataController);

// // Route for bulk generation of MP3 metadata entries
// router.get('/song/bulk', bulkGenerateMp3MetadataController);

router.use('/seed', seedRoutes);

router.use(globalRateLimiter); // Appliquer le middleware de rate limiting globalement
router.use(routeTest);

module.exports = router;