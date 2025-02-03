const redisClient = require('../config/redis');
const logger = require('../utils/logger');

// Fonctions existantes
const setSession = async (token, sessionData, expiration = 3600) => {
  const redisKey = `user_session:${token}`;
  logger.info(`Setting session for token: ${token} with data:`, sessionData);
  await redisClient.set(redisKey, JSON.stringify(sessionData), 'EX', expiration);
};

const getSession = async (token) => {
  const redisKey = `user_session:${token}`;
  const session = await redisClient.get(redisKey);
  logger.info(`Fetching session for token: ${token}, Found:`, session);
  return session ? JSON.parse(session) : null;
};

const deleteSession = async (token) => {
  const redisKey = `user_session:${token}`;
  logger.info(`Deleting session for token: ${token}`);
  return await redisClient.del(redisKey);
};

const sessionExists = async (token) => {
  const redisKey = `user_session:${token}`;
  const exists = await redisClient.exists(redisKey);
  logger.info(`Checking if session exists for token: ${token}, Exists: ${exists === 1}`);
  return exists === 1;
};

// Nouvelle fonction : Ajouter un token à la liste noire
const addToBlacklist = async (token) => {
  const blacklistKey = `blacklist:${token}`;
  logger.info(`Adding token to blacklist: ${token}`);
  await redisClient.set(blacklistKey, 'true', 'EX', 3600); // Expire après 1 heure (comme le token)
};

// Nouvelle fonction : Vérifier si un token est dans la liste noire
const isTokenBlacklisted = async (token) => {
  const blacklistKey = `blacklist:${token}`;
  const isBlacklisted = await redisClient.get(blacklistKey);
  logger.info(
    `Checking if token is blacklisted: ${token}, Is blacklisted: ${isBlacklisted === 'true'}`
  );
  return isBlacklisted === 'true';
};

// Exporter toutes les fonctions
module.exports = {
  setSession,
  getSession,
  deleteSession,
  sessionExists,
  addToBlacklist,
  isTokenBlacklisted,
};
