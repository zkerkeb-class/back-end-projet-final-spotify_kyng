const express = require('express');
const router = express.Router();
const { cacheFileMiddleware, addFileToCache } = require('../middlewares/filecacheMiddleware');

router.get('/track/:filename', cacheFileMiddleware, addFileToCache);
//router.get('/track', cacheFileMiddleware, addFileToCache);

module.exports = router;
