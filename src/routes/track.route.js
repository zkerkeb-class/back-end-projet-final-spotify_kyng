// routes/track.route.js
const express = require('express');
const {
  createTrack,
  getAllTrack,
  getTrackById,
  updatedTrack,
  deleteTrack,
  getTracksByArtist,
  getTracksByAlbum,
  getTracksByGenre,
  getTracksByYear,
  streamTrack,
  getTrackByTitle,
  getTop10TracksByReleaseDate,
  advancedFilter,
} = require('../controllers/track.controller');
const audioMiddleware = require('../cdn/middlewares/audioMiddleware');
const checkPermission = require('../middlewares/rbacMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tracks
 *   description: Gestion des morceaux (tracks)
 */

/**
 * @swagger
 * /tracks/filter:
 *   get:
 *     tags: [Tracks]
 *     summary: Filtre avancé des morceaux
 *     description: Permet de filtrer les morceaux en fonction de critères spécifiques (artiste, album, genre, année, etc.).
 *     parameters:
 *       - in: query
 *         name: artist
 *         schema:
 *           type: string
 *         description: Nom de l'artiste
 *       - in: query
 *         name: album
 *         schema:
 *           type: string
 *         description: Titre de l'album
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Genre du morceau
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Année de sortie du morceau
 *     responses:
 *       200:
 *         description: Liste des morceaux filtrés
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Track'
 *       400:
 *         description: Paramètres de filtre invalides
 */
router.get('/filter', advancedFilter);

/**
 * @swagger
 * /tracks/{albumId}:
 *   post:
 *     tags: [Tracks]
 *     summary: Crée un nouveau morceau
 *     description: Permet de créer un nouveau morceau pour un album spécifique.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: albumId
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
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Fichier audio du morceau
 *               title:
 *                 type: string
 *                 description: Titre du morceau
 *               genre:
 *                 type: string
 *                 description: Genre du morceau
 *               year:
 *                 type: integer
 *                 description: Année de sortie du morceau
 *     responses:
 *       201:
 *         description: Morceau créé avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permission refusée
 */
router.post('/:albumId', authMiddleware, checkPermission(['upload_music']), audioMiddleware, createTrack);

/**
 * @swagger
 * /tracks:
 *   get:
 *     tags: [Tracks]
 *     summary: Récupère tous les morceaux
 *     description: Retourne la liste de tous les morceaux disponibles.
 *     responses:
 *       200:
 *         description: Liste des morceaux récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Track'
 */
router.get('/', getAllTrack);

/**
 * @swagger
 * /tracks/{id}:
 *   get:
 *     tags: [Tracks]
 *     summary: Récupère un morceau par son ID
 *     description: Retourne les détails d'un morceau spécifique.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du morceau
 *     responses:
 *       200:
 *         description: Morceau récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Track'
 *       404:
 *         description: Morceau non trouvé
 */
router.get('/:id', getTrackById);

/**
 * @swagger
 * /tracks/title/{title}:
 *   get:
 *     tags: [Tracks]
 *     summary: Récupère un morceau par son titre
 *     description: Retourne les détails d'un morceau en fonction de son titre.
 *     parameters:
 *       - in: path
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: Titre du morceau
 *     responses:
 *       200:
 *         description: Morceau récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Track'
 *       404:
 *         description: Morceau non trouvé
 */
router.get('/title/:title', getTrackByTitle);

/**
 * @swagger
 * /tracks/{id}:
 *   patch:
 *     tags: [Tracks]
 *     summary: Met à jour un morceau par son ID
 *     description: Permet de mettre à jour les métadonnées d'un morceau existant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du morceau
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Nouveau titre du morceau
 *               genre:
 *                 type: string
 *                 description: Nouveau genre du morceau
 *               year:
 *                 type: integer
 *                 description: Nouvelle année de sortie du morceau
 *     responses:
 *       200:
 *         description: Morceau mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permission refusée
 *       404:
 *         description: Morceau non trouvé
 */
router.patch('/:id', authMiddleware, checkPermission(['edit_metadata']), updatedTrack);

/**
 * @swagger
 * /tracks/{id}:
 *   delete:
 *     tags: [Tracks]
 *     summary: Supprime un morceau par son ID
 *     description: Permet de supprimer un morceau existant.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du morceau
 *     responses:
 *       200:
 *         description: Morceau supprimé avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Permission refusée
 *       404:
 *         description: Morceau non trouvé
 */
router.delete('/:id', authMiddleware, checkPermission(['delete_music']), deleteTrack);

/**
 * @swagger
 * /tracks/artist/{artistId}:
 *   get:
 *     tags: [Tracks]
 *     summary: Récupère les morceaux d'un artiste
 *     description: Retourne la liste des morceaux d'un artiste spécifique.
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'artiste
 *     responses:
 *       200:
 *         description: Liste des morceaux récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Track'
 *       404:
 *         description: Aucun morceau trouvé pour cet artiste
 */
router.get('/artist/:artistId', getTracksByArtist);

/**
 * @swagger
 * /tracks/album/{albumId}:
 *   get:
 *     tags: [Tracks]
 *     summary: Récupère les morceaux d'un album
 *     description: Retourne la liste des morceaux d'un album spécifique.
 *     parameters:
 *       - in: path
 *         name: albumId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'album
 *     responses:
 *       200:
 *         description: Liste des morceaux récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Track'
 *       404:
 *         description: Aucun morceau trouvé pour cet album
 */
router.get('/album/:albumId', getTracksByAlbum);

/**
 * @swagger
 * /tracks/genre/{genre}:
 *   get:
 *     tags: [Tracks]
 *     summary: Récupère les morceaux d'un genre spécifique
 *     description: Retourne la liste des morceaux appartenant à un genre spécifique.
 *     parameters:
 *       - in: path
 *         name: genre
 *         required: true
 *         schema:
 *           type: string
 *         description: Genre du morceau
 *     responses:
 *       200:
 *         description: Liste des morceaux récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Track'
 *       404:
 *         description: Aucun morceau trouvé pour ce genre
 */
router.get('/genre/:genre', getTracksByGenre);

/**
 * @swagger
 * /tracks/year/{year}:
 *   get:
 *     tags: [Tracks]
 *     summary: Récupère les morceaux d'une année spécifique
 *     description: Retourne la liste des morceaux sortis une année spécifique.
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: Année de sortie du morceau
 *     responses:
 *       200:
 *         description: Liste des morceaux récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Track'
 *       404:
 *         description: Aucun morceau trouvé pour cette année
 */
router.get('/year/:year', getTracksByYear);

/**
 * @swagger
 * /tracks/top/10-recent-tracks:
 *   get:
 *     tags: [Tracks]
 *     summary: Récupère les 10 morceaux les plus récents
 *     description: Retourne les 10 morceaux les plus récemment ajoutés.
 *     responses:
 *       200:
 *         description: Liste des 10 morceaux les plus récents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Track'
 */
router.get('/top/10-recent-tracks', getTop10TracksByReleaseDate);

/**
 * @swagger
 * /tracks/stream/{filename}:
 *   get:
 *     tags: [Tracks]
 *     summary: Stream un morceau audio
 *     description: Permet de streamer un morceau audio en fonction de son nom de fichier.
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Nom du fichier audio
 *     responses:
 *       200:
 *         description: Morceau streamé avec succès
 *         content:
 *           audio/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Fichier audio non trouvé
 */
router.get('/stream/:filename', streamTrack);

module.exports = router;