const mongoose = require('mongoose');
const Track = require('../models/Track')(mongoose);
const Joi = require('joi');
const logger = require('../utils/logger');
const { extractAudioMetadata } = require('../utils/metadataExtractor');
const { uploadToAzureStorage } = require('./seedService');
const Artist = require('../models/Artist')(mongoose);
const { ObjectId } = require('mongodb');
const { Types } = require('mongoose');
const Album = require('../models/Album')(mongoose);
const Playlist = require('../models/Playlist')(mongoose);

// const redisClient = require('../config/redis');
// const Playlist = require('../models/Playlist');


const trackSchema = Joi.object({
  title: Joi.string().required().trim(),
  duration: Joi.number().required().min(0),
  audioLink: Joi.alternatives().try(
    Joi.string().required(),
    Joi.object({
      convertedPath: Joi.string().required(),
      originalName: Joi.string().optional(),
      size: Joi.number().optional(),
      mimetype: Joi.string().optional()
    }).required()
  ),
  albumId: Joi.alternatives().try(
    Joi.string().hex().length(24).optional(), // Matches MongoDB ObjectId string (24 hex characters)
    Joi.object().optional() // Allows an actual ObjectId
  ).optional(),
  isExplicit: Joi.boolean().optional(),
  lyrics: Joi.string().optional(),
  artistId: Joi.object().optional(),
  collaborators: Joi.array().items(Joi.string()).optional(),
  credits: Joi.object().optional(),
  numberOfListens: Joi.number().optional(),
  popularity: Joi.number().optional(),
  trackNumber: Joi.number().optional(),
  releaseYear: Joi.number().optional()
});

const createTrack = async (data) => {
  try {
    const { artistId, albumId } = data;

    if (artistId && mongoose.Types.ObjectId.isValid(artistId)) {
      data.artistId = new Types.ObjectId(artistId);
    } else {
      data.artistId = null; // or remove it entirely using `delete data.artistId`
    }
    if (albumId && mongoose.Types.ObjectId.isValid(albumId)) {
      data.albumId = new Types.ObjectId(albumId);
    } else {
      data.albumId = null; // or remove it entirely using `delete data.artistId`
    }
    // console.log('tt : ', data.artistId)
    // Convert albumId to ObjectId if it's a valid format, otherwise set it to null
    if (albumId && mongoose.Types.ObjectId.isValid(albumId)) {
      data.albumId = new Types.ObjectId(albumId);
    } else {
      data.albumId = null; // or remove it entirely using `delete data.albumId`
    }

    console.log('tt : ', data.albumId)
    const { error, value } = trackSchema.validate(data);
    if (error) {
      throw new Error(error.details[0].message);
    }

    const artistExists = await Artist.find({ _id: value.artistId });
    if (!artistExists) {
      throw new Error(`Artist with ID ${value.artistId} does not exist.`);
    }

    let azureFileUrl;
    if (typeof value.audioLink === 'object') {
      azureFileUrl = await uploadToAzureStorage(value.audioLink.convertedPath, 'spotify');
      fileName = azureFileUrl.split('/').pop(); // Extract only the file name
    } else {
      fileName = value.audioLink.split('/').pop(); // Handle string input directly
    }

    // Rest of the method remains the same...
    const trackPayload = {
      ...value,
      audioLink: fileName
    };

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

    const tracks = await Track.find().populate('artistId').skip(skip).limit(limit);

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

    const track = await Track.findById(id).populate('artistId')
    .populate('albumId');

    if (!track) {
      logger.warn(`Track with ID ${id} not found.`);
    }
    return track;
  } catch (error) {
    logger.error(`Error fetching track by ID: ${error.message}.`);
    throw error;
  }
};

