const redisClient = require('../index');

const getFileFromCache = async (key) => {
  try {
    const cachedFile = await redisClient.get(key);
    return cachedFile ? JSON.parse(cachedFile) : null;
  } catch (error) {
    console.error('Error retrieving file from cache:', error);
    return null;
  }
};

const setFileInCache = async (key, data, ttl = 7200) => {
  try {
    await redisClient.setex(key, ttl, JSON.stringify(data));
    console.log(`Fichier mis en cache avec succès : ${key}`);
  } catch (error) {
    console.error('Error saving file to cache:', error);
  }
};

module.exports = {
  getFileFromCache,
  setFileInCache,
};
