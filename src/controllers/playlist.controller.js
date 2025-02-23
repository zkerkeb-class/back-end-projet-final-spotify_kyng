const playlistService = require('../services/playlistService');
const logger = require('../utils/logger');

const createPlaylist = async (req, res) => {
  try {
    const playlist = await playlistService.createPlaylist(req.body);
    logger.info(`Playlist creation request handled successfully.`);

    res.status(201).json(playlist);
  } catch (error) {
    logger.error(`Error in createPlaylist: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const getAllPlaylist = async (req, res) => {
  try {
    const playlists = await playlistService.getAllPlaylists();
    logger.info(`Playlist list retrieval request handled successfully.`);

    res.status(200).json(playlists);
  } catch (error) {
    logger.error(`Error in getAllPlaylist: ${error.message}.`);

    res.status(500).json({ error: error.message });
  }
};

const getPlaylistById = async (req, res) => {
  try {
    const playlist = await playlistService.getPlaylistById(req.params.id);

    if (!playlist) {
      logger.warn(`Playlist with ID ${req.params.id} not found`);

      return res.status(404).json({ error: 'Playlist not found.' });
    }
    logger.info(`Playlist with ID ${req.params.id} retrieved successfully.`);

    res.status(200).json(playlist);
  } catch (error) {
    logger.error(`Error in getPlaylistById: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const updatedPlaylist = async (req, res) => {
  try {
    const playlist = await playlistService.updatedPlaylist(req.params.id, req.body);

    if (!playlist) {
      logger.warn(`Playlist with ID ${req.params.id} not found for update.`);

      return res.status(404).json({ error: 'Playlist not found.' });
    }
    logger.info(`Playlist with ID ${req.params.id} updated successfully.`);

    res.status(200).json(playlist);
  } catch (error) {
    logger.error(`Error in updatedPlaylist: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const deletePlaylist = async (req, res) => {
  try {
    const playlist = await playlistService.deletePlaylist(req.params.id);

    if (!playlist) {
      logger.warn(`Playlist with ID ${req.params.id} not found for deletion.`);

      return res.status(404).json({ error: 'Playlist not found.' });
    }
    logger.info(`Playlist with ID ${req.params.id} deleted successfully.`);

    res.status(200).json({ message: 'Playlist deleted successfully.' });
  } catch (error) {
    logger.error(`Error in deletePlaylist: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const addTrackToPlaylist = async (req, res) => {
  try {
    const { playlistId } = req.params;
    const { trackId } = req.body;

    const updatedPlaylist = await playlistService.addTrackToPlaylist(playlistId, trackId);

    logger.info(`Track added to playlist ${playlistId} successfully.`);
    res.status(200).json(updatedPlaylist);
  } catch (error) {
    logger.error(`Error adding track to playlist: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

// Get the "Dernières écoutes" playlist
const getLastPlayedPlaylist = async (req, res) => {
  try {
    const lastPlayedTracks = await playlistService.getLastPlayedTracks();
    logger.info('Fetching "Dernières écoutes" playlist.');
    res.json(lastPlayedTracks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching last played tracks.' });
  }
};

// Get the "Les plus écoutées" playlist
const getMostPlayedPlaylist = async (req, res) => {
  try {
    const mostPlayedTracks = await playlistService.getMostPlayedTracks();
    logger.info('Fetching "Les plus écoutées" playlist.');
    res.json(mostPlayedTracks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching most played tracks.' });
  }
};

module.exports = {
  createPlaylist,
  getAllPlaylist,
  getPlaylistById,
  updatedPlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  getLastPlayedPlaylist,
  getMostPlayedPlaylist,
};
