// routes/playlist.route.js
const express = require('express');
const router = express.Router();
const playlistController = require('../controllers/playlist.controller');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Playlists
 *   description: Gestion des playlists
 */

/**
 * @swagger
 * /playlists:
 *   post:
 *     tags: [Playlists]
 *     summary: Crée une nouvelle playlist
 *     description: Permet de créer une nouvelle playlist.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom de la playlist
 *               description:
 *                 type: string
 *                 description: Description de la playlist
 *               isPublic:
 *                 type: boolean
 *                 description: Indique si la playlist est publique ou privée
 *             example:
 *               name: "Ma Playlist"
 *               description: "Une playlist géniale"
 *               isPublic: true
 *     responses:
 *       201:
 *         description: Playlist créée avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 */
router.post('/', playlistController.createPlaylist);

/**
 * @swagger
 * /playlists:
 *   get:
 *     tags: [Playlists]
 *     summary: Récupère toutes les playlists
 *     description: Retourne la liste de toutes les playlists avec pagination.
 *     responses:
 *       200:
 *         description: Liste des playlists récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Playlist'
 */
router.get('/', playlistController.getAllPlaylist);

/**
 * @swagger
 * /playlists/{id}:
 *   get:
 *     tags: [Playlists]
 *     summary: Récupère une playlist par son ID
 *     description: Retourne les détails d'une playlist spécifique.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la playlist
 *     responses:
 *       200:
 *         description: Playlist récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Playlist'
 *       404:
 *         description: Playlist non trouvée
 */
router.get('/:id', playlistController.getPlaylistById);

/**
 * @swagger
 * /playlists/{id}:
 *   put:
 *     tags: [Playlists]
 *     summary: Met à jour une playlist par son ID
 *     description: Permet de mettre à jour les métadonnées d'une playlist existante.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la playlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nouveau nom de la playlist
 *               description:
 *                 type: string
 *                 description: Nouvelle description de la playlist
 *               isPublic:
 *                 type: boolean
 *                 description: Indique si la playlist est publique ou privée
 *             example:
 *               name: "Ma Playlist Modifiée"
 *               description: "Une playlist encore plus géniale"
 *               isPublic: false
 *     responses:
 *       200:
 *         description: Playlist mise à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Playlist non trouvée
 */
router.put('/:id', playlistController.updatedPlaylist);

/**
 * @swagger
 * /playlists/{id}:
 *   delete:
 *     tags: [Playlists]
 *     summary: Supprime une playlist par son ID
 *     description: Permet de supprimer une playlist existante.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la playlist
 *     responses:
 *       200:
 *         description: Playlist supprimée avec succès
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Playlist non trouvée
 */
router.delete('/:id', playlistController.deletePlaylist);

/**
 * @swagger
 * /playlists/{playlistId}/tracks:
 *   post:
 *     tags: [Playlists]
 *     summary: Ajoute un morceau à une playlist
 *     description: Permet d'ajouter un morceau à une playlist existante.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: playlistId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la playlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackId:
 *                 type: string
 *                 description: ID du morceau à ajouter
 *             example:
 *               trackId: "12345"
 *     responses:
 *       200:
 *         description: Morceau ajouté à la playlist avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Playlist ou morceau non trouvé
 */
router.post('/:playlistId/tracks', playlistController.addTrackToPlaylist);

module.exports = router;