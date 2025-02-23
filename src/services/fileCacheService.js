const redisClient = require('../index');
const logger = require('../utils/logger');

const getFileFromCache = async (key) => {
  try {
    const cachedFile = await redisClient.get(key);
    return cachedFile ? JSON.parse(cachedFile) : null;
  } catch (error) {
    logger.error('Error retrieving file from cache:', error);
    return null;
  }
};

const setFileInCache = async (key, data, ttl = 7200) => {
  try {
    await redisClient.setex(key, ttl, JSON.stringify(data));
    logger.info(`Fichier mis en cache avec succès : ${key}`);
  } catch (error) {
    logger.error('Error saving file to cache:', error);
  }
};

module.exports = {
  getFileFromCache,
  setFileInCache,
};
