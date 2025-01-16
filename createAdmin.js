const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./src/models/user');
const config = require('./src/config/config')[process.env.NODE_ENV || 'development'];

const envFilePath = path.resolve(__dirname, '.env');
console.log('Using .env file located at:', envFilePath);

const createAdmin = async () => {
  try {
    console.log('MongoDB URI:', config.uri);
    if (!config.uri) {
      throw new Error('MONGO_URI is undefined in config.');
    }
    await mongoose.connect(config.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    const existingAdmin = await User.findOne({ email: 'spotify_kyng@admin.com' });
    if (existingAdmin) {
      console.log('Admin already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash('spotify_kyng', 10);
    console.log('Hashed password:', hashedPassword);

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
    console.log('Admin user created successfully.');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    mongoose.connection.close();
  }
};

const main = async () => {
  await createAdmin();
};

main();
