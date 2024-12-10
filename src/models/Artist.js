module.exports = (mongoose) => {
  const artistSchema = new mongoose.Schema(
    {
      // Artist name
      name: {
        type: String,
        required: true,
        trim: true,
      },
      // Genres
      genres: {
        type: String,
      },
      // Image types
      images: {
        type: String,
        enum: ['Profile', 'Cover', 'Live', 'Promotional', 'Album'],
      },
    },
    {
      timestamps: true,
    }
  );

  // Check if the model already exists before compiling
  return mongoose.models.Artist || mongoose.model('Artist', artistSchema);
};
