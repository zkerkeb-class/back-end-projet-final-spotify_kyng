const { faker } = require('@faker-js/faker');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const Artist = require('../models/Artist')(mongoose);
const Album = require('../models/Album')(mongoose);
const Track = require('../models/Track')(mongoose);

// Utility function to generate audio file
const generateAudioFile = (trackTitle) => {
  return new Promise((resolve, reject) => {
    const filename = `${Date.now()}_${trackTitle.replace(/[^a-z0-9]/gi, '_')}.mp3`;
    const filepath = path.join(__dirname, '../..', 'songs', filename);

    // Ensure the audio directory exists
    const audioDir = path.dirname(filepath);
    fs.mkdir(audioDir, { recursive: true })
      .then(() => {
        const command = `ffmpeg -f lavfi -i sine=frequency=440:duration=30 -c:a libmp3lame -b:a 128k ${filepath}`;
        exec(command, (error) => {
          if (error) {
            logger.error('Audio generation error:', error);
            reject(error);
            return;
          }
          resolve(`/songs/${filename}`);
        });
      })
      .catch(reject);
  });
};

// Function to generate a single MP3 metadata set with audio
const generateSingleMp3Metadata = async () => {
  try {
    // Create Artist
    const artist = await Artist.create({
      name: faker.person.fullName(),
      genres: faker.helpers.arrayElement([
        'Rock',
        'Pop',
        'Jazz',
        'Classical',
        'Hip Hop',
        'Electronic',
        'R&B',
      ]),
    });

    // Create Album
    const album = await Album.create({
      title: faker.music.songName(),
      artistId: artist.id,
      releaseDate: faker.date.past({ years: 30 }),
      genre: artist.genres,
    });

    // Generate audio file
    const audioLink = await generateAudioFile(`${artist.name} - ${album.title}`);

    // Create Track with actual audio link
    const track = await Track.create({
      title: faker.music.songName(),
      artistId: artist.id,
      albumId: album.id,
      duration: faker.number.int({ min: 120, max: 300 }),
      audioLink: audioLink,
      isExplicit: faker.datatype.boolean({ probability: 0.2 }),
      trackNumber: faker.number.int({ min: 1, max: 12 }),
      numberOfListens: faker.number.int({ min: 0, max: 1000000 }),
      popularity: faker.number.int({ min: 0, max: 100 }),
    });

    return { artist, album, track };
  } catch (error) {
    logger.error('Error generating MP3 metadata:', error);
    throw error;
  }
};

const generateMp3MetadataController = async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 5;
    const generatedEntries = await generateMultipleMp3Metadatas(count);

    res.json({
      message: `Generated ${generatedEntries.length} MP3 metadata entries`,
      entries: generatedEntries.map((entry) => ({
        title: entry.track.title,
        artist: entry.artist.name,
        album: entry.album.title,
        audioLink: entry.track.audioLink,
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to generate MP3 metadata',
      details: error.message,
    });
  }
};

const bulkGenerateMp3MetadataController = async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 20;
    const generatedEntries = await generateMultipleMp3Metadatas(count);

    res.json({
      message: `Bulk generated ${generatedEntries.length} MP3 metadata entries`,
      totalTracks: generatedEntries.length,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to bulk generate MP3 metadata',
      details: error.message,
    });
  }
};

// Existing multiple metadata generation function
const generateMultipleMp3Metadatas = async (count) => {
  const generated = [];

  for (let i = 0; i < count; i++) {
    try {
      const entry = await generateSingleMp3Metadata();
      generated.push(entry);
    } catch (error) {
      logger.error(`Error generating MP3 metadata #${i + 1}:`, error);
    }
  }

  return generated;
};

module.exports = {
  generateMp3MetadataController,
  bulkGenerateMp3MetadataController,
};
