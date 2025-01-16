const express = require('express');
const { createTrack } = require('../controllers/track.controller');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
// const { cacheFileMiddleware, addFileToCache } = require('../middlewares/filecacheMiddleware');

//router.get('/track/:filename', cacheFileMiddleware, addFileToCache);
//router.get('/track', cacheFileMiddleware, addFileToCache);

router.get('/:filename', (req, res) => {
  res.send(`Fichier demandé : ${req.params.filename}`);
});

router.post('/create', async (req, res) => {
  console.log("req.file:", req.file);  // Log the uploaded file to see the content

  try {
    // Check if the file exists in the 'file' object
    if (!req.file) {
      throw new Error('Audio file is required.');
    }

    // Extract other form data from req.body
    const { title, duration, albumId, isExplicit, lyrics, artistId, collaborators, credits, numberOfListens, popularity, trackNumber } = req.body;
    const audioFile = req.file; // This will hold the uploaded audio file

    // Log the audio file data for debugging
    console.log("Audio file:", audioFile);

    // Prepare track data
    const trackData = {
      title,
      duration,
      albumId,
      isExplicit,
      lyrics,
      artistId,
      collaborators,
      credits,
      numberOfListens,
      popularity,
      trackNumber,
      audioFile,  // Add the audio file to track data
    };

    // Call the track service to create the track
    const track = await trackService.createTrack(trackData);

    console.log(`Track creation request handled successfully.`);
    res.status(201).json(track);
  } catch (error) {
    console.error(`Error in createTrack: ${error.message}.`);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
