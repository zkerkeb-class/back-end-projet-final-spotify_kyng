// routes/seed.route.js
const express = require('express');
const router = express.Router();
const { seedDatabase } = require('../controllers/seed.controller');
const audioMiddleware = require('../cdn/middlewares/audioMiddleware');
const { seedDatabaseFromAudioFiles } = require('../services/seedService');

/**
 * @swagger
 * tags:
 *   name: Seed
 *   description: Gestion de l'initialisation et de l'importation de données
 */

/**
 * @swagger
 * /seed/seed:
 *   post:
 *     tags: [Seed]
 *     summary: Initialise la base de données avec des données de test
 *     description: Permet d'initialiser la base de données en utilisant un répertoire audio spécifié.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               audioDirectory:
 *                 type: string
 *                 description: Chemin du répertoire contenant les fichiers audio
 *             example:
 *               audioDirectory: "/chemin/vers/les/audios"
 *     responses:
 *       200:
 *         description: Base de données initialisée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Database seeded successfully"
 *       500:
 *         description: Erreur lors de l'initialisation de la base de données
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Erreur lors de l'initialisation"
 */
router.post('/seed', async (req, res) => {
  const { audioDirectory } = req.body;
  try {
    await seedDatabase(audioDirectory);
    res.status(200).json({ message: 'Database seeded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /seed/upload-multiple-music:
 *   post:
 *     tags: [Seed]
 *     summary: Importe plusieurs fichiers audio dans la base de données
 *     description: Permet d'importer plusieurs fichiers audio dans la base de données après les avoir traités.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Fichiers audio à importer
 *     responses:
 *       200:
 *         description: Fichiers audio traités avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Music files processed successfully"
 *                 totalTracks:
 *                   type: number
 *                   description: Nombre total de morceaux traités
 *                 processedTracks:
 *                   type: number
 *                   description: Nombre de morceaux importés avec succès
 *       400:
 *         description: Aucun fichier téléchargé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "No files uploaded"
 *       500:
 *         description: Erreur lors du traitement des fichiers audio
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to process music files"
 *                 details:
 *                   type: string
 *                   example: "Détails de l'erreur"
 */
router.post('/upload-multiple-music', audioMiddleware, async (req, res) => {
  try {
    const uploadedFiles = req.uploadedFiles;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(
      'Uploaded files:',
      uploadedFiles.map((file) => ({
        originalName: file.originalName,
        path: file.path,
        convertedPath: file.convertedPath,
      }))
    );

    const results = await Promise.all(
      uploadedFiles.map(async (uploadedFile) => {
        // Ensure we're using the converted path
        const fileToUpload = uploadedFile.convertedPath || uploadedFile.path;

        if (!fileToUpload) {
          console.error('No file path found for upload', uploadedFile);
          return null;
        }

        try {
          const result = await seedDatabaseFromAudioFiles(fileToUpload);
          return result;
        } catch (seedError) {
          console.error('Seeding error:', seedError);
          return null;
        }
      })
    );

    // Filter out any null results
    const validResults = results.filter((result) => result !== null);

    const totalTracks = validResults.reduce((acc, result) => acc + (result.totalTracks || 0), 0);
    const processedTracks = validResults.reduce(
      (acc, result) => acc + (result.processedTracks || []).length,
      0
    );

    res.json({
      message: 'Music files processed successfully',
      totalTracks,
      processedTracks,
    });
  } catch (error) {
    console.error('Error processing music files:', error);
    res.status(500).json({
      error: 'Failed to process music files',
      details: error.message,
    });
  }
});

module.exports = router;