const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ffmpegPath = require('ffmpeg-static'); // Import static ffmpeg binary path
const ffmpeg = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegPath); // Set the path for fluent-ffmpeg  // Required for audio conversion

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
  console.log('IN: ', req.files);

  upload.array('files', 10)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err.message);
      return res.status(400).json({
        error: 'Upload error',
        details: err.message,
      });
    } else if (err) {
      console.error('Server error during file upload:', err.message);
      return res.status(500).json({
        error: 'Server error',
        details: err.message,
      });
    }

    // If no files are uploaded, proceed to the next middleware/controller
    if (!req.files || req.files.length === 0) {
      console.log('No files uploaded, proceeding without audio updates');
      return next();
    }

    // Attach uploaded file information to the request
    req.uploadedFiles = req.files.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    }));

    console.log('Files uploaded successfully:', req.uploadedFiles);

    // Convert uploaded files to m4a format
    try {
      for (const file of req.uploadedFiles) {
        const convertedPath = await convertToM4a(file.path, optimizedDir);
        file.convertedPath = convertedPath; // Attach the converted path to the file info
      }

      console.log('Files converted to m4a format successfully');
      next(); // Proceed to the next middleware or controller
    } catch (conversionError) {
      console.error('Error during audio conversion:', conversionError.message);
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
      .audioCodec('aac')
      .audioBitrate('160k')
      .audioFrequency(44100)
      .audioChannels(2)
      .on('end', () => {
        console.log(`Converted file saved to ${outputFilePath}`);
        resolve(outputFilePath);
      })
      .on('error', (err) => {
        console.error('Error during audio conversion:', err.message);
        reject(err);
      })
      .save(outputFilePath);
  });
}

module.exports = audioMiddleware;