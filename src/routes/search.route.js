const express = require('express');
const router = express.Router();
const albumController = require('../controllers/album.controller');
const searchController = require('../controllers/search.controller');

router.get('/albums', albumController.searchAlbums);

// test
router.get('/albums', albumController.searchAlbums);
router.get('/', searchController.search);
// fin test

module.exports = router;
