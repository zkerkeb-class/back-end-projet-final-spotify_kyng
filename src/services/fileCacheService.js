const Redis = require('ioredis');
const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
});

// Fonction pour récupérer un fichier depuis le cache
const getFileFromCache = async (key) => {
    try {
        const cachedFile = await redisClient.get(key);
        return cachedFile ? JSON.parse(cachedFile) : null;
    } catch (error) {
        console.error('Error retrieving file from cache:', error);
        return null;
    }
};

// Fonction pour enregistrer un fichier dans le cache
const setFileInCache = async (key, data, ttl = 3600) => {
    try {
        await redisClient.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving file to cache:', error);
    }
};

module.exports = {
    getFileFromCache,
    setFileInCache,
};
