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
      // Image types
      images: [
        {
          path: {
            type: String,
            required: true,
          },
          type: {
            type: String,
            enum: ['Profile', 'Cover', 'Live', 'Promotional', 'Album'],
            required: true,
          },
        },
      ],
    },
    {
      timestamps: true,
    }
  );

  // Check if the model already exists before compiling
  return mongoose.models.Artist || mongoose.model('Artist', artistSchema);
};
