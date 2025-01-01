const path = require('path');
const fs = require('fs');
const { getFileFromCache, setFileInCache } = require('../services/fileCacheService'); 

const cacheFileMiddleware = async (req, res, next) => {
    const key = req.originalUrl; 
    try {
        const cachedFile = await getFileFromCache(key);
        if (cachedFile) {
            console.log('Cache hit (fichier)');
            const buffer = Buffer.from(cachedFile, 'base64'); // Convertir le fichier en buffer
            res.set('Content-Type', 'audio/m4a'); 
            return res.send(buffer);
        }

        console.log('Cache miss (fichier)');
        next(); 
    } catch (error) {
        console.error('Redis cache error:', error);
        next(); 
    }
};

const addFileToCache = async (req, res, next) => {
    const key = req.originalUrl;
    const filePath = path.join(__dirname, '../optimized', req.params.filename);

    try {
        const fileBuffer = fs.readFileSync(filePath);
        await setFileInCache(key, fileBuffer.toString('base64'), 3600); 

        res.set('Content-Type', 'audio/mp4'); 
        res.send(fileBuffer); // Répondre avec le fichier
    } catch (error) {
        console.error('Erreur lors de la lecture du fichier:', error);
        res.status(404).send('Fichier introuvable.');
    }
};

module.exports = { cacheFileMiddleware, addFileToCache };
