const { faker } = require('@faker-js/faker');
const logger = require('../utils/logger');
const { extractAudioMetadata } = require('../utils/metadataExtractor');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

const Artist = require('../models/Artist')(mongoose);
const Album = require('../models/Album')(mongoose);
const Track = require('../models/Track')(mongoose);

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

const seedDatabaseFromAudioFiles = async (audioFiles, outputDir) => {
  // Ensure audioFiles is always an array
  const filesArray = Array.isArray(audioFiles) ? audioFiles : [audioFiles];

  logger.info(`Starting database seeding for ${filesArray.length} files`);
  const processedTracks = [];
  const skippedFiles = [];

  for (const audioFile of filesArray) {
    try {
      // Determine the file path
      const filePath =
        typeof audioFile === 'string' ? audioFile : audioFile.path || audioFile.filename;

      const fileExt = path.extname(filePath).toLowerCase();

      // Validate file type
      if (!['.m4a', '.mp3', '.wav', '.flac'].includes(fileExt)) {
        logger.warn(`Skipping unsupported file type: ${filePath}`);
        skippedFiles.push(filePath);
        continue;
      }

      // Extract metadata from the audio file
      let audioMetadata;
      try {
        audioMetadata = await extractAudioMetadata(filePath);
      } catch (metadataError) {
        logger.warn(`Metadata extraction failed for ${filePath}: ${metadataError.message}`);
        audioMetadata = {};
      }
      console.log('test metadata : ', audioMetadata);

      // Generate or retrieve artist
      const artist = await Artist.findOneAndUpdate(
        { name: audioMetadata.artist || faker.person.fullName() },
        {
          name: audioMetadata.artist || faker.person.fullName(),
          genres: generateGenre(),
          images: 'Profile',
        },
        { upsert: true, new: true }
      );

      // Find or create the album
      const album = await Album.findOneAndUpdate(
        {
          title: audioMetadata.album || faker.music.songName(),
          artistId: artist._id, // Use artistId instead of artist
        },
        {
          title: audioMetadata.album || faker.music.songName(),
          artistId: artist.artistId, // Use artistId instead of artist
          releaseDate: audioMetadata.year || faker.date.past().getFullYear(),
          genre: generateGenre(), // Add genre if you'd like
          image: 'default_cover_image.jpg', // Example: you can set a default image
        },
        { upsert: true, new: true }
      );

      // Create track entry
      const track = await Track.create({
        title: audioMetadata.title || path.basename(filePath, fileExt),
        duration: audioMetadata.duration || null,
        audioLink: filePath, // Link to the audio file
        albumId: album._id,  // Linking the track to the album
        isExplicit: faker.datatype.boolean(),
        trackNumber: faker.number.int({ min: 1, max: 12 }),
        numberOfListens: faker.number.int({ min: 0, max: 1000000 }),
        popularity: faker.number.int({ min: 0, max: 100 }),
        artistId: artist.artistId,  // Linking the track to the artist
      });

      // Push track ID into album's audioTracks array
      album.audioTracks.push(track._id);
      await album.save();

      processedTracks.push(track);
      logger.info(`Processed track: ${track.title}`);

      // Optional cleanup of the original files
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        logger.warn(`Could not delete file ${filePath}: ${unlinkError.message}`);
      }
    } catch (error) {
      logger.error(`Error processing audio file: ${error.message}`);
      skippedFiles.push(typeof audioFile === 'string' ? audioFile : audioFile.path);
    }
  }

  return {
    totalTracks: processedTracks.length,
    processedTracks,
    skippedFiles,
  };
};

module.exports = { seedDatabaseFromAudioFiles };
