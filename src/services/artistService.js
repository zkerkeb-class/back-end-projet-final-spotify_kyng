const mongoose = require('mongoose');
const Artist = require('../models/Artist')(mongoose);
const Track = require('../models/Track')(mongoose);
const Joi = require('joi');
const logger = require('../utils/logger');
const Redis = require('ioredis');
const redisUrl = process.env.REDIS_URL;
const { ObjectId } = require('mongodb');

// const redisClient = new Redis(redisUrl);

const artistSchema = Joi.object({
  name: Joi.string().optional().trim(),
  genres: Joi.string().optional(),
  images: Joi.array()
    .items(
      Joi.object({
        path: Joi.string().required(),
        type: Joi.string().valid('Profile', 'Cover', 'Live', 'Promotional', 'Album').required(),
      })
    )
    .optional(),
});

const createArtist = async (data) => {
  try {
    if (data.images && Array.isArray(data.images)) {
      data.images = data.images.map((img) => {
        if (typeof img !== 'object' || !img.path) {
          throw new Error('Invalid image structure. Each image must have a "path".');
        }
        return {
          ...img,
          type: img.type || 'Profile', // Assign 'Profile' as default if 'type' is missing
        };
      });
    }
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

const getAllArtist = async (page = 1, limit = 10) => {
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

const getArtistByName = async (name) => {
  try {
    if (!name) {
      throw new Error('Artist name is required.');
    }

    const artist = await Artist.find({
      name: name,
    });

    if (!artist) {
      logger.warn(`Artist with name ${name} not found.`);
    }
    return artist;
  } catch (error) {
    logger.error(`Error fetching artist by name: ${error.message}.`);
    throw error;
  }
};

const updatedArtist = async (id, data) => {
  try {
    if (!id) {
      throw new Error('Artist ID is required.');
    }

    if (data.images && data.images.length > 0) {
      data.images = data.images.map((img) => ({
        ...img,
        type: img.type || 'Profile', // Default to 'Profile' if type is missing
      }));
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
    const artists2 = await Artist.find({ genres: genre });
    console.log('tt : ', genre);

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

const getTop10ArtistsByNumberOfListens = async () => {
  try {
    // Step 1: Find all tracks with listens > 0
    const tracks = await Track.find(
      { numberOfListens: { $gt: 0 } },
      { artistId: 1, numberOfListens: 1 } // Only select artistId and numberOfListens
    );

    if (tracks.length === 0) {
      console.log('No tracks with listens found');
      return [];
    }

    // Step 2: Aggregate listens by artistId
    const artistListenCount = {};
    tracks.forEach((track) => {
      if (track.artistId) {
        const artistIdStr = track.artistId.toString(); // Convert ObjectId to string for aggregation
        artistListenCount[artistIdStr] =
          (artistListenCount[artistIdStr] || 0) + track.numberOfListens;
      }
    });

    // Step 3: Get artist IDs from the aggregated data
    const artistIds = Object.keys(artistListenCount);
    console.log('Artist IDs:', artistIds);

    if (artistIds.length === 0) {
      console.log('No artists with listens found');
      return [];
    }

    // **DEBUGGING CODE**
    const artistObjectIds = artistIds
      .map((id) => {
        try {
          return new ObjectId(id); // Ensure the ID is correctly converted
        } catch (error) {
          console.error(`Error converting ID: ${id}`, error);
          return null;
        }
      })
      .filter(Boolean); // Remove any nulls from failed conversions

    console.log('Converted Artist ObjectIds:', artistObjectIds);

    // Step 4: Query the Artist collection for these IDs
    const artists = await Artist.find({ _id: { $in: artistObjectIds } });

    console.log('Artists found:', artists);

    if (artists.length === 0) {
      console.log('No matching artists found in the database');
      return [];
    }

    // Step 5: Map the listen count to the corresponding artist
    const artistData = artists.map((artist) => ({
      artist: artist,
      totalListens: artistListenCount[artist._id.toString()],
    }));

    // Step 6: Sort the artists by total listens in descending order
    artistData.sort((a, b) => b.totalListens - a.totalListens);

    // Step 7: Return the top 10 artists
    const top10Artists = artistData.slice(0, 10);

    console.log('Top 10 Artists:', top10Artists);

    logger.info(`Top 10 Artists the most listened ${top10Artists}.`);

    return top10Artists;
  } catch (error) {
    logger.error('Error fetching top 10 artists by listens:', error);
    throw error;
  }
};

module.exports = {
  createArtist,
  getAllArtist,
  getArtistById,
  updatedArtist,
  deleteArtist,
  getArtistsByGenre,
  getArtistByName,
  getTop10ArtistsByNumberOfListens,
};
