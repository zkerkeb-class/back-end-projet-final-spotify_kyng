const express = require('express');
const router = express.Router();
// const { cacheFileMiddleware, addFileToCache } = require('../middlewares/filecacheMiddleware');

//router.get('/track/:filename', cacheFileMiddleware, addFileToCache);
//router.get('/track', cacheFileMiddleware, addFileToCache);

router.get('/:filename', (req, res) => {
  res.send(`Fichier demandé : ${req.params.filename}`);
});

module.exports = router;
