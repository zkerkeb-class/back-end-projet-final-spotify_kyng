const express = require('express');
const router = express.Router();
const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');

// Config Azure Blob Storage
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = 'spotify-image';

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

// Route pour servir les images
router.get('/image/:filename', async (req, res) => {
  const filename = req.params.filename;

  try {
    const blobClient = containerClient.getBlockBlobClient(filename);

    // Vérifiez si le blob existe
    const exists = await blobClient.exists();
    if (!exists) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Récupérez le blob (l'image)
    const downloadBlockBlobResponse = await blobClient.download();
    const contentType = downloadBlockBlobResponse.contentType;

    // Définissez les en-têtes de la réponse
    res.setHeader('Content-Type', contentType);

    // Envoyez l'image au client
    downloadBlockBlobResponse.readableStreamBody.pipe(res);
  } catch (error) {
    console.error(`Error fetching image: ${error.message}`);
    res.status(500).json({ error: 'Error fetching the image' });
  }
});

module.exports = router;