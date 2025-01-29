// routes/seedRoutes.js
const express = require('express');
const router = express.Router();
const albumController = require('../controllers/album.controller');
const {imageUploadMiddleware, upload} = require('../cdn/middlewares/imageUploadMiddleware');

// Route pour créer un nouvel album
// router.post('/', albumController.createAlbum);

    
// router.post('/', upload.single('image'), imageUploadMiddleware, albumController.createAlbum);
router.post('/:artistId', upload.single('image'), imageUploadMiddleware, albumController.createAlbum);
// router.post('/', (req, res, next) => {
//   upload(req, res, (err) => {
//     if (err) {
//       return res.status(400).json({ error: 'File upload error', message: err.message });
//     }
//     next(); // Proceed to the next middleware (imageUploadMiddleware)
//   });
// }, imageUploadMiddleware, albumController.createAlbum);


// Route pour obtenir tous les albums avec pagination
router.get('/', authMiddleware,albumController.getAllAlbum);

// Route pour obtenir un album spécifique par ID
router.get('/:id', albumController.getAlbumById);

// Route for getting a specific album by Title
router.get('/title/:title', albumController.getAlbumByTitle);

// Route pour mettre à jour un album par ID
// router.put('/:id', albumController.updatedAlbum);
// Route pour mettre à jour un album par ID
router.put('/:id', upload.single('image'), imageUploadMiddleware, albumController.updatedAlbum);


// Route pour supprimer un album par ID
router.delete('/:id', albumController.deleteAlbum);

// Route pour obtenir tous les albums d'un artiste avec pagination
router.get('/artist/:artistId', albumController.getAlbumsByArtist);

// Route pour obtenir tous les albums d'un genre spécifique avec pagination
router.get('/genre/:genre', albumController.getAlbumsByGenre);

router.get('/top/10-recent-albums', albumController.getTop10RecentAlbums);

// router.get('/genre/:genre', authMiddleware, controller.getAlbumsByGenre);

module.exports = router;
