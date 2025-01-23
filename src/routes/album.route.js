// routes/seedRoutes.js
const express = require('express');
const router = express.Router();
const albumController = require('../controllers/album.controller');
const authMiddleware = require('../middlewares/authMiddleware');

// Route pour créer un nouvel album
router.post('/', albumController.createAlbum);

// Route pour obtenir tous les albums avec pagination
router.get('/', albumController.getAllAlbum);

// Route pour obtenir un album spécifique par ID
router.get('/:id', albumController.getAlbumById);

// Route pour mettre à jour un album par ID
router.put('/:id', albumController.updatedAlbum);

// Route pour supprimer un album par ID
router.delete('/:id', albumController.deleteAlbum);

// Route pour obtenir tous les albums d'un artiste avec pagination
router.get('/artist/:artistId', albumController.getAlbumsByArtist);

// Route pour obtenir tous les albums d'un genre spécifique avec pagination
router.get('/genre/:genre', albumController.getAlbumsByGenre);

// router.get('/genre/:genre', authMiddleware, controller.getAlbumsByGenre);

module.exports = router;
