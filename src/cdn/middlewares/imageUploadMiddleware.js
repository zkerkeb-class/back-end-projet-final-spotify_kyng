// imageUpload.js

const multer = require('multer');
const { generateOptimizedVersions } = require('../../services/optimizedImageService');
const logger = require('../../utils/logger');
const path = require('path');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'cdn', 'uploadsImage')); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

const upload = multer({ storage });

// Middleware to optimize uploaded images
const imageUploadMiddleware = async (req, res, next) => {
  console.log('Uploaded file:', req.file);
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const version = req.body.imageVersion || '400'; // Default to 400 if not specified
    // Generate optimized image versions
    const optimizedImages = await generateOptimizedVersions(req.file.path);

    if (!optimizedImages.succes) {
      return res.status(500).json({ error: 'Image optimization failed' });
    }

    // Attach optimized image data to the request
    // req.optimizedImages = optimizedImages.versions;
    req.optimizedImages = optimizedImages.versions.filter(img => 
      img.taille === version && img.format === 'jpeg'
    );
    next(); // Pass control to the next middleware/handler
  } catch (error) {
    logger.error(`Error in imageUploadMiddleware: ${error.message}`);
    res.status(500).json({ error: 'Error processing the uploaded image' });
  }
};

module.exports = {
  upload,
  imageUploadMiddleware,
};