const getTrackByTitle = async (title) => {
  try {
    if (!title) {
      throw new Error('Track title is required.');
    }

    const track = await Track.find({
        title: title
    }).populate('artistId')
    .populate('albumId');

    if (!track) {
      logger.warn(`Track with title ${title} not found.`);
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
    const tracks = await Track.find({ artistId }).populate('artistId').populate('albumId').skip(skip).limit(limit);

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
    const tracks = await Track.find({ albumId }).populate('artistId').populate('albumId').skip(skip).limit(limit);

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

const getTop10TracksByReleaseDate = async () => {
  try {
    logger.info("Fetching top 10 tracks by release date");

    const top10Tracks = await Track.find()
      .sort({ releaseYear: -1 })
      .limit(10);

    if (!top10Tracks || top10Tracks.length === 0) {
      logger.warn("No tracks found for top 10 by release date");
      return { status: 404, message: "No tracks found", data: null };
    }

    logger.info(`Found ${top10Tracks.length} tracks`);
    return { status: 200, message: "Top 10 tracks found", data: top10Tracks };
  } catch (error) {
    logger.error(`Error fetching top 10 tracks by release date: ${error.message}`);
    return { status: 500, message: "Error fetching top 10 tracks", data: null, error: error.message };
  }
};


const advancedFilter = async (filters, sorts, page, limit) => {
  try {
    let filterQuery = {};

    // Filter by artist
    if (filters.artist) {
      const artistNames = filters.artist.map(name => name.trim());
      const artists = await Artist.find({ name: { $in: artistNames } });
      const artistIds = artists.map(artist => artist._id);
      filterQuery.artistId = { $in: artistIds };
    }

    // Filter by album
    if (filters.album) {
      const albumNames = filters.album.map(name => name.trim());
      const albums = await Album.find({ title: { $in: albumNames } });
      const albumIds = albums.map(album => album._id);
      filterQuery.albumId = { $in: albumIds };
    }

    // Filter by genre (from both Album and Artist models)
    if (filters.genre) {
      // Handle genres in Album model
      const albumGenres = await Album.find({ genres: { $in: filters.genre } });
      const albumIds = albumGenres.map(album => album._id);
      
      // Handle genres in Artist model
      const artistGenres = await Artist.find({ genres: { $in: filters.genre } });
      const artistIds = artistGenres.map(artist => artist._id);
      
      // Combine album and artist IDs for filtering tracks
      const trackQuery = {
        $or: [
          { albumId: { $in: albumIds } },
          { artistId: { $in: artistIds } }
        ]
      };
      
      filterQuery = { ...filterQuery, ...trackQuery };
    }

    // Filter by year range
    if (filters.year) {
      filterQuery.releaseYear = { $gte: filters.year.start, $lte: filters.year.end };
    }

    // Filter by duration range
    if (filters.duration) {
      filterQuery.duration = { $gte: filters.duration.min, $lte: filters.duration.max };
    }

    // Filter by popularity
    if (filters.popularity) {
      filterQuery.popularity = { $gte: filters.popularity };
    }

    // Filter by playlist
    if (filters.playlist) {
      const playlists = await Playlist.find({ name: filters.playlist });
      const playlistIds = playlists.map(playlist => playlist._id);
      filterQuery.playlistId = { $in: playlistIds };
    }

    // Sorting
    let sortQuery = {};
    sorts.forEach(sort => {
      if (sort.field === 'duration') {
        sortQuery.duration = sort.direction === 'desc' ? -1 : 1;
      } else if (sort.field === 'releaseDate') {
        sortQuery.releaseDate = sort.direction === 'desc' ? -1 : 1;
      } else if (sort.field === 'popularity') {
        sortQuery.popularity = sort.direction === 'desc' ? -1 : 1;
      } else if (sort.field === 'title') {
        sortQuery.title = sort.direction === 'desc' ? -1 : 1;
      } else if (sort.field === 'trackCount') {
        sortQuery.trackCount = sort.direction === 'desc' ? -1 : 1;
      }
    });

    const skip = (page - 1) * limit;

    const results = await Track.find(filterQuery)
      .populate('artistId')
      .populate('albumId')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    // Add reasons for the filters
    const reasons = results.map(track => {
      const reason = [];
      if (filters.artist) reason.push(`Filtered by artist(s): ${filters.artist.join(', ')}`);
      if (filters.album) reason.push(`Filtered by album(s): ${filters.album.join(', ')}`);
      if (filters.genre) reason.push(`Filtered by genre(s): ${filters.genre.join(', ')}`);
      if (filters.year) reason.push(`Filtered by release year between ${filters.year.start} and ${filters.year.end}`);
      if (filters.duration) reason.push(`Filtered by track duration between ${filters.duration.min} and ${filters.duration.max} seconds`);
      if (filters.popularity) reason.push(`Filtered by popularity greater than or equal to ${filters.popularity}`);
      return {
        ...track.toObject(),
        reasons: reason,
      };
    });

    return {
      status: 200,
      data: reasons,
    };
  } catch (error) {
    console.error('Error in advancedFilter service:', error);
    return {
      status: 500,
      message: 'Error fetching filtered tracks',
      data: null,
      error: error.message,
    };
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
  getTracksByYear,
  getTrackByTitle,
  getTop10TracksByReleaseDate,
  advancedFilter
};
