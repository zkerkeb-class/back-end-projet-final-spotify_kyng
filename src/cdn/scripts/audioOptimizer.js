const ffmpeg = require('fluent-ffmpeg');
const path = require('path'); // Ensure path module is imported
const fs = require('fs'); // Ensure path module is imported

async function optimizeAudio(inputPath, outputDir, quality = 'medium') {
  const qualityConfig = {
    medium: { bitrate: '160k', suffix: 'medium' },
    high: { bitrate: '320k', suffix: 'high' },
    low: { bitrate: '96k', suffix: 'low' }
  };

  const config = qualityConfig[quality];
  if (!config) throw new Error(`Invalid quality setting: ${quality}`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
  }

  // Ensure paths are correctly used
  const filename = path.basename(inputPath, path.extname(inputPath));  // Get file name without extension
  const outputPath = path.join(outputDir, `${filename}_${config.suffix}.m4a`); // Full path for output file

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('aac')
      .audioBitrate(config.bitrate)
      .audioFrequency(44100)
      .audioChannels(2)
      .addOption('-map_metadata', '0')
      .on('end', () => {
        console.log(`Optimization complete: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`Error optimizing audio file: ${err.message}`);
        reject(err);
      })
      .save(outputPath); // Saving the optimized file
  });
}

module.exports = {
  optimizeAudio
};
