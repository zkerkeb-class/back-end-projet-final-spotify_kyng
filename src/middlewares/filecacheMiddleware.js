const path = require('path');
const fs = require('fs');
const { getFileFromCache, setFileInCache } = require('../services/fileCacheService');

const cacheFileMiddleware = async (req, res, next) => {
  const key = `/track/${req.params.filename}`;
  console.log('Clé de cache utilisée pour la récupération :', key);

  try {
    // Vérifier si le fichier est dans le cache
    const cachedFile = await getFileFromCache(key);
    if (cachedFile) {
      console.log('Cache hit (fichier)');
      res.set('Content-Type', 'audio/m4a');
      return res.send(cachedFile);  // Si cache hit, on renvoie le fichier
    }

    console.log('Cache miss (fichier)');
    // Si le fichier n'est pas dans le cache, on passe au prochain middleware
    next();  
  } catch (error) {
    console.error('Erreur Redis:', error);
    next();  // On continue même si une erreur Redis survient
  }
};

const addFileToCache = async (req, res) => {
  const key = `/track/${req.params.filename}`;
  console.log('Clé de cache utilisée pour l’ajout :', key);
  const filePath = path.join(__dirname, '../optimized', req.params.filename); // Vérifie le chemin du fichier

  try {
    if (!fs.existsSync(filePath)) {
      console.error('Fichier introuvable sur le disque:', filePath);
      return res.status(404).send('Fichier introuvable.'); // Si fichier n'existe pas, retourne 404
    }

    // Lire le fichier depuis le disque
    const fileBuffer = fs.readFileSync(filePath);
    console.log('Clé de cache utilisée pour ajouter le fichier :', key);
    
    // Ajouter le fichier dans le cache Redis
    await setFileInCache(key, fileBuffer, 3600);  // TTL (time to live) de 1 heure
    
    // Répondre avec le fichier
    res.set('Content-Type', 'audio/m4a');
    res.send(fileBuffer);  // Renvoie le fichier au client
  } catch (error) {
    console.error('Erreur lors de la lecture du fichier:', error);
    res.status(404).send('Fichier introuvable.');
  }
};


module.exports = { cacheFileMiddleware, addFileToCache };
