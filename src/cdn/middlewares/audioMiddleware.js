const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const logger = require('../../utils/logger');

ffmpeg.setFfmpegPath(ffmpegPath);

// Define the upload directory paths
const uploadDir = path.join(__dirname, '..', 'uploads');
const optimizedDir = path.join(__dirname, '..', 'optimized');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure the optimized directory exists
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Create Multer instance with file size limits and file type validation
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|m4a|wav|flac/i; // Regex to allow common audio types
    const extname = allowedTypes.test(path.extname(file.originalname));
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only audio files are allowed'));
  },
});

// Middleware to handle audio uploads and convert to m4a
const audioMiddleware = (req, res, next) => {
  upload.array('files', 10)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      logger.error('Multer error:', err.message);
      return res.status(400).json({
        error: 'Upload error',
        details: err.message,
      });
    } else if (err) {
      logger.error('Server error during file upload:', err.message);
      return res.status(500).json({
        error: 'Server error',
        details: err.message,
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      console.log('No files were uploaded, proceeding without file processing');
      req.uploadedFiles = []; // Set uploadedFiles to an empty array
      return next(); // Proceed to the next middleware or controller
    }

    // Attach uploaded file information to the request
    req.uploadedFiles = req.files.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    }));

    // Convert uploaded files to m4a format
    try {
      for (const file of req.uploadedFiles) {
        const convertedPath = await convertToM4a(file.path, optimizedDir);
        file.convertedPath = convertedPath;
      }

      logger.info('Files converted to m4a format successfully');
      next();
    } catch (conversionError) {
      logger.error('Error during audio conversion:', conversionError.message);
      return res.status(500).json({
        error: 'Audio conversion failed',
        details: conversionError.message,
      });
    }
  });
};

// Function to convert any audio file to m4a using ffmpeg
async function convertToM4a(inputPath, outputDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const outputFilePath = path.join(outputDir, `${filename}.m4a`);

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
    .format('ipod') // Use ipod format which is compatible with m4a
    .noVideo() // Explicitly specify no video
    .audioCodec('aac')
    .audioBitrate('160k')
    .audioFrequency(44100)
    .audioChannels(2)
    .on('error', (err) => {
      console.error('FFmpeg error:', err);
      reject(err);
    })
    .on('end', () => {
      console.log(`Converted file saved to ${outputFilePath}`);
      resolve(outputFilePath);
    })
    .save(outputFilePath);
  });
}

module.exports = audioMiddleware;
