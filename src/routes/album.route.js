// routes/album.route.js
const express = require('express');
const router = express.Router();
const albumController = require('../controllers/album.controller');
const { imageUploadMiddleware, upload } = require('../cdn/middlewares/imageUploadMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Albums
 *   description: Gestion des albums
 */

/**
 * @swagger
 * /albums/{artistId}:
 *   post:
 *     tags: [Albums]
 *     summary: Crée un nouvel album pour un artiste
 *     description: Permet à un artiste de créer un nouvel album avec une image.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
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
 *                 description: Image de l'album
 *               title:
 *                 type: string
 *                 description: Titre de l'album
 *               genre:
 *                 type: string
 *                 description: Genre de l'album
 *     responses:
 *       201:
 *         description: Album créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permission refusée
 */
router.post('/:artistId', authMiddleware, checkPermission(['upload_music']), upload.single('image'), imageUploadMiddleware, albumController.createAlbum);

/**
 * @swagger
 * /albums:
 *   get:
 *     tags: [Albums]
 *     summary: Récupère tous les albums
 *     description: Retourne la liste de tous les albums disponibles.
 *     responses:
 *       200:
 *         description: Liste des albums récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Album'
 */
router.get('/', albumController.getAllAlbum);

/**
 * @swagger
 * /albums/{id}:
 *   get:
 *     tags: [Albums]
 *     summary: Récupère un album par son ID
 *     description: Retourne les détails d'un album spécifique.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'album
 *     responses:
 *       200:
 *         description: Album récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Album'
 *       404:
 *         description: Album non trouvé
 */
router.get('/:id', albumController.getAlbumById);

/**
 * @swagger
 * /albums/title/{title}:
 *   get:
 *     tags: [Albums]
 *     summary: Récupère un album par son titre
 *     description: Retourne les détails d'un album en fonction de son titre.
 *     parameters:
 *       - in: path
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: Titre de l'album
 *     responses:
 *       200:
 *         description: Album récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Album'
 *       404:
 *         description: Album non trouvé
 */
router.get('/title/:title', albumController.getAlbumByTitle);

/**
 * @swagger
 * /albums/{id}:
 *   put:
 *     tags: [Albums]
 *     summary: Met à jour un album par son ID
 *     description: Permet de mettre à jour les métadonnées d'un album existant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'album
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
 *                 description: Nouvelle image de l'album
 *               title:
 *                 type: string
 *                 description: Nouveau titre de l'album
 *               genre:
 *                 type: string
 *                 description: Nouveau genre de l'album
 *     responses:
 *       200:
 *         description: Album mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permission refusée
 *       404:
 *         description: Album non trouvé
 */
router.put('/:id', authMiddleware, checkPermission(['edit_metadata']), upload.single('image'), imageUploadMiddleware, albumController.updatedAlbum);

/**
 * @swagger
 * /albums/{id}:
 *   delete:
 *     tags: [Albums]
 *     summary: Supprime un album par son ID
 *     description: Permet de supprimer un album existant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'album
 *     responses:
 *       200:
 *         description: Album supprimé avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permission refusée
 *       404:
 *         description: Album non trouvé
 */
router.delete('/:id', authMiddleware, checkPermission(['delete_music']), albumController.deleteAlbum);

/**
 * @swagger
 * /albums/artist/{artistId}:
 *   get:
 *     tags: [Albums]
 *     summary: Récupère tous les albums d'un artiste
 *     description: Retourne la liste des albums d'un artiste spécifique.
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'artiste
 *     responses:
 *       200:
 *         description: Liste des albums récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Album'
 *       404:
 *         description: Aucun album trouvé pour cet artiste
 */
router.get('/artist/:artistId', albumController.getAlbumsByArtist);

/**
 * @swagger
 * /albums/genre/{genre}:
 *   get:
 *     tags: [Albums]
 *     summary: Récupère tous les albums d'un genre spécifique
 *     description: Retourne la liste des albums appartenant à un genre spécifique.
 *     parameters:
 *       - in: path
 *         name: genre
 *         required: true
 *         schema:
 *           type: string
 *         description: Genre de l'album
 *     responses:
 *       200:
 *         description: Liste des albums récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Album'
 *       404:
 *         description: Aucun album trouvé pour ce genre
 */
router.get('/genre/:genre', albumController.getAlbumsByGenre);

/**
 * @swagger
 * /albums/top/10-recent-albums:
 *   get:
 *     tags: [Albums]
 *     summary: Récupère les 10 albums les plus récents
 *     description: Retourne les 10 albums les plus récemment ajoutés.
 *     responses:
 *       200:
 *         description: Liste des 10 albums les plus récents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Album'
 */
router.get('/top/10-recent-albums', albumController.getTop10RecentAlbums);

module.exports = router;