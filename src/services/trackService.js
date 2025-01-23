const mongoose = require('mongoose');
const Track = require('../models/Track')(mongoose);
const Joi = require('joi');
const logger = require('../utils/logger');
const { extractAudioMetadata } = require('../utils/metadataExtractor');
const { uploadToAzureStorage } = require('./seedService');
// const redisClient = require('../config/redis');
// const Playlist = require('../models/Playlist');


const trackSchema = Joi.object({
  title: Joi.string().required().trim(),
  duration: Joi.number().required().min(0),
  audioLink: Joi.string().required(),
  albumId: Joi.object().optional(),
  isExplicit: Joi.boolean().optional(),
  lyrics: Joi.string().optional(),
  artistId: Joi.string().optional(),
  collaborators: Joi.string().optional(),
  credits: Joi.string().optional(),
  numberOfListens: Joi.number().optional(),
  popularity: Joi.number().optional(),
  trackNumber: Joi.number().optional(),
});

const createTrack = async (data) => {
  try {
    // Validate input data
    const { error, value } = trackSchema.validate(data);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const { audioLink, ...trackData } = value;
    const { convertedPath } = audioLink;

    // Upload the converted file to a cloud storage
    const azureFileUrl = await uploadToAzureStorage(convertedPath, 'spotify');

    // Extract metadata (optional)
    let audioMetadata = {};
    try {
      audioMetadata = await extractAudioMetadata(convertedPath);
    } catch (err) {
      console.warn(`Failed to extract metadata from ${convertedPath}: ${err.message}`);
    }

    // Finalize track data
    const trackPayload = {
      title: trackData.title || audioMetadata.title || 'Untitled',
      duration: trackData.duration || audioMetadata.duration || null,
      audioLink: azureFileUrl,
      albumId: trackData.albumId || null,
      isExplicit: trackData.isExplicit || false,
      lyrics: trackData.lyrics || null,
      artistId: trackData.artistId || null,
      collaborators: trackData.collaborators || null,
      credits: trackData.credits || null,
      numberOfListens: trackData.numberOfListens || 0,
      popularity: trackData.popularity || 0,
      trackNumber: trackData.trackNumber || null,
      releaseYear: trackData.releaseYear || 0,
    };

    // Save the track to the database
    const track = await Track.create(trackPayload);
    return track;
  } catch (error) {
    console.error(`Error in createTrack service: ${error.message}`);
    throw error;
  }
};

const getAllTracks = async (page = 1, limit = 10) => {
  try {
    const cacheKey = `tracks:page:${page}:limit:${limit}`; // Verifier si c'est bien ca

    // const cachedData = await redisClient.get(cacheKey);

    // if (cachedData) {
    //   logger.info(`Tracks retrieved from cache for page ${page}, limit ${limit}`);
    //   return JSON.parse(cachedData);
    // }

    const skip = (page - 1) * limit;

    const totalCount = await Track.countDocuments();

    const tracks = await Track.find().skip(skip).limit(limit);

    const result = {
      tracks,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600); // Cache for 1 hour
    logger.info(`Tracks retrieved from db for page ${page}, limit ${limit}`);

    return result;
  } catch (error) {
    logger.error(`Error fetching tracks: ${error.message}.`);
    throw error;
  }
};

const getTrackById = async (id) => {
  try {
    if (!id) {
      throw new Error('Track ID is required.');
    }

    const track = await Track.findById(id);

    if (!track) {
      logger.warn(`Track with ID ${id} not found.`);
    }
    return track;
  } catch (error) {
    logger.error(`Error fetching track by ID: ${error.message}.`);
    throw error;
  }
};

const updatedTrack = async (id, data) => {
  try {
    if (!id) {
      throw new Error('Track ID is required.');
    }

    // Fetch the existing track from the database by ID
    const existingTrack = await Track.findById(id);
    
    if (!existingTrack) {
      throw new Error('Track not found.');
    }

    // Merge the existing track data with the incoming data from the request body
    const updatedTrackData = { ...existingTrack.toObject(), ...data };

    // Validate the merged data using the Joi schema
    const { error, value } = trackSchema.validate(updatedTrackData, { allowUnknown: true });
    if (error) {
      throw new Error(error.details[0].message);
    }

    // Update the track in the database with the validated data
    const updatedTrack = await Track.findByIdAndUpdate(id, value, { new: true });

    // Clear the cache after updating
    // redisClient.del('tracks:all'); // Verifier le cache

    logger.info(`Track with ID ${id} updated successfully.`);

    return updatedTrack;
  } catch (error) {
    logger.error(`Error updating track: ${error.message}.`);
    throw error;
  }
};



