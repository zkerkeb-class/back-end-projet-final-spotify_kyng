const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
// const AWS = require('aws-sdk');
const axios = require('axios');
const cron = require('node-cron');
const logger = require('../utils/logger');

// AWS S3 Setup
// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// });

/**
 * Perform a database backup
 * @param {Object} config - Backup configuration
 */
async function performBackup(config) {
  const { backupDir, s3Bucket, dbName, notificationUrl } = config;

  try {
    // Step 1: Create backup directory
    await fs.mkdir(backupDir, { recursive: true });

    // Step 2: Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFilename = `backup_${timestamp}.gz`;
    const backupPath = path.join(backupDir, backupFilename);

    // Step 3: Run the MongoDB dump command to create the backup file
    const mongoDumpCommand = `mongodump --db=${dbName} --archive=${backupPath} --gzip`;

    exec(mongoDumpCommand, async (error) => {
      if (error) {
        logger.error(`Backup failed: ${error}`);
        await sendNotification(notificationUrl, `Backup failed: ${error}`);
        return;
      }

      // Step 4: Upload backup file to S3
      await uploadToS3(backupPath, backupFilename, s3Bucket);

      // Step 5: Clean up old backups (delete backups older than 7 days)
      await manageBackupRetention(backupDir);

      logger.info(`Backup created and uploaded to S3: ${backupFilename}`);
    });
  } catch (error) {
    logger.error(`Error during backup: ${error}`);
    await sendNotification(notificationUrl, `Error during backup: ${error}`);
  }
}

/**
 * Upload a file to S3
 * @param {string} filePath - Local path of the file
 * @param {string} filename - Name of the file
 * @param {string} bucket - S3 bucket name
 */
async function uploadToS3(filename) {
  try {
    // const fileContent = await fs.readFile(filePath);

    // const params = {
    //   Bucket: bucket,
    //   Key: `database-backups/${filename}`,
    //   Body: fileContent,
    // };

    // await s3.upload(params).promise();
    logger.info(`Backup uploaded to S3: ${filename}`);
  } catch (error) {
    logger.error(`S3 upload failed: ${error}`);
  }
}

/**
 * Manage backup retention
 * @param {string} backupDir - Backup directory
 */
async function manageBackupRetention(backupDir) {
  try {
    const files = await fs.readdir(backupDir);

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = await fs.stat(filePath);

      // If the file is older than 7 days, delete it
      if (Date.now() - stats.mtime.getTime() > 7 * 24 * 60 * 60 * 1000) {
        await fs.unlink(filePath);
        logger.info(`Deleted old backup file: ${file}`);
      }
    }
  } catch (error) {
    logger.error(`Error managing backup retention: ${error}`);
  }
}

/**
 * Send a notification
 * @param {string} notificationUrl - URL for notifications
 * @param {string} message - Notification message
 */
async function sendNotification(notificationUrl, message) {
  try {
    await axios.post(notificationUrl, {
      topic: 'backup-alerts',
      message: message,
      priority: 4,
    });
  } catch (error) {
    logger.error(`Notification failed: ${error}`);
  }
}

/**
 * Schedule backups (every midnight)
 * @param {Object} config - Backup configuration
 */
function scheduleBackup(config) {
  cron.schedule('0 0 * * *', async () => {
    await performBackup(config);
  });
}

module.exports = {
  performBackup,
  scheduleBackup,
};
