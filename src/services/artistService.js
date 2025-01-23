const mongoose = require('mongoose');
const Artist = require('../models/Artist')(mongoose);
const Joi = require('joi');
const logger = require('../utils/logger');
const Redis = require('ioredis');
const redisUrl = process.env.REDIS_URL;
// const redisClient = new Redis(redisUrl);

const artistSchema = Joi.object({
  name: Joi.string().required().trim(),
  genres: Joi.string().optional(),
  images: Joi.string().valid('Profile', 'Cover', 'Live', 'Promotional', 'Album'),
});

const createArtist = async (data) => {
  try {
    const { error, value } = artistSchema.validate(data);

    if (error) {
      throw new Error(error.details[0].message);
    }

    const artist = await Artist.create(value);

    // ici invalider (delete) le cache du getAllArtist

    logger.info('Artist created successfully.');

    return artist;
  } catch (error) {
    logger.error(`Error creating artist: ${error.message}.`);
    throw error;
  }
};

const getAllArtists = async (page = 1, limit = 10) => {
  try {
    const cacheKey = `artists:page:${page}:limit:${limit}`; // Verifier si c'est bien ca

    // const cachedData = await redisClient.get(cacheKey);

    // if (cachedData) {
    //   logger.info(`Artists retrieved from cache for page ${page}, limit ${limit}`);
    //   return JSON.parse(cachedData);
    // }

    const skip = (page - 1) * limit;
    const totalCount = await Artist.countDocuments();

    const artists = await Artist.find().skip(skip).limit(limit);

    const result = {
      artists,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600); // Cache for 1 hour
    logger.info(`Artists retrieved from db for page ${page}, limit ${limit}`);

    return result;
  } catch (error) {
    logger.error(`Error fetching artists: ${error.message}.`);
    throw error;
  }
};

const getArtistById = async (id) => {
  try {
    if (!id) {
      throw new Error('Artist ID is required.');
    }

    const artist = await Artist.findById(id);

    if (!artist) {
      logger.warn(`Artist with ID ${id} not found.`);
    }
    return artist;
  } catch (error) {
    logger.error(`Error fetching artist by ID: ${error.message}.`);
    throw error;
  }
};

const updatedArtist = async (id, data) => {
  try {
    if (!id) {
      throw new Error('Artist ID is required.');
    }

    const { error, value } = artistSchema.validate(data, { allowUnknown: true });

    if (error) {
      throw new Error(error.details[0].message);
    }

    const updatedArtist = await Artist.findByIdAndUpdate(id, value, { new: true });

    // redisClient.del('artists:all'); // Verifier le cache

    if (updatedArtist) {
      logger.info(`Artist with ID ${id} updated successfully.`);
    }

    return updatedArtist;
  } catch (error) {
    logger.error(`Error updating artist: ${error.message}.`);
    throw error;
  }
};

const deleteArtist = async (id) => {
  try {
    if (!id) {
      throw new Error('Artist ID is required.');
    }

    const deleteArtist = await Artist.findByIdAndDelete(id);

    // redisClient.del('artists:all');

    if (deleteArtist) {
      logger.info(`Artist with ID ${id} deleted successfully.`);
    }

    return deleteArtist;
  } catch (error) {
    logger.error(`Error deleting artist: ${error.message}.`);
    throw error;
  }
};

const getArtistsByGenre = async (genre, page = 1, limit = 10) => {
  try {
    const cacheKey = `artists:genre:${genre}:page:${page}:limit:${limit}`;
    // const cachedData = await redisClient.get(cacheKey);

    // if (cachedData) {
    //   logger.info(`Artists for genre ${genre} retrieved from cache.`);
    //   return JSON.parse(cachedData);
    // }

    const skip = (page - 1) * limit;

    const artists = await Artist.find({ genres: genre }).skip(skip).limit(limit);
    const totalCount = await Artist.countDocuments({ genres: genre });

    const result = {
      artists,
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
    logger.error(`Error fetching artists by genre: ${err.message}`);
    throw err;
  }
};

module.exports = () => {
  createArtist, getAllArtists, getArtistById, updatedArtist, deleteArtist, getArtistsByGenre;
};
