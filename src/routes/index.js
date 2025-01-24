const express = require('express');
const router = express.Router();
// const {
//   generateMp3MetadataController,
//   bulkGenerateMp3MetadataController,
// } = require('../controllers/songGenerator.controller');
// const { seedDatabase } = require('../controllers/seed.controller');
const seedRoutes = require('../routes/seed.route');
const albumRoutes = require('../routes/album.route');
//const globalRateLimiter = require('../middlewares/rateLimiter');
const routeTest = require('./test.route');
const tracksRoute = require('./track.route');
const authRoutes = require('./auth.route');
const testauth = require('./testauth');

// // Route for generating a specific number of MP3 metadata entries
// router.get('/song', generateMp3MetadataController);

// // Route for bulk generation of MP3 metadata entries
// router.get('/song/bulk', bulkGenerateMp3MetadataController);
router.use('/auth', authRoutes);
router.use('/testauth', testauth);
router.use('/seed', seedRoutes);
//router.use('/album', albumRoutes);

//router.use(globalRateLimiter);
router.use(routeTest);
router.use('/track', tracksRoute);
module.exports = router;
