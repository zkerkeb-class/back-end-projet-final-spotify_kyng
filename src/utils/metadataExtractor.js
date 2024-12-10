const { exec } = require('child_process');
const path = require('path');
const logger = require('./logger');

const extractAudioMetadata = async (filePath) => {
  return new Promise((resolve, reject) => {
    const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        logger.error(`Metadata extraction error: ${error}`);
        return reject(error);
      }
      
      try {
        const metadata = JSON.parse(stdout);
        resolve({
          duration: Math.round(parseFloat(metadata.format.duration)),
          title: metadata.format.tags?.title || path.basename(filePath, '.mp3'),
          artist: metadata.format.tags?.artist,
          album: metadata.format.tags?.album
        });
      } catch (parseError) {
        logger.error(`Metadata parse error: ${parseError}`);
        reject(parseError);
      }
    });
  });
};

module.exports = { extractAudioMetadata };