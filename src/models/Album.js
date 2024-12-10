module.exports = (mongoose) => {
  const albumSchema = new mongoose.Schema(
    {
      // Album name/title
      title: {
        type: String,
        required: true,
        trim: true,
      },
      // Album key
      albumKey: {
        type: String,
      },
      // Link to album
      linkTitle: {
        type: String,
      },
      // Link type
      linkType: {
        type: String,
      },
      // Reference to Artist (foreign key)
      artistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
      },
      // Release date
      releaseDate: {
        type: Date,
      },
      // Album cover image
      image: {
        type: String,
      },
      // Audio tracks list (this can be an array of track references)
      audioTracks: {
        type: [String],
      },
      // Total album duration
      duration: {
        type: Number,
        min: 0,
      },
      // Genre
      genre: {
        type: String,
      },
    },
    {
      timestamps: true,
    }
  );

  return mongoose.models.Album || mongoose.model('Album', albumSchema);
};
