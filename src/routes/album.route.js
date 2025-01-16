// routes/seedRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/album.controller');

router.get('/genre/:genre', controller.getAlbumsByGenre);





module.exports = router;