const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');
const { DateTime } = require('luxon');
const axios = require('axios');
const { BlobServiceClient } = require('@azure/storage-blob');
const tar = require('tar');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Sauvegarde la base de données MongoDB
 * @returns {Promise<string>} - Chemin du dossier de sauvegarde temporaire
 */
const backupDatabase = async () => {
  const date = DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss');
  const backupName = `backup_${date}`;
  const backupPath = path.join(os.tmpdir(), uuidv4(), backupName); // Use a temporary directory

  // Create the backup folder
  fs.mkdirSync(backupPath, { recursive: true });

  const client = new MongoClient(process.env.MONGO_URI, { useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db(); // Get the default database
    const collections = await db.listCollections().toArray();

    // Export each collection to a JSON file
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();

      const filePath = path.join(backupPath, `${collectionName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));

      logger.info(`Exported collection ${collectionName} to ${filePath}`);
    }

    logger.info('Sauvegarde réussie');
    return backupPath;
  } catch (err) {
    logger.error('Erreur lors de la sauvegarde:', err);
    throw err;
  } finally {
    await client.close();
  }
};

/**
 * Compresse le dossier de sauvegarde
 * @param {string} backupPath - Chemin du dossier de sauvegarde
 * @returns {Promise<string>} - Chemin du fichier compressé temporaire
 */
const compressBackup = async (backupPath) => {
  const backupName = path.basename(backupPath);
  const tarPath = path.join(os.tmpdir(), `${backupName}.tar.gz`);

  await tar.c(
    {
      gzip: true,
      file: tarPath,
      cwd: path.dirname(backupPath),
    },
    [backupName]
  );

  return tarPath;
};

/**
 * Envoie une notification à un topic ntfy.sh
 * @param {string} topic - Le topic ntfy (ex: "mon_topic")
 * @param {string} message - Le message à envoyer
 */
const sendNotification = async (topic, message) => {
  try {
    await axios.post(topic, message, {
      headers: {
        Title: 'Sauvegarde MongoDB', // Titre de la notification
        Priority: 'default', // Priorité (default, high, urgent, etc.)
      },
    });
    logger.info('Notification envoyée avec succès à ntfy.sh');
  } catch (error) {
    logger.error("Erreur lors de l'envoi de la notification à ntfy.sh:", error);
  }
};

/**
 * Upload le fichier compressé vers Azure Blob Storage
 * @param {string} tarPath - Chemin du fichier compressé
 */
const uploadToAzure = async (tarPath) => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_CONTAINER_NAME_BACKUP
    );
    const blobName = path.basename(tarPath);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadFile(tarPath);
    logger.info(`Sauvegarde uploadée sur Azure Blob Storage: ${blobName}`);

    // Delete the local tar file after upload
    fs.unlinkSync(tarPath);
    logger.info(`Fichier local supprimé: ${tarPath}`);
  } catch (error) {
    logger.error("Erreur lors de l'upload sur Azure:", error);
    throw error;
  }
};

/**
 * Nettoie les sauvegardes sur Azure Blob Storage en fonction de la politique de rotation
 */
const cleanupOldBackupsOnAzure = async () => {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_CONTAINER_NAME_BACKUP
    );

    // Lister tous les blobs dans le conteneur
    const blobs = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      const blobClient = containerClient.getBlobClient(blob.name);
      const properties = await blobClient.getProperties();
      blobs.push({
        name: blob.name,
        createdOn: properties.createdOn,
      });
    }

    // Trier les blobs par date de création (du plus récent au plus ancien)
    blobs.sort((a, b) => b.createdOn - a.createdOn);

    // Filtrer les sauvegardes à conserver
    const now = new Date();
    const dailyBackups = [];
    const weeklyBackups = [];

    for (const blob of blobs) {
      const blobCreationTime = blob.createdOn;
      const ageInDays = (now - blobCreationTime) / (1000 * 60 * 60 * 24); // Âge en jours

      if (ageInDays <= 7) {
        // Conserver les sauvegardes des 7 derniers jours
        dailyBackups.push(blob);
      } else if (ageInDays <= 30) {
        // Conserver une sauvegarde par semaine pour le mois précédent
        const weekStart = new Date(blobCreationTime);
        weekStart.setHours(0, 0, 0, 0);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Début de la semaine (dimanche)

        // Vérifier si une sauvegarde de cette semaine a déjà été conservée
        const existingWeeklyBackup = weeklyBackups.find(
          (b) => b.weekStart.getTime() === weekStart.getTime()
        );

        if (!existingWeeklyBackup) {
          weeklyBackups.push({
            weekStart,
            blob,
          });
        }
      }
    }

    // Supprimer les sauvegardes qui ne correspondent pas à la politique de rotation
    for (const blob of blobs) {
      const isDailyBackup = dailyBackups.some((b) => b.name === blob.name);
      const isWeeklyBackup = weeklyBackups.some((b) => b.blob.name === blob.name);

      if (!isDailyBackup && !isWeeklyBackup) {
        const blobClient = containerClient.getBlobClient(blob.name);
        await blobClient.delete();
        logger.info(`Sauvegarde supprimée sur Azure: ${blob.name}`);
      }
    }

    logger.info('Nettoyage des sauvegardes sur Azure terminé avec succès.');
  } catch (error) {
    logger.error('Erreur lors du nettoyage des sauvegardes sur Azure:', error);
    throw error;
  }
};

/**
 * Exécute le processus complet de sauvegarde
 * @param {object} config - Configuration de la sauvegarde
 */
const runBackup = async (config) => {
  const { notificationUrl } = config;

  try {
    // Étape 1 : Sauvegarder la base de données
    const backupPath = await backupDatabase();

    // Étape 2 : Compresser la sauvegarde
    const tarPath = await compressBackup(backupPath);

    // Étape 3 : Uploader sur Azure Blob Storage
    await uploadToAzure(tarPath);

    // Étape 4 : Supprimer le dossier de sauvegarde temporaire
    fs.rmdirSync(path.dirname(backupPath), { recursive: true });

    // Étape 5 : Appliquer la politique de rotation des sauvegardes
    await cleanupOldBackupsOnAzure();

    // Étape 6 : Envoyer une notification de succès via ntfy.sh
    if (notificationUrl) {
      await sendNotification(notificationUrl, 'Sauvegarde réussie ✅');
    }
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde:', error);

    // Étape 7 : Envoyer une notification d'échec via ntfy.sh
    if (notificationUrl) {
      await sendNotification(notificationUrl, `Échec de la sauvegarde ❌: ${error.message}`);
    }
  }
};

module.exports = { runBackup, cleanupOldBackupsOnAzure };
