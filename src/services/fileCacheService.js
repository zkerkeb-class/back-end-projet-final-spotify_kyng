const redisClient = require('../config/redis');

const getFileFromCache = async (key) => {
  try {
    const cachedFile = await redisClient.get(key);
    return cachedFile ? cachedFile : null;  
  } catch (error) {
    console.error('Error retrieving file from cache:', error);
    return null;
  }
};

const setFileInCache = async (key, data, ttl = 7200) => {
  try {
    // Stockage direct sous forme de Buffer
    await redisClient.setex(key, ttl, data);  // Pas besoin de transformation ici
    console.log(`Fichier mis en cache avec succès : ${key}`);
  } catch (error) {
    console.error('Error saving file to cache:', error);
  }
};


module.exports = {
  getFileFromCache,
  setFileInCache,
};
