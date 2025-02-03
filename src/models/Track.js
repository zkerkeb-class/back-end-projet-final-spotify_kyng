module.exports = (mongoose) => {
  const trackSchema = new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },
      duration: {
        type: Number,
        required: true,
        min: 0,
      },
      audioLink: {
        type: String,
        required: true,
      },
      albumId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album',
      },
      isExplicit: {
        type: Boolean,
        default: false,
      },
      lyrics: {
        type: String,
      },
      artistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artist',
      },
      collaborators: {
        type: [String],
        default: [],
      },
      credits: {
        type: {
          producer: String,
          songwriter: String,
        },
        default: {},
      },
      lastPlayed: {
        type: Date,
        default: null,
      },
      numberOfListens: {
        type: Number,
        default: 0,
      },
      popularity: {
        type: Number,
        default: 0,
      },
      trackNumber: {
        type: Number,
      },
      releaseYear: {
        type: Number,
        default: new Date().getFullYear(),
      },
    },
    {
      timestamps: true,
    }
  );

  return mongoose.models.Track || mongoose.model('Track', trackSchema);
};
