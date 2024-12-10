'use strict';

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const process = require('process');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];

const db = {};

// Extract the MongoDB URI from the config
const mongoURI = config.uri;

// Initialize MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB connected successfully to ${mongoURI}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

// Dynamically import models
const modelFiles = fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  });

// Load models
modelFiles.forEach(file => {
  const modelPath = path.join(__dirname, file);
  const model = require(modelPath)(mongoose); // Adapt for Mongoose
  db[model.modelName] = model; // Add to db object
});

// Add mongoose instance to db object for direct access
db.mongoose = mongoose;

// Connect to MongoDB
connectDB();

module.exports = db;
