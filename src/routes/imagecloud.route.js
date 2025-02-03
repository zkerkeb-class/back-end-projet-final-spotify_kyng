const express = require('express');
const router = express.Router();
const axios = require('axios');

const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

// Route pour récupérer une image depuis CloudFront
router.get('/cloudfront-image/:filename', async (req, res) => {
  const filename = req.params.filename;
  const cloudfrontUrl = `https://${CLOUDFRONT_URL}/spotify-image/${filename}`;

  try {
    // Requête vers CloudFront
    const response = await axios.get(cloudfrontUrl, {
      responseType: 'stream', // Récupérer sous forme de flux
    });

    // Définir le type de contenu de l'image
    res.setHeader('Content-Type', response.headers['content-type']);

    // Streamer l'image au client
    response.data.pipe(res);
  } catch (error) {
    console.error(`Error fetching CloudFront image: ${error.message}`);
    res.status(500).json({ error: 'Error fetching the CloudFront image' });
  }
});

module.exports = router;
