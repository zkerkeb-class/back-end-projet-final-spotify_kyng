const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Define the upload directory path
const uploadDir = path.join(__dirname, '..', 'uploads');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create Multer instance with file size limits and file type validation
const upload = multer({
  storage: storage,  // Use the storage configuration here
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp3|m4a|wav|flac/i; // Case-insensitive regex
    const extname = allowedTypes.test(path.extname(file.originalname));
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only audio files are allowed'));
  }
});

// Middleware to handle audio uploads
const audioMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific errors (e.g., file size exceeded)
      console.error('Multer error:', err.message);
      return res.status(400).json({
        error: 'Upload error',
        details: err.message
      });
    } else if (err) {
      // General errors
      console.error('Server error during file upload:', err.message);
      return res.status(500).json({
        error: 'Server error',
        details: err.message
      });
    }

    if (!req.file) {
      // No file uploaded
      console.error('No file was uploaded');
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    // Attach file details to the request for further processing
    req.uploadedFile = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    console.log('File uploaded successfully:', req.uploadedFile);
    next();
  });

};

module.exports = audioMiddleware;
