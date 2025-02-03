const multer = require('multer');
const { generateOptimizedVersions } = require('../../services/optimizedImageService');
const logger = require('../../utils/logger');
const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Config Azure Blob Storage
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_SAS_TOKEN_IMAGE = process.env.AZURE_STORAGE_SAS_TOKEN_IMAGE;
const CONTAINER_NAME = 'spotify-image';
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

// Configure Multer for file uploads (in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to optimize uploaded images
const imageUploadMiddleware = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }

    // Generate a unique filename
    const fileName = `${uuidv4()}-${req.file.originalname}`;
    const blobClient = containerClient.getBlockBlobClient(fileName);

    // Upload to Azure Blob Storage
    await blobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });
    logger.info('Image uploaded to Azure Blob Storage:', blobClient.url);

    // Generate CloudFront URL
    const azureBlobUrl = `${blobClient.url}?${AZURE_SAS_TOKEN_IMAGE}`;
    const cloudfrontUrl = `https://${CLOUDFRONT_URL}/spotify-image/${fileName}`;

    // Add the URL to the request for saving in the database
    req.imageUrl = {
      azure: azureBlobUrl,
      cloudfront: cloudfrontUrl,
    };

    // Generate optimized image versions
    const optimizedImages = await generateOptimizedVersions(req.file.buffer, req.file.originalname);

    if (
      !optimizedImages.success ||
      !optimizedImages.versions ||
      optimizedImages.versions.length === 0
    ) {
      return res.status(500).json({ error: 'Image optimization failed' });
    }

    // Attach optimized image data to the request
    req.optimizedImages = [
      { url: cloudfrontUrl },
      { url: azureBlobUrl },
      ...optimizedImages.versions.map((img) => {
        const filePath = path.basename(img.path);
        const url = `https://${CLOUDFRONT_URL}/${filePath}`;
        return {
          url: url,
          taille: img.taille,
          format: img.format,
        };
      }),
    ];

    next();
  } catch (error) {
    logger.error(`Error in imageUploadMiddleware: ${error.message}`);
    res.status(500).json({ error: 'Error processing the uploaded image' });
  }
};

module.exports = {
  upload,
  imageUploadMiddleware,
};
