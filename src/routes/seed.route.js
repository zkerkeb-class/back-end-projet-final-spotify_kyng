// routes/seedRoutes.js
const express = require('express');
const router = express.Router();
const { seedDatabase } = require('../controllers/seed.controller');
const audioMiddleware = require('../cdn/middlewares/audioMiddleware');
const { seedDatabaseFromAudioFiles } = require('../services/seedService');

// const path = require('path'); // Import path module
// const { optimizeAudio } = require('../cdn/scripts/audioOptimizer');

router.post('/seed', async (req, res) => {
  const { audioDirectory } = req.body;
  try {
    await seedDatabase(audioDirectory);
    res.status(200).json({ message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload-multiple-music', audioMiddleware, async (req, res) => {
  try {
    const uploadedFiles = req.uploadedFiles;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(
      'Uploaded files:',
      uploadedFiles.map((file) => ({
        originalName: file.originalName,
        path: file.path,
        convertedPath: file.convertedPath,
      }))
    );

    const results = await Promise.all(
      uploadedFiles.map(async (uploadedFile) => {
        // Ensure we're using the converted path
        const fileToUpload = uploadedFile.convertedPath || uploadedFile.path;

        if (!fileToUpload) {
          console.error('No file path found for upload', uploadedFile);
          return null;
        }

        try {
          const result = await seedDatabaseFromAudioFiles(fileToUpload);
          return result;
        } catch (seedError) {
          console.error('Seeding error:', seedError);
          return null;
        }
      })
    );

    // Filter out any null results
    const validResults = results.filter((result) => result !== null);

    const totalTracks = validResults.reduce((acc, result) => acc + (result.totalTracks || 0), 0);
    const processedTracks = validResults.reduce(
      (acc, result) => acc + (result.processedTracks || []).length,
      0
    );

    res.json({
      message: 'Music files processed successfully',
      totalTracks,
      processedTracks,
    });
  } catch (error) {
    console.error('Error processing music files:', error);
    res.status(500).json({
      error: 'Failed to process music files',
      details: error.message,
    });
  }
});

module.exports = router;
