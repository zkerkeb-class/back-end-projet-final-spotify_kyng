// routes/artist.route.js
const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artist.controller');
const authMiddleware = require('../middlewares/authMiddleware');
const { imageUploadMiddleware, upload } = require('../cdn/middlewares/imageUploadMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');

/**
 * @swagger
 * tags:
 *   name: Artists
 *   description: Gestion des artistes
 */

/**
 * @swagger
 * /artists:
 *   post:
 *     tags: [Artists]
 *     summary: Crée un nouvel artiste
 *     description: Permet de créer un nouvel artiste avec une image.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image de l'artiste
 *               name:
 *                 type: string
 *                 description: Nom de l'artiste
 *               genre:
 *                 type: string
 *                 description: Genre de l'artiste
 *     responses:
 *       201:
 *         description: Artiste créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permission refusée
 */
router.post('/', authMiddleware, checkPermission(['upload_music', 'edit_metadata']), upload.single('image'), imageUploadMiddleware, artistController.createArtist);

/**
 * @swagger
 * /artists:
 *   get:
 *     tags: [Artists]
 *     summary: Récupère tous les artistes
 *     description: Retourne la liste de tous les artistes avec pagination.
 *     responses:
 *       200:
 *         description: Liste des artistes récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Artist'
 */
router.get('/', artistController.getAllArtist);

/**
 * @swagger
 * /artists/{id}:
 *   get:
 *     tags: [Artists]
 *     summary: Récupère un artiste par son ID
 *     description: Retourne les détails d'un artiste spécifique.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'artiste
 *     responses:
 *       200:
 *         description: Artiste récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Artist'
 *       404:
 *         description: Artiste non trouvé
 */
router.get('/:id', artistController.getArtistById);

/**
 * @swagger
 * /artists/name/{name}:
 *   get:
 *     tags: [Artists]
 *     summary: Récupère un artiste par son nom
 *     description: Retourne les détails d'un artiste en fonction de son nom.
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom de l'artiste
 *     responses:
 *       200:
 *         description: Artiste récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Artist'
 *       404:
 *         description: Artiste non trouvé
 */
router.get('/name/:name', artistController.getArtistByName);

/**
 * @swagger
 * /artists/{id}:
 *   put:
 *     tags: [Artists]
 *     summary: Met à jour un artiste par son ID
 *     description: Permet de mettre à jour les métadonnées d'un artiste existant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'artiste
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Nouvelle image de l'artiste
 *               name:
 *                 type: string
 *                 description: Nouveau nom de l'artiste
 *               genre:
 *                 type: string
 *                 description: Nouveau genre de l'artiste
 *     responses:
 *       200:
 *         description: Artiste mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permission refusée
 *       404:
 *         description: Artiste non trouvé
 */
router.put('/:id', authMiddleware, checkPermission(['edit_metadata']), upload.single('image'), imageUploadMiddleware, artistController.updatedArtist);

/**
 * @swagger
 * /artists/{id}:
 *   delete:
 *     tags: [Artists]
 *     summary: Supprime un artiste par son ID
 *     description: Permet de supprimer un artiste existant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'artiste
 *     responses:
 *       200:
 *         description: Artiste supprimé avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permission refusée
 *       404:
 *         description: Artiste non trouvé
 */
router.delete('/:id', authMiddleware, checkPermission(['delete_music']), artistController.deleteArtist);

/**
 * @swagger
 * /artists/genre/{genre}:
 *   get:
 *     tags: [Artists]
 *     summary: Récupère les artistes par genre
 *     description: Retourne la liste des artistes appartenant à un genre spécifique.
 *     parameters:
 *       - in: path
 *         name: genre
 *         required: true
 *         schema:
 *           type: string
 *         description: Genre de l'artiste
 *     responses:
 *       200:
 *         description: Liste des artistes récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Artist'
 *       404:
 *         description: Aucun artiste trouvé pour ce genre
 */
router.get('/genre/:genre', artistController.getArtistsByGenre);

/**
 * @swagger
 * /artists/top/10-popular-artists:
 *   get:
 *     tags: [Artists]
 *     summary: Récupère les 10 artistes les plus populaires
 *     description: Retourne les 10 artistes les plus écoutés.
 *     responses:
 *       200:
 *         description: Liste des 10 artistes les plus populaires
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Artist'
 */
router.get('/top/10-popular-artists', artistController.getTop10ArtistsByListens);

module.exports = router;