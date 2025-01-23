const trackService = require('../services/trackService');
const logger = require('../utils/logger');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

// const Track = require('../models/Track')(mongoose);

const createTrack = async (req, res) => {
  try {
    // Validate the presence of uploaded files
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      throw new Error('No audio files were uploaded.');
    }

    // Extract form data and uploaded files
    const {
      title,
      duration,
      albumId,
      isExplicit,
      lyrics,
      artistId,
      collaborators,
      credits,
      numberOfListens,
      popularity,
      trackNumber,
    } = req.body;

    // Use the first uploaded file for this example
    const uploadedFile = req.uploadedFiles[0];
    const { originalName, convertedPath, size, mimetype } = uploadedFile;

    // Prepare data for the service
    const trackData = {
      title,
      duration,
      albumId,
      isExplicit,
      lyrics,
      artistId,
      collaborators,
      credits,
      numberOfListens,
      popularity,
      trackNumber,
      audioFile: {
        originalName,
        convertedPath,
        size,
        mimetype,
      },
    };

    // Call the service to create a track
    const track = await trackService.createTrack(trackData);

    res.status(201).json(track);
  } catch (error) {
    console.error(`Error in createTrack: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

const getAllTrack = async (req, res) => {
  try {
    const tracks = await trackService.getAllTracks();
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
    const { id } = req.params;

    // Get the existing track by ID
    const track = await trackService.getTrackById(id);

    if (!track) {
      logger.warn(`Track with ID ${id} not found for update.`);
      return res.status(404).json({ error: 'Track not found.' });
    }

    // Only pass the fields that are provided in the request body
    const updatedData = req.body;

    // Pass the existing track and new data to the service for updating
    const updatedTrack = await trackService.updatedTrack(id, updatedData);

    logger.info(`Track with ID ${id} updated successfully.`);
    res.status(200).json(updatedTrack);
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

const getTracksByYear = async (req, res) => {
  try {
    const { year } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!year) {
      return res.status(400).json({ error: 'Year is required.' });
    }

    const tracks = await trackService.getTracksByYear(parseInt(year, 10), parseInt(page, 10), parseInt(limit, 10));
    res.status(200).json(tracks);
  } catch (err) {
    logger.error(`Error in getTracksByYear: ${err.message}`);
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
  getTracksByYear
};
