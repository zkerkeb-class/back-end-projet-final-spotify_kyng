const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlist.controller');

// Route for "Dernières écoutes" playlist
router.get('/last-played', playlistController.getLastPlayedPlaylist);

// Route for "Les plus écoutées" playlist
router.get('/most-played', playlistController.getMostPlayedPlaylist);

// Route pour créer une playlist
router.post('/', playlistController.createPlaylist);

// Route pour récupérer toutes les playlists avec pagination
router.get('/', playlistController.getAllPlaylist);

// Route pour récupérer une playlist par ID
router.get('/:id', playlistController.getPlaylistById);

// Route pour mettre à jour une playlist
router.put('/:id', playlistController.updatedPlaylist);

// Route pour supprimer une playlist
router.delete('/:id', playlistController.deletePlaylist);

router.post('/:playlistId/tracks', playlistController.addTrackToPlaylist);

module.exports = router;