const deleteTrack = async (id) => {
  try {
    if (!id) {
      throw new Error('Track ID is required.');
    }

    const deleteTrack = await Track.findByIdAndDelete(id);

    // redisClient.del('tracks:all');

    if (deleteTrack) {
      logger.info(`Track with ID ${id} deleted successfully.`);
    }

    return deleteTrack;
  } catch (error) {
    logger.error(`Error deleting track: ${error.message}.`);
    throw error;
  }
};

const getTracksByArtist = async (artistId, page = 1, limit = 10) => {
  try {
    // const cacheKey = `tracks:artist:${artistId}:page:${page}:limit:${limit}`;
    // const cachedData = await redisClient.get(cacheKey);

    // if (cachedData) {
    //   logger.info(`Tracks for artist ${artistId} retrieved from cache.`);
    //   return JSON.parse(cachedData);
    // }

    const skip = (page - 1) * limit;

    // Fetch tracks filtered by artist
    const tracks = await Track.find({ artistId }).skip(skip).limit(limit);

    const totalCount = await Track.countDocuments({ artistId });

    const result = {
      tracks,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600); // Cache for 1 hour
    logger.info(`Tracks for artist ${artistId} retrieved from database.`);
    return result;
  } catch (err) {
    logger.error(`Error fetching tracks by artist: ${err.message}`);
    throw err;
  }
};

const getTracksByAlbum = async (albumId, page = 1, limit = 10) => {
  try {
    const cacheKey = `tracks:album:${albumId}:page:${page}:limit:${limit}`;
    // const cachedData = await redisClient.get(cacheKey);

    // if (cachedData) {
    //   logger.info(`Tracks for album ${albumId} retrieved from cache.`);
    //   return JSON.parse(cachedData);
    // }

    const skip = (page - 1) * limit;

    // Fetch tracks filtered by album
    const tracks = await Track.find({ albumId }).skip(skip).limit(limit);

    const totalCount = await Track.countDocuments({ albumId });

    const result = {
      tracks,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600); // Cache for 1 hour
    logger.info(`Tracks for album ${albumId} retrieved from database.`);
    return result;
  } catch (err) {
    logger.error(`Error fetching tracks by album: ${err.message}`);
    throw err;
  }
};

const getTracksByGenre = async (genre, page = 1, limit = 10) => {
  try {
    const cacheKey = `tracks:genre:${genre}:page:${page}:limit:${limit}`;
    // const cachedData = await redisClient.get(cacheKey);

    // if (cachedData) {
    //   logger.info(`Tracks for genre ${genre} retrieved from cache.`);
    //   return JSON.parse(cachedData);
    // }

    const skip = (page - 1) * limit;

    const tracks = await Track.find({ genres: genre }).skip(skip).limit(limit);
    const totalCount = await Track.countDocuments({ genres: genre });

    const result = {
      tracks,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
    return result;
  } catch (err) {
    logger.error(`Error fetching tracks by genre: ${err.message}`);
    throw err;
  }
};

const getTracksByYear = async (year, page = 1, limit = 10) => {
  try {
    const cacheKey = `tracks:year:${year}:page:${page}:limit:${limit}`;
    // const cachedData = await redisClient.get(cacheKey);

    // if (cachedData) {
    //   logger.info(`Tracks for year ${year} retrieved from cache.`);
    //   return JSON.parse(cachedData);
    // }

    const skip = (page - 1) * limit;

    const tracks = await Track.find({ releaseYear: year }).skip(skip).limit(limit);

    const totalCount = await Track.countDocuments({ releaseYear: year });

    const result = {
      tracks,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600); // Cache for 1 hour
    logger.info(`Tracks for year ${year} retrieved from database.`);
    return result;
  } catch (err) {
    logger.error(`Error fetching tracks by year: ${err.message}`);
    throw err;
  }
};


module.exports = {
  createTrack,
  getAllTracks,
  getTrackById,
  updatedTrack,
  deleteTrack,
  getTracksByArtist,
  getTracksByAlbum,
  getTracksByGenre,
  getTracksByYear
};
