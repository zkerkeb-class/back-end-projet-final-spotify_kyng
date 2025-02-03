const path = require('path');
const fs = require('fs');
const { getFileFromCache, setFileInCache } = require('../services/fileCacheService');
const logger = require('../utils/logger');

const cacheFileMiddleware = async (req, res, next) => {
  const key = `/track/${req.params.filename}`;
  logger.info('Clé de cache utilisée pour la récupération :', key);
  try {
    const cachedFile = await getFileFromCache(key);
    if (cachedFile) {
      const buffer = Buffer.from(cachedFile, 'base64');
      res.set('Content-Type', 'audio/m4a');
      return res.send(buffer);
    }
    next();
  } catch (error) {
    logger.error('Redis cache error:', error);
    next();
  }
};

const addFileToCache = async (req, res) => {
  const key = `/track/${req.params.filename}`;
  logger.info('Clé de cache utilisée pour la récupération :', key);
  const filePath = path.join(__dirname, '../optimized', req.params.filename);
  try {
    if (!fs.existsSync(filePath)) {
      logger.error('Fichier introuvable sur le disque:', filePath);
      return res.status(404).send('Fichier introuvable.');
    }
    const fileBuffer = fs.readFileSync(filePath);
    logger.info('Clé de cache utilisée :', key);
    await setFileInCache(key, fileBuffer.toString('base64'), 3600);

    res.set('Content-Type', 'audio/m4a');
    res.send(fileBuffer);
  } catch (error) {
    logger.error('Erreur lors de la lecture du fichier:', error);
    res.status(404).send('Fichier introuvable.');
  }
};

module.exports = { cacheFileMiddleware, addFileToCache };
