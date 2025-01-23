module.exports = (mongoose) => {
  const trackSchema = new mongoose.Schema(
    {
      // Primary key for the track
      title: {
        type: String,
        required: true,
        trim: true,
      },
      // Track duration (in seconds or milliseconds)
      duration: {
        type: Number,
        required: true,
        min: 0,
      },
      // Link to the audio file
      audioLink: {
        type: String,
        required: true,
      },
      // Reference to Album (foreign key)
      albumId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album',
      },
      // Explicit content flag
      isExplicit: {
        type: Boolean,
        default: false,
      },
      // Lyrics text
      lyrics: {
        type: String,
      },
      // Reference to Artist (foreign key)
      artistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
      },
      // Collaborators
      collaborators: {
        type: String,
      },
      // Artist credits (additional artists, collaborators)
      credits: {
        type: String,
      },
      // Number of listens
      numberOfListens: {
        type: Number,
        default: 0,
      },
      // Popularity score
      popularity: {
        type: Number,
        default: 0,
      },
      // Track number in the album
      trackNumber: {
        type: Number,
      },
      releaseYear: { 
        type: Number, 
        required: true 
      },
    },
    {
      timestamps: true, // Adds createdAt and updatedAt fields
    }
  );

  return mongoose.models.Track || mongoose.model('Track', trackSchema);
};
