const trackService = require('../services/trackService');
const logger = require('../utils/logger');
// const Track = require('../models/Track')(mongoose);

const createTrack = async (req, res) => {
  try {
    const track = await trackService.createTrack(req.body);
    logger.info(`Track creation request handled successfully.`);

    res.status(201).json(track);
  } catch (error) {
    logger.error(`Error in createTrack: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const getAllTrack = async (req, res) => {
  try {
    const tracks = await trackService.getAllTrack();
    logger.info(`Track list retrieval request handled successfully.`);

    res.status(200).json(tracks);
  } catch (error) {
    logger.error(`Error in getAllTrack: ${error.message}.`);

    res.status(500).json({ error: error.message });
  }
};

const getTrackById = async (req, res) => {
  try {
    const track = await trackService.getTrackById(req.params.id);

    if (!track) {
      logger.warn(`Track with ID ${req.params.id} not found`);

      return res.status(404).json({ error: 'Track not found.' });
    }
    logger.info(`Track with ID ${req.params.id} retrieved successfully.`);

    res.status(200).json(track);
  } catch (error) {
    logger.error(`Error in getTrackById: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const updatedTrack = async (req, res) => {
  try {
    const track = await trackService.updatedTrack(req.params.id, req.body);

    if (!track) {
      logger.warn(`Track with ID ${req.params.id} not found for update.`);

      return res.status(404).json({ error: 'Track not found.' });
    }
    logger.info(`Track with ID ${req.params.id} updated successfully.`);

    res.status(200).json(track);
  } catch (error) {
    logger.error(`Error in updateTrack: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const deleteTrack = async (req, res) => {
  try {
    const track = await trackService.deleteTrack(req.params.id);

    if (!track) {
      logger.warn(`Track with ID ${req.params.id} not found for deletion.`);

      return res.status(404).json({ error: 'Track not found.' });
    }
    logger.info(`Track with ID ${req.params.id} deleted successfully.`);

    res.status(200).json({ message: 'Track deleted successfully.' });
  } catch (error) {
    logger.error(`Error in deleteTrack: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const getTracksByArtist = async (req, res) => {
  try {
    const { artistId } = req.params; // Récupère l'ID de l'artiste
    const { page = 1, limit = 10 } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (!artistId) {
      return res.status(400).json({ error: 'Artist ID is required.' });
    }

    const tracks = await trackService.getTracksByArtist(artistId, parsedPage, parsedLimit);
    res.status(200).json(tracks);
  } catch (err) {
    logger.error(`Error in getTracksByArtist: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

const getTracksByAlbum = async (req, res) => {
  try {
    const { albumId } = req.params; // Récupère l'ID de l'album
    const { page = 1, limit = 10 } = req.query;

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);

    if (!albumId) {
      return res.status(400).json({ error: 'Album ID is required.' });
    }

    const tracks = await trackService.getTracksByAlbum(albumId, parsedPage, parsedLimit);
    res.status(200).json(tracks);
  } catch (err) {
    logger.error(`Error in getTracksByAlbum: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

const getTracksByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const tracks = await trackService.getTracksByGenre(genre, parseInt(page), parseInt(limit));
    res.status(200).json(tracks);
  } catch (err) {
    logger.error(`Error in getTracksByGenre: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createTrack,
  getAllTrack,
  getTrackById,
  updatedTrack,
  deleteTrack,
  getTracksByArtist,
  getTracksByAlbum,
  getTracksByGenre,
};
