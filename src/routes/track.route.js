const express = require('express');
const { createTrack, getAllTrack, getTrackById, updatedTrack, deleteTrack, getTracksByArtist, getTracksByAlbum, getTracksByGenre, getTracksByYear } = require('../controllers/track.controller');
const audioMiddleware = require('../cdn/middlewares/audioMiddleware'); 
const router = express.Router();


router.post('/create', audioMiddleware, createTrack);

// Route for getting all tracks
router.get('/', getAllTrack);

// Route for getting a specific track by ID
router.get('/:id', getTrackById);

// Route for updating a track
router.patch('/:id', updatedTrack);

// Route for deleting a track
router.delete('/:id', deleteTrack);

// Route for getting tracks by artist
router.get('/artist/:artistId', getTracksByArtist);

// Route for getting tracks by album
router.get('/album/:albumId', getTracksByAlbum);

// Route for getting tracks by genre
router.get('/genre/:genre', getTracksByGenre);

router.get('/year/:year', getTracksByYear);


module.exports = router;
