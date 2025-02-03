module.exports = (mongoose) => {
  const playlistSchema = new mongoose.Schema(
    {
      pistes_audio: {
        type: String,
        required: true,
      },
      thumbnail: {
        type: String,
      },
      duration: {
        type: Number,
        required: true,
        min: 0,
      },
      description: {
        type: String,
      },
      titre: {
        type: Number,
      },
    },
    {
      timestamps: true,
    }
  );

  return mongoose.models.Playlist || mongoose.model('Playlist', playlistSchema);
};
