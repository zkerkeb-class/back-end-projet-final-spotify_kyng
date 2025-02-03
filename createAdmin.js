require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/user');
const config = require('./src/config/config')[process.env.NODE_ENV || 'development'];
const logger = require('./src/utils/logger');

const createAdmin = async () => {
  try {
    if (!config.uri) {
      throw new Error('MONGO_URI is undefined in config.');
    }
    await mongoose.connect(config.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const existingAdmin = await User.findOne({ email: 'spotify_kyng@admin.com' });
    if (existingAdmin) {
      logger.info('Admin already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash('spotify_kyng', 10);

    const admin = new User({
      firstname: 'Admin',
      lastname: 'Spotify',
      email: 'spotify_kyng@admin.com',
      phone: '0660606060',
      role: 'admin',
      password: hashedPassword,
      playlists: [],
      preferences: {},
    });

    await admin.save();
    logger.info('Admin user created successfully.');
  } catch (error) {
    logger.error('Error creating admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

const main = async () => {
  await createAdmin();
};

main();
