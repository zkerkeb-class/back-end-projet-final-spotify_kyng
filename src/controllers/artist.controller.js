const artistService = require('../services/artistService');
const logger = require('../utils/logger');

const createArtist = async (req, res) => {
  try {
    if (!req.optimizedImages || req.optimizedImages.length === 0) {
      throw new Error('No optimized images found.');
    }

    const mainImage = req.optimizedImages[0].url; 

    const artistData = {
      name: req.body.name,
      genres: req.body.genres,
      images: req.optimizedImages.map(img => ({
        path: img.url 
      }))
    };

    const artist = await artistService.createArtist(artistData);
    logger.info(`Artist creation request handled successfully.`);

    res.status(201).json(artist);
  } catch (error) {
    logger.error(`Error in createArtist: ${error.message}.`);
    res.status(400).json({ error: error.message });
  }
}; 

const getAllArtist = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Default values: page 1, limit 10
    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const artists = await artistService.getAllArtist(parsedPage, parsedLimit);
    logger.info(`Artist list retrieval request handled successfully.`);

    res.status(200).json(artists);
  } catch (error) {
    logger.error(`Error in getAllArtists: ${error.message}.`);

    res.status(500).json({ error: error.message });
  }
};

/* const getArtistById = async (req, res) => {
  try {
    const artist = await artistService.getArtistById(req.params.id);

    if (!artist) {
      logger.warn(`Artist with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Artist not found.' });
    }

    const artistResponse = {
      name: artist.name,
      genres: artist.genres,
      imageUrl: artist.images.length > 0 ? `${artist.images[0].path}` : null, 
    };

    logger.info(`Artist with ID ${req.params.id} retrieved successfully.`);
    res.status(200).json(artistResponse);
  } catch (error) {
    logger.error(`Error in getArtistById: ${error.message}.`);
    res.status(400).json({ error: error.message });
  }
};  */
const getArtistById = async (req, res) => {
  try {
    const artist = await artistService.getArtistById(req.params.id);

    if (!artist) {
      logger.warn(`Artist with ID ${req.params.id} not found`);
      return res.status(404).json({ error: 'Artist not found.' });
    }

    // URLs de l'image
    const cloudfrontUrl = artist.images.length > 0 
      ? artist.images[0].path // Utiliser directement l'URL CloudFront
      : null;

    const filename = artist.images.length > 0 
      ? artist.images[0].path.split('/').pop() // Extraire le nom du fichier
      : null;

    const localImageUrl = filename 
      ? `http://localhost:8000/api/images/image/${encodeURIComponent(filename)}` // Construire l'URL locale
      : null;

    const artistResponse = {
      name: artist.name,
      genres: artist.genres,
      imageUrls: {
        cloudfront: cloudfrontUrl, // URL CloudFront
        local: localImageUrl, // URL locale
      },
    };

    logger.info(`Artist with ID ${req.params.id} retrieved successfully.`);
    res.status(200).json(artistResponse);
  } catch (error) {
    logger.error(`Error in getArtistById: ${error.message}.`);
    res.status(400).json({ error: error.message });
  }
};

const getArtistByName = async (req, res) => {
  try {
    const artist = await artistService.getArtistByName(req.params.name);

    if (!artist) {
      logger.warn(`Artist with name ${req.params.name} not found`);

      return res.status(404).json({ error: 'Artist not found.' });
    }
    logger.info(`Artist with name ${req.params.name} retrieved successfully.`);

    res.status(200).json(artist);
  } catch (error) {
    logger.error(`Error in getArtistByName: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const updatedArtist = async (req, res) => {
  try {
    let artistData = req.body;
    
    // If there are new optimized images uploaded, we should update the album's image field
    if (req.optimizedImages && req.optimizedImages.length > 0) {
      artistData.images = req.optimizedImages.map(img => ({ path: img.path }));
    }


    const artist = await artistService.updatedArtist(req.params.id, artistData);

    if (!artist) {
      logger.warn(`Artist with ID ${req.params.id} not found for update.`);

      return res.status(404).json({ error: 'Artist not found.' });
    }
    logger.info(`Artist with ID ${req.params.id} updated successfully.`);

    res.status(200).json(artist);
  } catch (error) {
    logger.error(`Error in updateArtist: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const deleteArtist = async (req, res) => {
  try {
    const artist = await artistService.deleteArtist(req.params.id);

    if (!artist) {
      logger.warn(`Artist with ID ${req.params.id} not found for deletion.`);

      return res.status(404).json({ error: 'Artist not found.' });
    }
    logger.info(`Artist with ID ${req.params.id} deleted successfully.`);

    res.status(200).json({ message: 'Artist deleted successfully.' });
  } catch (error) {
    logger.error(`Error in deleteArtist: ${error.message}.`);

    res.status(400).json({ error: error.message });
  }
};

const getArtistsByGenre = async (req, res) => {
  try {
    const { genre } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const artists = await artistService.getArtistsByGenre(genre, parseInt(page), parseInt(limit));

    res.status(200).json(artists);
  } catch (err) {
    logger.error(`Error in getArtistsByGenre: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

const getTop10ArtistsByListens = async (req, res) => {
  try {
    const topArtists = await artistService.getTop10ArtistsByNumberOfListens();
    logger.info("Top 10 artists retrieved successfully.");
    res.status(200).json(topArtists);
  } catch (error) {
    logger.error(`Error in getTop10ArtistsByListens: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createArtist,
  getAllArtist,
  getArtistById,
  updatedArtist,
  deleteArtist,
  getArtistsByGenre,
  getArtistByName,
  getTop10ArtistsByListens
};
