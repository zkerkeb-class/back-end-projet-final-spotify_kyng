// routes/seedRoutes.js
const express = require('express');
const router = express.Router();
const albumController = require('../controllers/album.controller');
const { imageUploadMiddleware, upload } = require('../cdn/middlewares/imageUploadMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/:artistId',authMiddleware,checkPermission(['upload_music']), upload.single('image'), imageUploadMiddleware, albumController.createAlbum);
router.get('/',albumController.getAllAlbum);
router.get('/:id', albumController.getAlbumById);
router.get('/title/:title', albumController.getAlbumByTitle);

// Route pour mettre à jour un album par ID
// router.put('/:id', albumController.updatedAlbum);
// Route pour mettre à jour un album par ID
router.put(
  '/:id',
  authMiddleware,
  checkPermission(['edit_metadata']),
  upload.single('image'),
  imageUploadMiddleware,
  albumController.updatedAlbum
);

// Route pour supprimer un album par ID
router.delete(
  '/:id',
  authMiddleware,
  checkPermission(['delete_music']),
  albumController.deleteAlbum
);

// Route pour obtenir tous les albums d'un artiste avec pagination
router.get('/artist/:artistId', albumController.getAlbumsByArtist);

// Route pour obtenir tous les albums d'un genre spécifique avec pagination
router.get('/genre/:genre', albumController.getAlbumsByGenre);

router.get('/top/10-recent-albums', albumController.getTop10RecentAlbums);

// router.get('/genre/:genre', authMiddleware, controller.getAlbumsByGenre);

module.exports = router;
