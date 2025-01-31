const searchService = require('../services/searchService');
const logger = require('../utils/logger');

const search = async (req, res) => {
  try {
    const { q: query, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await searchService.search(query, parseInt(page), parseInt(limit));
    logger.info(`Search completed for query: ${query}`);
    return res.status(200).json(results);
  } catch (error) {
    logger.error(`Search error: ${error.message}`);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}


module.exports = {
  search
};