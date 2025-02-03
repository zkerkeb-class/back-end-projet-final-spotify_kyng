const mongoose = require('mongoose');
const Playlist = require('../models/Playlist')(mongoose);
const Joi = require('joi');
const logger = require('../utils/logger');
const Track = require('../models/Track')(mongoose);

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

    logger.info('Playlist created successfully.');

    return playlist;
  } catch (error) {
    logger.error(`Error creating playlist: ${error.message}.`);
    throw error;
  }
};

const getAllPlaylists = async (page = 1, limit = 10) => {
  try {
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

    if (deletePlaylist) {
      logger.info(`Playlist with ID ${id} deleted successfully.`);
    }

    return deletePlaylist;
  } catch (error) {
    logger.error(`Error deleting track: ${error.message}.`);
    throw error;
  }
};

const addTrackToPlaylist = async (playlistId, trackId) => {
  try {
    // Validate input
    if (!playlistId || !trackId) {
      throw new Error('Playlist ID and Track ID are required');
    }

    // Check if playlist exists
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    const trackIdObject = mongoose.Types.ObjectId.isValid(trackId)
      ? new mongoose.Types.ObjectId(trackId)
      : trackId;
    // Check if track exists
    const track = await Track.findById(trackIdObject);
    if (!track) {
      throw new Error('Track not found');
    }

    // Add track to playlist's tracks
    playlist.pistes_audio = playlist.pistes_audio ? `${playlist.pistes_audio},${trackId}` : trackId;

    // Update playlist duration
    playlist.duration += track.duration;

    await playlist.save();

    logger.info(`Track ${trackId} added to playlist ${playlistId}`);
    return playlist;
  } catch (error) {
    logger.error(`Error adding track to playlist: ${error.message}`);
    throw error;
  }
};

// Get the 20 most recently played tracks
const getLastPlayedTracks = async () => {
  logger.info('Fetching last played tracks.');
  return await Track.find({ lastPlayed: { $ne: null } })
    .sort({ lastPlayed: -1 })
    .limit(20);
};

// Get the 20 most played tracks
const getMostPlayedTracks = async () => {
  logger.info('Fetching most played tracks.');
  return await Track.find({}).sort({ numberOfListens: -1 }).limit(20);
};

module.exports = {
  createPlaylist,
  getAllPlaylists,
  getPlaylistById,
  updatedPlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  getLastPlayedTracks,
  getMostPlayedTracks,
};
