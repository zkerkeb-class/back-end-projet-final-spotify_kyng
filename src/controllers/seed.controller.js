const { seedDatabaseFromAudioFiles } = require('../services/seedService');
const logger = require('../utils/logger');

const seedDatabase = async (audioDirectory) => {
  try {
    console.log('test : ', audioDirectory)
    await seedDatabaseFromAudioFiles(audioDirectory);
    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed', error);
    throw error;
  }
};

module.exports = { seedDatabase };