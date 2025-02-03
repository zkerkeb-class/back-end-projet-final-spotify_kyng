const ffmpeg = require('fluent-ffmpeg');
const path = require('path'); 
const fs = require('fs'); 

async function optimizeAudio(inputPath, outputDir) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`Created directory: ${outputDir}`);
  }

  const filename = path.basename(inputPath, path.extname(inputPath)); 
  let outputPath = path.join(outputDir, `${filename}.m4a`); 

  // Ensure the outputPath differs from the inputPath
  let counter = 1;
  while (outputPath === inputPath || fs.existsSync(outputPath)) {
    outputPath = path.join(outputDir, `${filename}-${counter}.m4a`);
    counter++;
  }

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec('aac') 
      .audioBitrate('160k') 
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
      .save(outputPath); 
  });
}

module.exports = {
  optimizeAudio,
};
