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
  console.log('Uploaded file:', req.file);
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
     // Générer un nom de fichier unique
    const fileName = `${uuidv4()}-${req.file.originalname}`;
    const blobClient = containerClient.getBlockBlobClient(fileName);
    
     // Upload dans Azure Blob Storage
    await blobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype },
    });
    console.log("Image uploaded to Azure Blob Storage:", blobClient.url);
      // Générer l'URL CloudFront (on stocke juste le nom en BDD)
    //const cloudfrontUrl = `https://${CLOUDFRONT_URL}/${fileName}`;
    const azureBlobUrl = `${blobClient.url}?${AZURE_SAS_TOKEN_IMAGE}`;
    const cloudfrontUrl = `https://${CLOUDFRONT_URL}/spotify-image/${fileName}`;
     // Ajouter l'URL à la requête pour la sauvegarde en BDD
     req.imageUrl = {
      azure: azureBlobUrl,  
      cloudfront: cloudfrontUrl
     }

    //const version = req.body.imageVersion || '400'; // Default to 400 if not specified
    // Generate optimized image versions
    //  Correction: Passer le buffer pour la génération des versions optimisées
    const optimizedImages = await generateOptimizedVersions(req.file.buffer, req.file.originalname);

    if (!optimizedImages.succes || !optimizedImages.versions || optimizedImages.versions.length === 0) {
      return res.status(500).json({ error: 'Image optimization failed' });
    }

    // Attach optimized image data to the request
    // req.optimizedImages = optimizedImages.versions;
    //  Correction: Stocker l'image principale et les versions optimisées
    /*req.optimizedImages = optimizedImages.versions.filter(img => 
      img.taille === version && img.format === 'jpeg'
    );*/
    req.optimizedImages = [
      { url: cloudfrontUrl }, 
      { url: azureBlobUrl },// L'image originale sur CloudFront
      ...optimizedImages.versions.map(img => {
        const filePath = path.basename(img.path); 
        const url = `https://${CLOUDFRONT_URL}/${filePath}`; 
        return {
          url: url,
          taille: img.taille,
          format: img.format,
        };
      })
    ];
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
