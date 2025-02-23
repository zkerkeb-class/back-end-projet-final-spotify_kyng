const express = require('express');
const router = express.Router();
const seedRoutes = require('../routes/seed.route');
const albumRoutes = require('../routes/album.route');
const artistRoutes = require('../routes/artist.route');
const routeTest = require('./test.route');
const tracksRoute = require('./track.route');
const playlistRoutes = require('./playlist.route');
const authRoutes = require('./auth.route');
const testauth = require('./testauth');
const metricsRoutes = require('./metrics.route');
const searchRoutes = require('./search.route');

const roomRoutes = require('./room.route');
const imageRoutes = require('./image.route');
const imagecloudRoutes = require('./imagecloud.route');

router.use('/auth', authRoutes);
router.use('/testauth', testauth);
router.use('/seed', seedRoutes);
router.use('/album', albumRoutes);
router.use('/artist', artistRoutes);
router.use('/playlist', playlistRoutes);
router.use('/search', searchRoutes);
router.use('/room', roomRoutes);

router.use(routeTest);
router.use('/track', tracksRoute);
router.use('/metrics', metricsRoutes);
router.use('/images', imageRoutes);
router.use('/imagescloud', imagecloudRoutes);
module.exports = router;
