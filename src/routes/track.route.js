const express = require('express');
const {
  createTrack,
  getAllTrack,
  getTrackById,
  updatedTrack,
  deleteTrack,
  getTracksByArtist,
  getTracksByAlbum,
  getTracksByGenre,
  getTracksByYear,
  streamTrack,
  getTrackByTitle,
  getTop10TracksByReleaseDate,
  advancedFilter,
} = require('../controllers/track.controller');
const audioMiddleware = require('../cdn/middlewares/audioMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/filter', advancedFilter);

router.post(
  '/:albumId',
  authMiddleware,
  checkPermission(['upload_music']),
  audioMiddleware,
  createTrack
);

// Route for getting all tracks
router.get('/', getAllTrack);

// Route for getting a specific track by ID
router.get('/:id', getTrackById);

// Route for getting a specific track by Title
router.get('/title/:title', getTrackByTitle);

// Route for updating a track
router.patch('/:id', authMiddleware, checkPermission(['edit_metadata']), audioMiddleware, updatedTrack);

// Route for deleting a track
router.delete('/:id', authMiddleware, checkPermission(['delete_music']), deleteTrack);

// Route for getting tracks by artist
router.get('/artist/:artistId', getTracksByArtist);

// Route for getting tracks by album
router.get('/album/:albumId', getTracksByAlbum);

// Route for getting tracks by genre
router.get('/genre/:genre', getTracksByGenre);

router.get('/year/:year', getTracksByYear);

router.get('/top/10-recent-tracks', getTop10TracksByReleaseDate);

//test
router.get('/stream/:filename', streamTrack); // Working http://localhost:8000/api/track/stream/audio-1734824388016-files-1734824380508-732747547.m4a
//fin

module.exports = router;
