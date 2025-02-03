const redisClient = require('../config/redis');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const Joi = require('joi');

// 📌 Validation des données d'entrée
const roomSchema = Joi.object({
  roomId: Joi.string().uuid().required(),
  userId: Joi.string().required(),
});

// 📌 Création d'une salle
const createRoom = async (currentTrack) => {
    console.log({currentTrack});
    
  try {
    const roomId = uuidv4();
    const shareUrl = `${process.env.FRONT_URL}/room/${roomId}`;
    await redisClient.hset(`room:${roomId}`, {
      id: roomId,
      shareUrl,
      createdAt: Date.now(),
    });
    setCurrentTrack(roomId, currentTrack);
    logger.info(`✅ Salle créée: ${roomId}`);
    return { id: roomId, shareUrl };
  } catch (error) {
    logger.error(`❌ Erreur création salle: ${error.message}`);
    throw error;
  }
};

// 📌 Récupération des informations d'une salle
const getRoom = async (roomId) => {
  try {
    const room = await redisClient.hgetall(`room:${roomId}`);
    if (!room.id) throw new Error('Room not found');
    return room;
  } catch (error) {
    throw new Error(`Erreur récupération salle: ${error.message}`);
  }
};

// 📌 Ajout d'un utilisateur dans une salle
const joinRoom = async (roomId, userId) => {
  try {
    const { error } = roomSchema.validate({ roomId, userId });
    if (error) throw new Error(error.details[0].message);

    await redisClient.sadd(`room:${roomId}:participants`, userId);
    logger.info(`👤 User ${userId} rejoint salle ${roomId}`);
  } catch (error) {
    throw new Error(`Erreur ajout utilisateur: ${error.message}`);
  }
};

// 📌 Récupération des participants
const getParticipants = async (roomId) => {
  try {
    return await redisClient.smembers(`room:${roomId}:participants`);
  } catch (error) {
    throw new Error(`Erreur récupération participants: ${error.message}`);
  }
};

// 📌 Suppression d'un utilisateur d'une salle
const leaveRoom = async (roomId, userId) => {
  try {
    await redisClient.srem(`room:${roomId}:participants`, userId);
    logger.info(`❌ User ${userId} quitte salle ${roomId}`);
  } catch (error) {
    throw new Error(`Erreur départ utilisateur: ${error.message}`);
  }
};

// 📌 Récupération de l'état de lecture (lecture/pause + position)
const getPlaybackState = async (roomId) => {
  try {
    const state = await redisClient.hgetall(`room:${roomId}:state`);
    return state || { playing: false, position: 0 };
  } catch (error) {
    throw new Error(`Erreur récupération état de lecture: ${error.message}`);
  }
};

// 📌 Mise à jour de l'état de lecture (play/pause + position)
const updatePlaybackState = async (roomId, playing = null, position = null) => {
  try {
    const updates = {};
    if (playing !== null) updates.playing = playing;
    if (position !== null) updates.position = position;

    await redisClient.hset(`room:${roomId}:state`, updates);
    logger.info(`🎵 État mis à jour salle ${roomId}: ${JSON.stringify(updates)}`);
  } catch (error) {
    throw new Error(`Erreur mise à jour état de lecture: ${error.message}`);
  }
};

const updateCurrentTime = async (roomId, currentTime) => {
  try {
    await redisClient.hset(`room:${roomId}:state`, 'currentTime', currentTime);
    logger.info(`🎵 Temps actuel mis à jour salle ${roomId}: ${currentTime}`);
  } catch (error) {
    throw new Error(`Erreur mise à jour temps actuel: ${error.message}`);
  }
};

// 📌 Mise à jour du volume
const updateVolume = async (roomId, volume) => {
  try {
    await redisClient.hset(`room:${roomId}:state`, 'volume', volume);
    logger.info(`🔊 Volume mis à jour salle ${roomId}: ${volume}`);
  } catch (error) {
    throw new Error(`Erreur mise à jour volume: ${error.message}`);
  }
};

// 📌 Récupération du morceau en cours
const getCurrentTrack = async (roomId) => {
  try {
    return await redisClient.hget(`room:${roomId}`, 'currentTrack');
  } catch (error) {
    throw new Error(`Erreur récupération track: ${error.message}`);
  }
};

// 📌 Mise à jour du morceau pour tous les participants
const setCurrentTrack = async (roomId, trackId) => {
  try {
    await redisClient.hset(`room:${roomId}`, 'currentTrack', trackId);
    logger.info(`🔄 Changement de track dans salle ${roomId}: ${trackId}`);
    return { trackId };
  } catch (error) {
    throw new Error(`Erreur changement track: ${error.message}`);
  }
};

// 📌 Invitation via lien
const inviteToRoom = async (roomId, userId) => {
  try {
    const { error } = roomSchema.validate({ roomId, userId });
    if (error) throw new Error(error.details[0].message);

    const roomExists = await redisClient.exists(`room:${roomId}`);
    if (!roomExists) throw new Error('Room not found');

    await redisClient.sadd(`room:${roomId}:participants`, userId);
    return { success: true, roomId, userId };
  } catch (error) {
    throw new Error(`Erreur invitation: ${error.message}`);
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
  getCurrentTrack,
  setCurrentTrack,
  updateCurrentTime,
  updateVolume,
  inviteToRoom,
};
