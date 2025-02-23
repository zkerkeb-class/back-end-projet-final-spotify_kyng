const { performBackup, scheduleBackup } = require('../services/backupService');
const logger = require('../utils/logger');

// Handle initiating a manual backup
const initiateBackup = async (req, res) => {
  const config = req.body;

  try {
    await performBackup(config);
    logger.info('Manual backup initiated successfully');
    res.status(200).json({ message: 'Backup initiated successfully' });
  } catch (error) {
    logger.error('Backup initiation failed', error);
    res.status(500).json({ message: 'Backup initiation failed', error: error.message });
  }
};

// Handle starting scheduled backups
const startScheduledBackups = async (req, res) => {
  const config = req.body;
  try {
    scheduleBackup(config);
    logger.info('Scheduled backups started');
    res.status(200).json({ message: 'Scheduled backups started' });
  } catch (error) {
    logger.error('Error starting scheduled backups', error);
    res.status(500).json({ message: 'Error starting scheduled backups', error: error.message });
  }
};

module.exports = {
  initiateBackup,
  startScheduledBackups,
};
