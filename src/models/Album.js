module.exports = (mongoose) => {
  const albumSchema = new mongoose.Schema(
    {
      // Album name/title
      title: {
        type: String,
        required: true,
        trim: true,
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
        required: true,
      },
      // Release date
      releaseDate: {
        type: Date,
      },
      // Album cover image
      images: {
        type: [
          {
            path: { type: String },
          },
        ],
        default: [],
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
      genres: {
        type: String,
        enum: [
          'Classical',
          'Opera',
          'Jazz',
          'Blues',
          'Country',
          'Rock',
          'Hard Rock',
          'Soft Rock',
          'Alternative',
          'Indie',
          'Grunge',
          'Metal',
          'Heavy Metal',
          'Pop',
          'Synthpop',
          'K-Pop',
          'J-Pop',
          'C-Pop',
          'Hip Hop',
          'Rap',
          'Trap',
          'Lo-fi',
          'R&B',
          'Soul',
          'Funk',
          'Reggae',
          'Dancehall',
          'Electronic',
          'EDM',
          'House',
          'Techno',
          'Trance',
          'Dubstep',
          'Ambient',
          'World',
          'Afrobeat',
          'Latin',
          'Salsa',
          'Merengue',
          'Reggaeton',
          'Bachata',
          'Flamenco',
          'Bollywood',
          'Traditional',
          'Gospel',
          'Spiritual',
          'Choral',
          'New Age',
          'Raï',
          'Chaâbi',
          'Tarab',
          'Mawal',
          'Andalous',
          'Gnawa',
          'Khaliji',
          'Shaabi',
          'Dabke',
          'Zaffa',
          'Taqsim',
          'Arabesque',
          'Maghreb Fusion',
          'Mizmar',
          'Mijwiz',
          'Nubian',
          'Bedouin',
          'Sufi',
          'Mouwachah',
          'Samai',
          'Qasida',
          'Malhoun',
          'Zajal',
          'Baladi',
        ],
      },
    },
    {
      timestamps: true,
    }
  );

  return mongoose.models.Album || mongoose.model('Album', albumSchema);
};
