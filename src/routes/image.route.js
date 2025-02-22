// routes/image.route.js
const express = require('express');
const router = express.Router();
const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');

// Config Azure Blob Storage
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = 'spotify-image';

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

/**
 * @swagger
 * tags:
 *   name: Images
 *   description: Gestion des images stockées sur Azure Blob Storage
 */

/**
 * @swagger
 * /image/{filename}:
 *   get:
 *     tags: [Images]
 *     summary: Récupère une image par son nom de fichier
 *     description: Permet de récupérer une image stockée sur Azure Blob Storage en utilisant son nom de fichier.
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom du fichier de l'image
 *     responses:
 *       200:
 *         description: Image récupérée avec succès
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Image non trouvée
 *       500:
 *         description: Erreur lors de la récupération de l'image
 */
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