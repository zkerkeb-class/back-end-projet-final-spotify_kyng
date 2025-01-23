const albumService = require('../services/albumService');
const logger = require('../utils/logger');
// const mongoose = require('mongoose');

// const Album = require('../models/Album')(mongoose);

const createAlbum = async (req, res) => {
  try {
    const album = await albumService.createAlbum(req.body);
    logger.info(`Album creation request handled successfully.`);

    res.status(201).json(album);
  } catch (error) {
    logger.error(`Error in createAlbum: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const getAllAlbum = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default values: page 1, limit 10
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const albums = await albumService.getAllAlbums(parsedPage, parsedLimit);
    logger.info(`Album list retrieval request handled successfully.`);

    res.status(200).json(albums);
  } catch (error) {
    logger.error(`Error in getAllAlbums: ${error.message}.`);

    res.status(500).json({ error: error.message });
  }
};

const getAlbumById = async (req, res) => {
  try {
    const album = await albumService.getAlbumById(req.params.id);

    if (!album) {
      logger.warn(`Album with ID ${req.params.id} not found`);

      return res.status(404).json({ error: 'Album not found.' });
    }
    logger.info(`Album with ID ${req.params.id} retrieved successfully.`);

    res.status(200).json(album);
  } catch (error) {
    logger.error(`Error in getAlbumById: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const updatedAlbum = async (req, res) => {
  try {
    const album = await albumService.updatedAlbum(req.params.id, req.body);

    if (!album) {
      logger.warn(`Album with ID ${req.params.id} not found for update.`);

      return res.status(404).json({ error: 'Album not found.' });
    }
    logger.info(`Album with ID ${req.params.id} updated successfully.`);

    res.status(200).json(album);
  } catch (error) {
    logger.error(`Error in updatedAlbum: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const deleteAlbum = async (req, res) => {
  try {
    const album = await albumService.deleteAlbum(req.params.id);

    if (!album) {
      logger.warn(`Album with ID ${req.params.id} not found for deletion.`);

      return res.status(404).json({ error: 'Album not found.' });
    }
    logger.info(`Album with ID ${req.params.id} deleted successfully.`);

    res.status(200).json({ message: 'Album deleted successfully.' });
  } catch (error) {
    logger.error(`Error in deleteAlbum: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const getAlbumsByArtist = async (req, res) => {
  try {
    const { artistId } = req.params; // Récupère l'ID de l'artiste
    const { page = 1, limit = 10 } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (!artistId) {
      return res.status(400).json({ error: 'Artist ID is required.' });
    }

    const albums = await albumService.getAlbumsByArtist(artistId, parsedPage, parsedLimit);
    res.status(200).json(albums);
  } catch (err) {
    logger.error(`Error in getAlbumsByArtist: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

const getAlbumsByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const albums = await albumService.getAlbumsByGenre(genre, parseInt(page), parseInt(limit));
    res.status(200).json(albums);
  } catch (err) {
    logger.error(`Error in getAlbumsByGenre: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

const getAlbumsByYearController = async (req, res) => {
  const { year } = req.params;

  try {
    if (!year || isNaN(year)) {
      logger.warn("Invalid year parameter provided.");
      return res.status(400).json({ message: "Invalid year parameter." });
    }

    const albums = await albumService.getAlbumsByYear(Number(year));

    if (!albums.length) {
      logger.info(`No albums found for year ${year}.`);
      return res.status(404).json({ message: `No albums found for year ${year}.` });
    }

    logger.info(`Fetched albums for year ${year} successfully.`);
    return res.status(200).json(albums);
  } catch (error) {
    logger.error(`Failed to fetch albums for year ${year}: ${error.message}`);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  createAlbum,
  getAllAlbum,
  getAlbumById,
  updatedAlbum,
  deleteAlbum,
  getAlbumsByArtist,
  getAlbumsByGenre,
  getAlbumsByYearController
};
