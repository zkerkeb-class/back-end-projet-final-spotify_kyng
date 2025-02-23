const mongoose = require('mongoose');
const Album = require('../models/Album')(mongoose);
const Artist = require('../models/Artist')(mongoose);
const User = require('../models/user')(mongoose);
const Joi = require('joi');
const logger = require('../utils/logger');

const albumSchema = Joi.object({
  title: Joi.string().optional().trim(),
  linkTitle: Joi.string().optional(),
  linkType: Joi.string().optional(),
  artistId: Joi.string().optional(),
  releaseDate: Joi.date().optional(),
  images: Joi.array()
    .items(
      Joi.object({
        path: Joi.string().required(),
      })
    )
    .optional(),
  audioTracks: Joi.array().items(Joi.string()).optional(),
  duration: Joi.number().min(0).optional(),
  genre: Joi.string().optional(),
});

// TODO ajouter pour l'image un tableau de uri
const createAlbum = async (data) => {
  try {
    let artist = await Artist.findById(data.artistId);
    if (!artist) {
      artist = await User.findById(data.artistId);
      artist.name=artist.firstname+" "+artist.lastname;
      if (!artist) throw new Error(`Artist with the name '${data.artist}' not found.`);
    }

    const { error, value } = albumSchema.validate(data);

    if (error) {
      throw new Error(error.details[0].message);
    }

    const album = await Album.create(value);

    logger.info('Album created successfully.');

    return album;
  } catch (error) {
    logger.error(`Error creating album: ${error.message}.`);
    throw error;
  }
};

const getAllAlbums = async (page = 1, limit = 10) => {
  try {
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

const getAlbumByTitle = async (title) => {
  try {
    if (!title) {
      throw new Error('Album title is required.');
    }

    const album = await Album.find({
      title: title,
    }).populate('artistId', 'name');

    if (!album) {
      logger.warn(`Album with title ${title} not found.`);
    }
    return album;
  } catch (error) {
    logger.error(`Error fetching album by Title: ${error.message}.`);
    throw error;
  }
};

const updatedAlbum = async (id, data) => {
  try {
    if (!id) {
      throw new Error('Album ID is required.');
    }

    if (!data.artistId) {
      delete data.artistId;
    }

    const { error, value } = albumSchema.validate(data, { allowUnknown: true });

    if (error) {
      throw new Error(error.details[0].message);
    }

    // Find the album by ID and update it with the new data
    const updatedAlbum = await Album.findByIdAndUpdate(id, value, { new: true });

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
    const skip = (page - 1) * limit;
    const artistIdObject = mongoose.Types.ObjectId.isValid(artistId)
      ? new mongoose.Types.ObjectId(artistId)
      : artistId;

    // Find albums and count
    const albums = await Album.find({ artistId: artistIdObject })
      .populate('artistId')
      .skip(skip)
      .limit(limit);
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

    logger.info(`Albums for artist ${artistId} retrieved from database.`);
    return result;
  } catch (err) {
    logger.error(`Error fetching albums by artist: ${err.message}`);
    throw err;
  }
};

const getAlbumsByGenre = async (genre, page = 1, limit = 10) => {
  try {
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

    return result;
  } catch (err) {
    logger.error(`Error fetching albums by genre: ${err.message}`);
    throw err;
  }
};

const getAlbumsByYear = async (year) => {
  try {
    if (!year) {
      throw new Error('Year parameter is required.');
    }

    const albums = await Album.find({
      $expr: {
        $eq: [{ $year: '$releaseDate' }, Number(year)], // Match the year
      },
    });

    logger.info(`Cache set for albums released in year ${year}.`);

    return albums;
  } catch (error) {
    logger.error(`Error fetching albums by year ${year}: ${error.message}`);
    throw error;
  }
};

const getTop10RecentAlbums = async () => {
  try {
    const recentAlbums = await Album.find()
      .sort({ releaseDate: -1 })
      .limit(10)
      .populate('artistId');

    if (!recentAlbums || recentAlbums.length === 0) {
      logger.warn('No recent albums found.');
      return { status: 404, message: 'No recent albums found', data: null };
    }

    logger.info(`Found ${recentAlbums.length} recent albums.`);
    return { status: 200, message: 'Top 10 recent albums found', data: recentAlbums };
  } catch (error) {
    logger.error(`Error fetching top 10 recent albums: ${error.message}`);
    return {
      status: 500,
      message: 'Error fetching recent albums',
      data: null,
      error: error.message,
    };
  }
};

// SEARCH

const searchAlbums = async (filters, page = 1, limit = 10) => {
  try {
    const query = {};

    if (filters.title) {
      query.title = { $regex: filters.title, $options: 'i' };
    }

    if (filters.artistName) {
      const artist = await Artist.findOne({ name: { $regex: filters.artistName, $options: 'i' } });
      if (artist) query.artistId = artist._id;
    }

    if (filters.genre) {
      query.genre = { $regex: filters.genre, $options: 'i' };
    }

    if (filters.releaseYear) {
      query.releaseDate = {
        $gte: new Date(`${filters.releaseYear}-01-01`),
        $lt: new Date(`${Number(filters.releaseYear) + 1}-01-01`),
      };
    }

    const skip = (page - 1) * limit;
    const totalCount = await Album.countDocuments(query);
    const albums = await Album.find(query).populate('artistId', 'name').skip(skip).limit(limit);

    logger.info(`Found ${totalCount} results for this research.`);

    return {
      albums,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  } catch (error) {
    logger.error(`Error searching albums: ${error.message}`);
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
  getAlbumsByYear,
  getAlbumByTitle,
  getTop10RecentAlbums,
  searchAlbums,
};
