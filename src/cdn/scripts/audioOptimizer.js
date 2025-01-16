const ffmpeg = require('fluent-ffmpeg');
const path = require('path'); // Ensure path module is imported
const fs = require('fs'); // Ensure fs module is imported

async function optimizeAudio(inputPath, outputDir) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
  }

  const filename = path.basename(inputPath, path.extname(inputPath)); // Get file name without extension
  let outputPath = path.join(outputDir, `${filename}.m4a`); // Full path for output file

  // Ensure the outputPath differs from the inputPath
  let counter = 1;
  while (outputPath === inputPath || fs.existsSync(outputPath)) {
    outputPath = path.join(outputDir, `${filename}-${counter}.m4a`);
    counter++;
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('aac') // Set the audio codec to AAC
      .audioBitrate('160k') // Set audio bitrate
      .audioFrequency(44100) // Set audio frequency
      .audioChannels(2) // Set audio channels to stereo (2)
      .addOption('-map_metadata', '0') // Retain metadata from the input file
      .on('end', () => {
        console.log(`Optimization complete: ${outputPath}`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error(`Error optimizing audio file: ${err.message}`);
        reject(err);
      })
      .save(outputPath); // Save the optimized file
  });
}

module.exports = {
  optimizeAudio,
};
