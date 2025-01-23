const mongoose = require('mongoose');

const Album = require('../models/Album')(mongoose);
const Joi = require('joi');
const logger = require('../utils/logger');
const Redis = require('ioredis');
const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

const albumSchema = Joi.object({
  title: Joi.string().required().trim(),
  linkTitle: Joi.string().optional(),
  linkType: Joi.string().optional(),
  artistId: Joi.string().required(),
  releaseDate: Joi.date().optional(),
  image: Joi.string().uri().optional(),
  audioTracks: Joi.array().items(Joi.string()).optional(),
  duration: Joi.number().min(0).optional(),
  genre: Joi.string().optional(),
});

// TODO ajouter pour l'image un tableau de uri
const createAlbum = async (data) => {
  try {
    const { error, value } = albumSchema.validate(data);

    if (error) {
      throw new Error(error.details[0].message);
    }

    const album = await Album.create(value);

    // ici invalider (delete) le cache du getAllAlbum

    logger.info('Album created successfully.');

    return album;
  } catch (error) {
    logger.error(`Error creating album: ${error.message}.`);
    throw error;
  }
};

const getAllAlbums = async (page = 1, limit = 10) => {
  try {
    const cacheKey = `albums:page:${page}:limit:${limit}`; // Verifier si c'est bien ca

    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      logger.info(`Albums retrieved from cache for page ${page}, limit ${limit}`);
      return JSON.parse(cachedData);
    }

    const skip = (page - 1) * limit;
    const totalCount = await Album.countDocuments();
    const albums = await Album.find().populate('artistId', 'name').skip(skip).limit(limit);
    const result = {
      albums,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // const albums = await Album.find().populate('artistId', 'name');
    redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600); // Cache for 1 hour
    logger.info(`Albums retrieved from db for page ${page}, limit ${limit}`);

    return result;
  } catch (error) {
    logger.error(`Error fetching albums: ${error.message}.`);
    throw error;
  }
};

const getAlbumById = async (id) => {
  try {
    if (!id) {
      throw new Error('Album ID is required.');
    }

    const album = await Album.findById(id).populate('artistId', 'name');

    if (!album) {
      logger.warn(`Album with ID ${id} not found.`);
    }
    return album;
  } catch (error) {
    logger.error(`Error fetching album by ID: ${error.message}.`);
    throw error;
  }
};

const updatedAlbum = async (id, data) => {
  try {
    if (!id) {
      throw new Error('Album ID is required.');
    }

    const { error, value } = albumSchema.validate(data, { allowUnknown: true });

    if (error) {
      throw new Error(error.details[0].message);
    }

    const updatedAlbum = await Album.findByIdAndUpdate(id, value, { new: true });

    redisClient.del('albums:all'); // Verifier le cache

    if (updatedAlbum) {
      logger.info(`Album with ID ${id} updated successfully.`);
    }

    return updatedAlbum;
  } catch (error) {
    logger.error(`Error updating album: ${error.message}.`);
    throw error;
  }
};

const deleteAlbum = async (id) => {
  try {
    if (!id) {
      throw new Error('Album ID is required.');
    }

    const deleteAlbum = await Album.findByIdAndDelete(id);

    redisClient.del('albums:all');

    if (deleteAlbum) {
      logger.info(`Album with ID ${id} deleted successfully.`);
    }

    return deleteAlbum;
  } catch (error) {
    logger.error(`Error deleting album: ${error.message}.`);
    throw error;
  }
};

// FILTRES
const getAlbumsByArtist = async (artistId, page = 1, limit = 10) => {
  try {
    const cacheKey = `albums:artist:${artistId}:page:${page}:limit:${limit}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      logger.info(`Albums for artist ${artistId} retrieved from cache.`);
      return JSON.parse(cachedData);
    }

    const skip = (page - 1) * limit;

    // Fetch albums filtered by artist
    const albums = await Album.find({ artistId }).skip(skip).limit(limit);

    const totalCount = await Album.countDocuments({ artistId });

    const result = {
      albums,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600); // Cache for 1 hour
    logger.info(`Albums for artist ${artistId} retrieved from database.`);
    return result;
  } catch (err) {
    logger.error(`Error fetching albums by artist: ${err.message}`);
    throw err;
  }
};

const getAlbumsByGenre = async (genre, page = 1, limit = 10) => {
  try {
    // const cacheKey = `albums:genre:${genre}:page:${page}:limit:${limit}`;
    // const cachedData = await redisClient.get(cacheKey);

    // if (cachedData) {
    //   logger.info(`Albums for genre ${genre} retrieved from cache.`);
    //   return JSON.parse(cachedData);
    // }

    const skip = (page - 1) * limit;

    const albums = await Album.find({ genre: genre }).skip(skip).limit(limit);
    const totalCount = await Album.countDocuments({ genres: genre });

    const result = {
      albums,
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
    logger.error(`Error fetching albums by genre: ${err.message}`);
    throw err;
  }
};

const getAlbumsByYear = async (year) => {
  try {
    if (!year) {
      throw new Error("Year parameter is required.");
    }

    const cacheKey = `albums:year:${year}`;
    
    // go check in redis cache if data is available
    const cachedAlbums = await redisClient.get(cacheKey);
    if (cachedAlbums) {
      logger.info(`Cache hit for albums released in year ${year}.`);
      return JSON.parse(cachedAlbums);
    }

    const albums = await Album.find({
      $expr: {
        $eq: [{ $year: "$releaseDate" }, Number(year)], // Match the year
      },
    });

    await redisClient.set(cacheKey, JSON.stringify(albums), 'EX', 3600); // Cache expires in 1 hour
    logger.info(`Cache set for albums released in year ${year}.`);

    return albums;
  } catch (error) {
    logger.error(`Error fetching albums by year ${year}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createAlbum,
  getAllAlbums,
  getAlbumById,
  updatedAlbum,
  deleteAlbum,
  getAlbumsByArtist,
  getAlbumsByGenre,
  getAlbumsByYear
};
