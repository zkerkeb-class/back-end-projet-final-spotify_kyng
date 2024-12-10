const redisClient = require('../config/redis');

async function getCachedData(key, fetchFunction, ttl = 3600) {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
        console.log('Données récupérées depuis le cache Redis');
        return JSON.parse(cachedData);
    }

    const freshData = await fetchFunction();
    if (freshData) {
        await redisClient.set(key, JSON.stringify(freshData), 'EX', ttl);
    }
    return freshData;
}

module.exports = { getCachedData };
