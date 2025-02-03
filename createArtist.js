require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const logger = require('./src/utils/logger');
const User = require('./src/models/user')(mongoose);
const config = require('./src/config/config')[process.env.NODE_ENV || 'development'];

const createArtist = async () => {
  try {
    if (!config.uri) {
      throw new Error('MONGO_URI is undefined in config.');
    }

    // Connexion à MongoDB
    await mongoose.connect(config.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Vérifie si l'artiste existe déjà
    const existingArtist = await User.findOne({ email: 'spotifykyng@artist.com' });
    if (existingArtist) {
      logger.info('Artist already exists.');
      return;
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash('artist_password', 10);

    // Création de l'utilisateur artiste
    const artist = new User({
      firstname: 'Artist',
      lastname: 'Spotify',
      email: 'spotifykyng@artist.com',
      phone: '0660606061',
      role: 'artist',
      password: hashedPassword,
      playlists: [],
      preferences: {},
    });

    // Sauvegarde de l'utilisateur dans la base de données
    await artist.save();
    logger.info('Artist user created successfully.');
  } catch (error) {
    logger.error('Error creating artist:', error);
  } finally {
    // Fermeture de la connexion MongoDB
    mongoose.connection.close();
  }
};

const main = async () => {
  await createArtist();
};

main();
