// routes/seedRoutes.js
const express = require('express');
const router = express.Router();
const { seedDatabase } = require('../controllers/seed.controller');
const audioMiddleware = require('../cdn/middlewares/audioMiddleware');
const { seedDatabaseFromAudioFiles } = require('../services/seedService');

const path = require('path');  // Import path module
const { optimizeAudio } = require('../cdn/scripts/audioOptimizer');

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
    const uploadedFiles = req.uploadedFiles; // This will be an array of files

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log('Uploaded files:', uploadedFiles); // Shows all uploaded file details

    // Directories for processing
    const uploadDir = path.join(__dirname, '..', 'uploads');
    const optimizedDir = path.join(__dirname, '..', 'optimized');

    // Process the uploaded files
    const results = await Promise.all(
      uploadedFiles.map(async (uploadedFile) => {
        // Optimize and process each file
        const optimizedPath = await optimizeAudio(uploadedFile.path, optimizedDir, 'medium');
        console.log('Optimized file saved at:', optimizedPath);

        // Assuming you seed the database with the file details
        const result = await seedDatabaseFromAudioFiles(optimizedPath, uploadDir, optimizedDir);
        return result;
      })
    );

    const totalTracks = results.reduce((acc, result) => acc + result.totalTracks, 0);
    const processedTracks = results.reduce((acc, result) => acc.concat(result.processedTracks), []);

    res.json({
      message: 'Music files processed successfully',
      totalTracks,
      processedTracks: processedTracks.length,
    });
  } catch (error) {
    console.error('Error processing music files:', error.message);
    res.status(500).json({
      error: 'Failed to process music files',
      details: error.message,
    });
  }
});





module.exports = router;