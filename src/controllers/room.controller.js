const roomService = require('../services/roomService');
const logger = require('../utils/logger');

const createRoom = async (req, res) => {
  try {
    logger.info('Création d’une nouvelle salle...');
    const room = await roomService.createRoom();
    logger.info(`Salle créée: ${room.id}`);
    res.status(201).json(room);
  } catch (error) {
    logger.error(`Erreur lors de la création d’une salle: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

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
}

const getRoomState = async (req, res) => {
  try {
    const { roomId } = req.params;
    logger.info(`Récupération de l’état de lecture et participants pour la salle ${roomId}`);

    const state = await roomService.getPlaybackState(roomId);
    const participants = await roomService.getParticipants(roomId);

    res.status(200).json({ state, participants });
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l’état de la salle ${roomId}: ${error.message}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


module.exports = {
  createRoom,
  getRoom,
  getRoomState
};
