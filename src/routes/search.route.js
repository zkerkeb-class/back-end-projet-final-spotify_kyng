// routes/search.route.js
const express = require('express');
const router = express.Router();
const albumController = require('../controllers/album.controller');
const searchController = require('../controllers/search.controller');

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Recherche d'albums et d'autres éléments
 */

/**
 * @swagger
 * /search/albums:
 *   get:
 *     tags: [Search]
 *     summary: Recherche des albums
 *     description: Permet de rechercher des albums en fonction d'un terme de recherche.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *     responses:
 *       200:
 *         description: Résultats de la recherche d'albums
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Album'
 *       400:
 *         description: Terme de recherche manquant ou invalide
 */
router.get('/albums', albumController.searchAlbums);

/**
 * @swagger
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Recherche globale
 *     description: Permet de rechercher des albums, des artistes, des playlists, etc., en fonction d'un terme de recherche.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Terme de recherche
 *     responses:
 *       200:
 *         description: Résultats de la recherche globale
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 albums:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Album'
 *                 artists:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Artist'
 *                 playlists:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Playlist'
 *       400:
 *         description: Terme de recherche manquant ou invalide
 */
router.get('/', searchController.search);

module.exports = router;