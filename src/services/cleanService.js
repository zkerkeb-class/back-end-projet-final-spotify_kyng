const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const logger = require('../utils/logger');

const cleanTemporaryFiles = async (tempDir, maxAgeInDays = 7) => {
  try {
    const files = await fs.readdir(tempDir);

    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const stats = await fs.stat(filePath);

      // Calculate the file's age in milliseconds
      const fileAgeInMillis = Date.now() - stats.mtime.getTime();

      // Convert maxAgeInDays to milliseconds (7 days)
      const maxAgeInMillis = maxAgeInDays * 24 * 60 * 60 * 1000;

      // If file is older than maxAge, delete it
      if (fileAgeInMillis > maxAgeInMillis) {
        await fs.unlink(filePath);
        logger.info(`Deleted temporary file: ${file}`);
      }
    }
  } catch (error) {
    logger.error(`Temporary file cleanup error: ${error}`);
  }
};

const scheduleTemporaryFileCleanup = (tempDir, maxAge) => {
  // Clean temp files daily at 1 AM
  cron.schedule('0 1 * * *', async () => {
    try {
      await cleanTemporaryFiles(tempDir, maxAge);
    } catch (error) {
      logger.error(`Temporary file cleanup failed: ${error}`);
    }
  });
};

module.exports = {
  cleanTemporaryFiles,
  scheduleTemporaryFileCleanup,
};
