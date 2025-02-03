const { faker } = require('@faker-js/faker');
const logger = require('../utils/logger');
const { extractAudioMetadata } = require('../utils/metadataExtractor');
const mongoose = require('mongoose');
const { BlobServiceClient } = require('@azure/storage-blob');
const path = require('path');
const fs = require('fs').promises;
const dotenv = require('dotenv');
dotenv.config({ path: '.env.dev' });

const Artist = require('../models/Artist')(mongoose);
const Album = require('../models/Album')(mongoose);
const Track = require('../models/Track')(mongoose);

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;

const containerName = 'spotify';

const generateGenre = () => {
  const genres = [
    'Rock',
    'Pop',
    'Jazz',
    'Classical',
    'Hip Hop',
    'Electronic',
    'R&B',
    'Folk',
    'Country',
    'Blues',
    'Soul',
    'Reggae',
    'Metal',
    'Punk',
    'Alternative',
  ];
  return faker.helpers.arrayElement(genres);
};

// Validate and get file path
const getValidFilePath = (audioFile) => {
  if (!audioFile) {
    throw new Error('Audio file is required');
  }

  if (typeof audioFile === 'string') {
    return audioFile;
  }

  if (typeof audioFile === 'object') {
    const filePath = audioFile.path || audioFile.filename;
    if (!filePath) {
      throw new Error('Invalid audio file object: missing path or filename');
    }
    return filePath;
  }

  throw new Error('Invalid audio file format');
};

// Create Azure Storage credentials
const getBlobServiceClient = () => {
  if (!accountName || !process.env.AZURE_STORAGE_SAS_TOKEN) {
    throw new Error('Azure storage credentials are not configured');
  }

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('Azure storage connection string is not configured');
  }

  return BlobServiceClient.fromConnectionString(connectionString);
};

async function uploadToAzureStorage(filePath, containerName) {
  if (!filePath) {
    throw new Error('File path is required');
  }

  logger.info(`Uploading file: ${filePath} to container: ${containerName}`);

  try {
    // Verify file exists and is readable
    await fs.access(filePath);
    const fileStats = await fs.stat(filePath);

    if (fileStats.size === 0) {
      throw new Error(`File is empty: ${filePath}`);
    }

    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists();

    const blobName = `audio-${Date.now()}-${path.basename(filePath)}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const fileBuffer = await fs.readFile(filePath);
    await blockBlobClient.upload(fileBuffer, fileBuffer.length);

    logger.info(`File uploaded successfully: ${blockBlobClient.url}`);
    return blockBlobClient.url;
  } catch (error) {
    logger.error('Azure upload error:', error);
    throw new Error(`Failed to upload file to Azure: ${error.message}`);
  }
}

const seedDatabaseFromAudioFiles = async (audioFiles) => {
  if (!audioFiles) {
    throw new Error('Audio files are required');
  }

  const filesArray = Array.isArray(audioFiles) ? audioFiles : [audioFiles];
  logger.info(`Starting database seeding for ${filesArray.length} files`);

  const processedTracks = [];
  const skippedFiles = [];

  for (const audioFile of filesArray) {
    try {
      // Get and validate file path
      const filePath = getValidFilePath(audioFile);
      const fileExt = path.extname(filePath).toLowerCase();

      // Validate file type
      if (fileExt !== '.m4a') {
        logger.warn(`Skipping non-m4a file: ${filePath}`);
        skippedFiles.push(filePath);
        continue;
      }

      // Upload to Azure Storage
      const azureFileUrl = await uploadToAzureStorage(filePath, containerName);

      // Extract metadata
      let audioMetadata = {};
      try {
        audioMetadata = await extractAudioMetadata(filePath);
      } catch (metadataError) {
        logger.warn(`Metadata extraction failed for ${filePath}: ${metadataError.message}`);
      }

      // Create or update artist
      const artistName = audioMetadata.artist || faker.person.fullName();
      const artist = await Artist.findOneAndUpdate(
        { name: artistName },
        {
          name: artistName,
          genres: generateGenre(),
          images: 'Profile',
        },
        { upsert: true, new: true }
      );

      // Create or update album
      const albumTitle = audioMetadata.album || faker.music.songName();
      const album = await Album.findOneAndUpdate(
        {
          title: albumTitle,
          artistId: artist._id,
        },
        {
          title: albumTitle,
          artistId: artist._id,
          releaseDate: audioMetadata.year || faker.date.past().getFullYear(),
          genre: generateGenre(),
          image: 'default_cover_image.jpg',
        },
        { upsert: true, new: true }
      );

      // Create track
      const track = await Track.create({
        title: audioMetadata.title || path.basename(filePath, fileExt),
        duration: audioMetadata.duration || null,
        audioLink: azureFileUrl,
        albumId: album._id,
        isExplicit: faker.datatype.boolean(),
        trackNumber: faker.number.int({ min: 1, max: 12 }),
        numberOfListens: faker.number.int({ min: 0, max: 1000000 }),
        popularity: faker.number.int({ min: 0, max: 100 }),
        artistId: artist._id,
      });

      // Update album with new track
      album.audioTracks = album.audioTracks || [];
      album.audioTracks.push(track._id);
      await album.save();

      processedTracks.push(track);
      logger.info(`Successfully processed track: ${track.title}`);

      // Clean up local file
      try {
        await fs.unlink(filePath);
        logger.info(`Deleted local file: ${filePath}`);
      } catch (unlinkError) {
        logger.warn(`Could not delete file ${filePath}: ${unlinkError.message}`);
      }
    } catch (error) {
      logger.error(`Failed to process file: ${error.message}`);
      skippedFiles.push(audioFile.path || audioFile.filename || audioFile);
    }
  }

  return { processedTracks, skippedFiles };
};

module.exports = { seedDatabaseFromAudioFiles, uploadToAzureStorage };
