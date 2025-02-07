const { seedDatabaseFromAudioFiles } = require('../services/seedService');
const logger = require('../utils/logger');

const seedDatabase = async (req) => {
  try {
    await seedDatabaseFromAudioFiles(req.uploadedFiles);
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed', error);
    throw error;
  }
};

module.exports = { seedDatabase };
