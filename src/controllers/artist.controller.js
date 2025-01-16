const artistService = require('../services/artistService');
const logger = require('../utils/logger');
// const mongoose = require('mongoose');

// const Artist = require('../models/Artist')(mongoose);

const createArtist = async (req, res) => {
  try {
    const artist = await artistService.createArtist(req.body);
    logger.info(`Artist creation request handled successfully.`);

    res.status(201).json(artist);
  } catch (error) {
    logger.error(`Error in createArtist: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const getAllArtist = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default values: page 1, limit 10
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const artists = await artistService.getAllArtist(parsedPage, parsedLimit);
    logger.info(`Artist list retrieval request handled successfully.`);

    res.status(200).json(artists);
  } catch (error) {
    logger.error(`Error in getAllArtists: ${error.message}.`);

    res.status(500).json({ error: error.message });
  }
};

const getArtistById = async (req, res) => {
  try {
    const artist = await artistService.getArtistById(req.params.id);

    if (!artist) {
      logger.warn(`Artist with ID ${req.params.id} not found`);

      return res.status(404).json({ error: 'Artist not found.' });
    }
    logger.info(`Artist with ID ${req.params.id} retrieved successfully.`);

    res.status(200).json(artist);
  } catch (error) {
    logger.error(`Error in getArtistById: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const updatedArtist = async (req, res) => {
  try {
    const artist = await artistService.updatedArtist(req.params.id, req.body);

    if (!artist) {
      logger.warn(`Artist with ID ${req.params.id} not found for update.`);

      return res.status(404).json({ error: 'Artist not found.' });
    }
    logger.info(`Artist with ID ${req.params.id} updated successfully.`);

    res.status(200).json(artist);
  } catch (error) {
    logger.error(`Error in updateArtist: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const deleteArtist = async (req, res) => {
  try {
    const artist = await artistService.deleteArtist(req.params.id);

    if (!artist) {
      logger.warn(`Artist with ID ${req.params.id} not found for deletion.`);

      return res.status(404).json({ error: 'Artist not found.' });
    }
    logger.info(`Artist with ID ${req.params.id} deleted successfully.`);

    res.status(200).json({ message: 'Artist deleted successfully.' });
  } catch (error) {
    logger.error(`Error in deleteArtist: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const getArtistsByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const artists = await artistService.getArtistsByGenre(genre, parseInt(page), parseInt(limit));
    res.status(200).json(artists);
  } catch (err) {
    logger.error(`Error in getArtistsByGenre: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createArtist,
  getAllArtist,
  getArtistById,
  updatedArtist,
  deleteArtist,
  getArtistsByGenre,
};
