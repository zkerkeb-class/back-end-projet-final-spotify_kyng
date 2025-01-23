const mongoose = require('mongoose');
const Playlist = require('../models/Playlist')(mongoose);
const Joi = require('joi');
const logger = require('../utils/logger');

const Redis = require('ioredis');
const redisUrl = process.env.REDIS_URL;

// const redisClient = new Redis(redisUrl);

const playlistSchema = Joi.object({
  pistes_audio: Joi.string().required(),
  thumbnail: Joi.string().uri().optional(),
  duration: Joi.number().required().min(0),
  description: Joi.string().optional(),
  titre: Joi.number().optional(),
});

const createPlaylist = async (data) => {
  try {
    const { error, value } = playlistSchema.validate(data);

    if (error) {
      throw new Error(error.details[0].message);
    }

    const playlist = await Playlist.create(value);

    // ici invalider (delete) le cache du getAllPlaylist

    logger.info('Playlist created successfully.');

    return playlist;
  } catch (error) {
    logger.error(`Error creating playlist: ${error.message}.`);
    throw error;
  }
};

const getAllPlaylists = async (page = 1, limit = 10) => {
  try {
    const cacheKey = `playlists:page:${page}:limit:${limit}`;

    // const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      logger.info(`Playlists retrieved from cache for page ${page}, limit ${limit}`);
      return JSON.parse(cachedData);
    }

    const skip = (page - 1) * limit;

    const totalCount = await Playlist.countDocuments();

    const playlists = await Playlist.find().skip(skip).limit(limit);
    const result = {
      playlists,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600); // Cache for 1 hour
    logger.info(`Playlists retrieved from db for page ${page}, limit ${limit}`);
    return result;
  } catch (error) {
    logger.error(`Error fetching playlists: ${error.message}.`);
    throw error;
  }
};

const getPlaylistById = async (id) => {
  try {
    if (!id) {
      throw new Error('Playlist ID is required.');
    }

    const playlist = await Playlist.findById(id);

    if (!playlist) {
      logger.warn(`Playlist with ID ${id} not found.`);
    }
    return playlist;
  } catch (error) {
    logger.error(`Error fetching playlist by ID: ${error.message}.`);
    throw error;
  }
};

const updatedPlaylist = async (id, data) => {
  try {
    if (!id) {
      throw new Error('Playlist ID is required.');
    }

    const { error, value } = playlistSchema.validate(data, { allowUnknown: true });

    if (error) {
      throw new Error(error.details[0].message);
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(id, value, { new: true });

    // redisClient.del('playlists:all'); // Verifier le cache

    if (updatedPlaylist) {
      logger.info(`Playlist with ID ${id} updated successfully.`);
    }

    return updatedPlaylist;
  } catch (error) {
    logger.error(`Error updating track: ${error.message}.`);
    throw error;
  }
};

const deletePlaylist = async (id) => {
  try {
    if (!id) {
      throw new Error('Playlist ID is required.');
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(id);

    // redisClient.del('playlists:all');

    if (deletePlaylist) {
      logger.info(`Playlist with ID ${id} deleted successfully.`);
    }

    return deletePlaylist;
  } catch (error) {
    logger.error(`Error deleting track: ${error.message}.`);
    throw error;
  }
};

module.exports = () => {
  createPlaylist, getAllPlaylists, getPlaylistById, updatedPlaylist, deletePlaylist;
};
