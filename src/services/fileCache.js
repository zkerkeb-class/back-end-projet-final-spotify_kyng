const redisClient = require('../config/redis');

async function cacheFile(fileId, fileData, ttl = 300) {
    const key = `file:${fileId}`;
    await redisClient.set(key, JSON.stringify(fileData), 'EX', ttl);
}

async function getCachedFile(fileId) {
    const key = `file:${fileId}`;
    const cachedFile = await redisClient.get(key);
    return cachedFile ? JSON.parse(cachedFile) : null;
}

module.exports = { cacheFile, getCachedFile };
