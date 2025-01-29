// routes/seedRoutes.js
const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artist.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const {imageUploadMiddleware, upload} = require('../cdn/middlewares/imageUploadMiddleware');


// Route pour créer un nouvel artiste
// router.post('/', artistController.createArtist);
router.post('/', upload.single('image'), imageUploadMiddleware, artistController.createArtist);


// Route pour obtenir tous les artistes avec pagination
router.get('/', artistController.getAllArtist);

// Route pour obtenir un artiste spécifique par ID
router.get('/:id', artistController.getArtistById);

// Route for getting a specific artist by Title
router.get('/name/:name', artistController.getArtistByName);

// Route pour mettre à jour un artiste par ID
// router.put('/:id', artistController.updatedArtist);
router.put('/:id', upload.single('image'), imageUploadMiddleware, artistController.updatedArtist);


// Route pour supprimer un artiste par ID
router.delete('/:id', artistController.deleteArtist);

// Route pour obtenir les artistes par genre avec pagination
router.get('/genre/:genre', artistController.getArtistsByGenre);

router.get('/top/10-popular-artists', artistController.getTop10ArtistsByListens);

module.exports = router;
