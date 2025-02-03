const roomService = require('../services/roomService');
const logger = require('../utils/logger');

// 📌 Création d'une nouvelle salle
const createRoom = async (req, res) => {
  try {
    logger.info('Création d’une nouvelle salle...');
    const room = await roomService.createRoom(req.body.currentTrackId);
    logger.info(`Salle créée: ${room.id}`);
    res.status(201).json(room);
  } catch (error) {
    logger.error(`Erreur lors de la création d’une salle: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 📌 Récupérer une salle par ID
const getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    logger.info(`Récupération des infos de la salle ${roomId}`);
    const room = await roomService.getRoom(roomId);
    res.status(200).json(room);
  } catch (error) {
    logger.warn(`Salle non trouvée: ${req.params.roomId}`);
    res.status(404).json({ error: error.message });
  }
};

// 📌 Récupérer l'état de la salle et des participants
const getRoomState = async (req, res) => {
  try {
    const { roomId } = req.params;
    logger.info(`Récupération de l’état de lecture et participants pour la salle ${roomId}`);
    const state = await roomService.getPlaybackState(roomId);
    const participants = await roomService.getParticipants(roomId);
    res.status(200).json({ state, participants });
  } catch (error) {
    logger.error(
      `Erreur lors de la récupération de l’état de la salle ${roomId}: ${error.message}`
    );
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 📌 Inviter un utilisateur à rejoindre la salle via un lien
const inviteToRoom = async (req, res) => {
  try {
    const { roomId, userId } = req.params; // inviteUrl est l'URL d'invitation, userId est l'ID de l'utilisateur
    logger.info(`Tentative d’inviter l’utilisateur ${userId} à rejoindre la salle via ${roomId}`);

    const result = await roomService.inviteToRoom(roomId, userId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(
      `Erreur lors de l’invitation de l’utilisateur ${userId} à rejoindre la salle: ${error.message}`
    );
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  createRoom,
  getRoom,
  getRoomState,
  inviteToRoom,
};
