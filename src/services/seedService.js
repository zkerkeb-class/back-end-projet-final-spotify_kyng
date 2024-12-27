const { faker } = require('@faker-js/faker');
const logger = require('../utils/logger');
const { extractAudioMetadata } = require('../utils/metadataExtractor');
const { optimizeAudio } = require('../cdn/scripts/audioOptimizer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

const Artist = require('../models/Artist')(mongoose);
const Album = require('../models/Album')(mongoose);
const Track = require('../models/Track')(mongoose);

const generateGenre = () => {
  const genres = [
    'Rock', 'Pop', 'Jazz', 'Classical', 'Hip Hop', 
    'Electronic', 'R&B', 'Folk', 'Country', 'Blues', 
    'Soul', 'Reggae', 'Metal', 'Punk', 'Alternative'
  ];
  return faker.helpers.arrayElement(genres);
};

const seedDatabaseFromAudioFiles = async (audioFiles, outputDir) => {
  logger.info(`Starting database seeding for ${audioFiles.length} files`);
  const processedTracks = [];
  let totalTracks = 0;
  // let processedTracks = 0;
  for (const audioFile of audioFiles) {
    try {
      // Determine if optimization is needed
      const fileExt = path.extname(audioFile.originalname).toLowerCase();
      const supportedExtensions = ['.mp3', '.m4a', '.wav', '.flac'];

      if (!supportedExtensions.includes(fileExt)) {
        logger.warn(`Skipping unsupported file type: ${audioFile.originalname}`);
        continue;
      }

      console.log('IN');

      // Optimize and convert audio file if needed
      const optimizedFilePath = await optimizeAudio(audioFile.path, outputDir);

      // Extract metadata from the optimized file
      const audioMetadata = await extractAudioMetadata(optimizedFilePath);

      // Find or Create Artist with genre generation
      const artist = await Artist.findOneAndUpdate(
        { name: audioMetadata.artist || faker.person.fullName() },
        {
          name: audioMetadata.artist || faker.person.fullName(),
          genres: audioMetadata.genre ? [audioMetadata.genre] : [generateGenre()]
        },
        { upsert: true, new: true }
      );

      // Find or Create Album
      const album = await Album.findOneAndUpdate(
        { 
          title: audioMetadata.album || faker.music.songName(),
          artist: artist._id 
        },
        {
          title: audioMetadata.album || faker.music.songName(),
          artist: artist._id,
          releaseDate: faker.date.past({ years: 30 }),
          genre: artist.genres[0]
        },
        { upsert: true, new: true }
      );

      // Create Track
      const track = await Track.create({
        title: audioMetadata.title || faker.music.songName(),
        artist: artist._id,
        album: album._id,
        duration: audioMetadata.duration,
        isExplicit: faker.datatype.boolean({ probability: 0.2 }),
        trackNumber: faker.number.int({ min: 1, max: 12 }),
        numberOfListens: faker.number.int({ min: 0, max: 1000000 }),
        popularity: faker.number.int({ min: 0, max: 100 })
      });

      processedTracks.push(track);
      logger.info(`Processed track: ${track.title}`);

      // Optional: Clean up original and temporary files
      await Promise.all([
        fs.unlink(audioFile.path),
        audioFile.path !== optimizedFilePath ? fs.unlink(optimizedFilePath) : Promise.resolve()
      ]);
    } catch (error) {
      logger.error(`Error processing audio file: ${error.message}`);
    }
  }

  return {
    totalTracks: processedTracks.length,
    processedTracks
  };
};

module.exports = { seedDatabaseFromAudioFiles };