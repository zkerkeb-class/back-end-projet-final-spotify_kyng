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
    // Since you're uploading a single file, use req.file instead of req.files
    const uploadedFile = req.uploadedFile; // Assuming middleware attaches the uploaded file here

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('Uploaded file:', uploadedFile); // This should show the file details

    // Directories for processing
    const uploadDir = path.join(__dirname, '..', 'uploads');
    const optimizedDir = path.join(__dirname, '..', 'optimized');

    // Process the uploaded file
    const optimizedPath = await optimizeAudio(uploadedFile.path, optimizedDir, 'medium');
    console.log('Optimized file saved at:', optimizedPath);

    // Assuming you seed the database with the file details
    const result = await seedDatabase([uploadedFile], uploadDir, optimizedDir);

    res.json({
      message: 'Music file processed successfully',
      totalTracks: result.totalTracks,
      processedTracks: result.processedTracks,
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