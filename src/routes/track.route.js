const express = require('express');
const router = express.Router();
 const { cacheFileMiddleware, addFileToCache } = require('../middlewares/filecacheMiddleware');

router.get('/:filename', cacheFileMiddleware, addFileToCache);


module.exports = router;
