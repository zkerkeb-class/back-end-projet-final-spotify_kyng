const trackService = require('../services/trackService');
const logger = require('../utils/logger');
const { faker } = require('@faker-js/faker');
const { extractAudioMetadata } = require('../utils/metadataExtractor');

const createTrack = async (req, res) => {
  try {
    if (!req.uploadedFiles || req.uploadedFiles.length === 0) {
      throw new Error('No audio files were uploaded.');
    }

    const uploadedFile = req.uploadedFiles[0];
    const { convertedPath, originalName, size, mimetype } = uploadedFile;

    // Extract metadata from the audio file
    let metadata = {};
    try {
      metadata = await extractAudioMetadata(convertedPath);
      logger.info('tt° : ', metadata);
    } catch (metadataError) {
      logger.warn('Metadata extraction failed, generating fake data');
    }

    const trackData = {
      title: req.body.title || metadata.title,
      duration: metadata.duration || req.body.duration,
      albumId: req.params.albumId,
      artistId: req.body.artistId || metadata.artist,
      isExplicit: req.body.isExplicit,
      lyrics: req.body.lyrics,
      audioLink: {
        originalName,
        convertedPath,
        size,
        mimetype,
      },
      numberOfListens: 0,
      popularity: 0,
      trackNumber: req.body.trackNumber,
      collaborators: req.body.collaborators||[faker.person.fullName(), faker.person.fullName()],
      credits: req.body.credits || {
        producer: faker.person.fullName(),
        songwriter: faker.person.fullName(),
      },
      releaseYear: req.body.releaseYear || metadata.year,
    };

    // Call the service to create a track
    const track = await trackService.createTrack(trackData);

    res.status(201).json(track);
  } catch (error) {
    logger.error(`Error in createTrack: ${error.message}`);
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

const getTrackByTitle = async (req, res) => {
  try {
    const track = await trackService.getTrackByTitle(req.params.title);

    if (!track) {
      logger.warn(`Track with title ${req.params.title} not found`);

      return res.status(404).json({ error: 'Track not found.' });
    }
    logger.info(`Track with title ${req.params.title} retrieved successfully.`);

    res.status(200).json(track);
  } catch (error) {
    logger.error(`Error in getTrackByTitle: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const updatedTrack = async (req, res) => {
  try {
    const { id } = req.params;
    const track = await trackService.getTrackById(id);

    if (!track) {
      logger.warn(`Track with ID ${id} not found for update.`);
      return res.status(404).json({ error: 'Track not found.' });
    }

    const updatedData = req.body;

    
console.log({updatedData});

    if (req.uploadedFiles && req.uploadedFiles.length > 0) {
      const uploadedFile = req.uploadedFiles[0];

      let metadata = {};
      try {
        metadata = await extractAudioMetadata(uploadedFile.convertedPath);
        logger.info('Updated track metadata:', metadata);
      } catch (metadataError) {
        logger.warn('Metadata extraction failed:', metadataError);
      }

      // updatedData.audioLink = {
      //   originalName: uploadedFile.originalName,
      //   convertedPath: uploadedFile.convertedPath,
      //   size: uploadedFile.size,
      //   mimetype: uploadedFile.mimetype
      // };
      updatedData.audioLink = uploadedFile.convertedPath;

      updatedData.title = updatedData.title || metadata.title;
      updatedData.duration = updatedData.duration || metadata.duration;
      updatedData.artist = updatedData.artist || metadata.artist;
      updatedData.album = updatedData.album || metadata.album;
    }

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
    const { artistId } = req.params;
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
    const { albumId } = req.params;
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

    const tracks = await trackService.getTracksByYear(
      parseInt(year, 10),
      parseInt(page, 10),
      parseInt(limit, 10)
    );
    res.status(200).json(tracks);
  } catch (err) {
    logger.error(`Error in getTracksByYear: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

const streamTrack = async (req, res) => {
  const { filename } = req.params;
  try {
    const blobStream = await trackService.streamTrack(filename);
    res.setHeader('Content-Type', 'audio/mpeg');
    blobStream.pipe(res);
    logger.info(`Streaming file ${filename} successfully.`);
  } catch (error) {
    logger.error(`Error streaming track: ${error.message}`);
    res
      .status(
        error.message === 'Track not found.' || error.message === 'File not found.' ? 404 : 500
      )
      .json({ error: error.message });
  }
};

const getTop10TracksByReleaseDate = async (req, res) => {
  const result = await trackService.getTop10TracksByReleaseDate();

  if (result.status === 200) {
    logger.info(result.message);
    return res.status(200).json(result.data);
  }
  logger.error(`Error streaming track: ${result.message}`);
  return res.status(result.status).json({ message: result.message, error: result.error });
};

const advancedFilter = async (req, res) => {
  try {
    const {
      artist = '',
      album = '',
      genre = '',
      yearStart = '',
      yearEnd = '',
      durationMin = '',
      durationMax = '',
      popularity = '',
      playlist = '',
      sorts = '',
      page = 1,
      limit = 10,
    } = req.query;

    const filters = {};

    if (artist) filters.artist = artist.split(',');
    if (album) filters.album = album.split(',');
    if (genre) filters.genre = genre.split(',');
    if (yearStart && yearEnd) filters.year = { start: yearStart, end: yearEnd };
    if (durationMin && durationMax) filters.duration = { min: durationMin, max: durationMax };
    if (popularity) filters.popularity = popularity;
    if (playlist) filters.playlist = playlist;

    const sortArray = sorts ? JSON.parse(sorts) : [];

    const result = await trackService.advancedFilter(
      filters,
      sortArray,
      parseInt(page),
      parseInt(limit)
    );
    logger.info(`Filtered successfully.`);

    return res.status(200).json(result);
  } catch (error) {
    logger.error(`Error in advanced filter : ${error.message}`);
    return res
      .status(500)
      .json({ message: 'Error fetching filtered tracks', error: error.message });
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
  getTracksByYear,
  streamTrack,
  getTrackByTitle,
  getTop10TracksByReleaseDate,
  advancedFilter,
};
