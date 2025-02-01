const redisClient = require('../config/redis');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const Joi = require('joi');

// Validation des données d'entrée
const roomSchema = Joi.object({
  roomId: Joi.string().uuid().required(),
  userId: Joi.string().required(),
});

// 📌 Création d'une salle
const createRoom = async () => {
  try {
    const roomId = uuidv4();
    const url = process.env.FRONT_URL;
    const shareUrl = `${url}/room/${roomId}`;

    await redisClient.hset(`room:${roomId}`, {
      id: roomId,
      shareUrl,
      createdAt: Date.now(),
    });

    logger.info(`Salle créée avec succès: ${roomId}`);
    return { id: roomId, shareUrl };
  } catch (error) {
    logger.error(`Erreur lors de la création d’une salle: ${error.message}`);
    throw error;
  }
};

// 📌 Récupération des informations d'une salle
const getRoom = async (roomId) => {
  try {
    const room = await redisClient.hgetall(`room:${roomId}`);
    if (!room || !room.id) {
      logger.warn(`Salle non trouvée: ${roomId}`);
      throw new Error('Room not found');
    }

    logger.info(`Salle récupérée: ${roomId}`);
    return room;
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la salle ${roomId}: ${error.message}`);
    throw error;
  }
};

// 📌 Ajout d'un utilisateur dans une salle
const joinRoom = async (roomId, userId) => {
  try {
    const { error } = roomSchema.validate({ roomId, userId });
    if (error) throw new Error(error.details[0].message);

    const roomExists = await redisClient.exists(`room:${roomId}`);
    if (!roomExists) {
      logger.warn(`Tentative de rejoindre une salle inexistante: ${roomId}`);
      throw new Error('Room not found');
    }

    await redisClient.sadd(`room:${roomId}:participants`, userId);
    logger.info(`Utilisateur ${userId} a rejoint la salle ${roomId}`);
  } catch (error) {
    logger.error(`Erreur lors de l’ajout de l’utilisateur ${userId} dans la salle ${roomId}: ${error.message}`);
    throw error;
  }
};

// 📌 Récupération des participants
const getParticipants = async (roomId) => {
  try {
    const participants = await redisClient.smembers(`room:${roomId}:participants`);
    logger.info(`Participants de la salle ${roomId} récupérés: ${participants.length} utilisateurs`);
    return participants;
  } catch (error) {
    logger.error(`Erreur lors de la récupération des participants de la salle ${roomId}: ${error.message}`);
    throw error;
  }
};

// 📌 Suppression d'un utilisateur d'une salle
const leaveRoom = async (roomId, userId) => {
  try {
    await redisClient.srem(`room:${roomId}:participants`, userId);
    logger.info(`Utilisateur ${userId} a quitté la salle ${roomId}`);
  } catch (error) {
    logger.error(`Erreur lors du départ de l’utilisateur ${userId} de la salle ${roomId}: ${error.message}`);
    throw error;
  }
};

// 📌 Récupération de l'état de lecture d'une salle (lecture/pause + position)
const getPlaybackState = async (roomId) => {
  try {
    const state = await redisClient.hgetall(`room:${roomId}:state`);
    if (!state) {
      logger.warn(`Aucun état de lecture trouvé pour la salle ${roomId}`);
      return { playing: false, position: 0 };
    }

    logger.info(`État de lecture récupéré pour la salle ${roomId}: ${JSON.stringify(state)}`);
    return state;
  } catch (error) {
    logger.error(`Erreur lors de la récupération de l’état de lecture de la salle ${roomId}: ${error.message}`);
    throw error;
  }
};

// 📌 Mise à jour de l'état de lecture (play/pause + position)
const updatePlaybackState = async (roomId, playing, position) => {
  try {
    await redisClient.hset(`room:${roomId}:state`, {
      playing,
      position,
    });

    logger.info(`État de lecture mis à jour pour la salle ${roomId}: playing=${playing}, position=${position}`);
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de l’état de lecture de la salle ${roomId}: ${error.message}`);
    throw error;
  }
};

// 📌 Fonction pour inviter un utilisateur à rejoindre une salle via un lien d'invitation
const inviteToRoom = async (inviteUrl, userId) => {
  try {
    // Extraire le roomId à partir de l'URL d'invitation
    const roomId = inviteUrl.split('/').pop(); // Si l'URL est de la forme "/room/{roomId}"

    const { error } = roomSchema.validate({ roomId, userId });
    if (error) throw new Error(error.details[0].message);

    // Vérification si la salle existe
    const roomExists = await redisClient.exists(`room:${roomId}`);
    if (!roomExists) {
      logger.warn(`Tentative d’invitation pour une salle inexistante: ${roomId}`);
      throw new Error('Room not found');
    }

    // Ajouter l'utilisateur dans la salle
    await redisClient.sadd(`room:${roomId}:participants`, userId);
    logger.info(`Utilisateur ${userId} a rejoint la salle ${roomId} via invitation`);

    return { success: true, roomId, userId };
  } catch (error) {
    logger.error(`Erreur lors de l’invitation de l’utilisateur ${userId} dans la salle ${inviteUrl}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createRoom,
  getRoom,
  joinRoom,
  getParticipants,
  leaveRoom,
  getPlaybackState,
  updatePlaybackState,
  inviteToRoom
};
