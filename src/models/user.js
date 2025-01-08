module.exports = (mongoose) => {
  const userSchema = new mongoose.Schema(
    {
      firstname: {
        type: String,
        required: true,
        trim: true,
      },
      lastname: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
      },
      phone: {
        type: String,
        required: true,
        match: /^[0-9]{10,15}$/,
      },
      role: {
        type: String,
        enum: ['user', 'artist', 'admin'], 
        default: 'user',
      },
      password: {
        type: String,
        required: true,
      },
      playlists: {
        type: [String],
        default: [],
      },
      last_connexion: {
        type: Number,
        default: Date.now,
      },
      preferences: {
        type: Object,
        default: {},
      },
    },
    {
      timestamps: true, 
    }
  );
  return mongoose.models.User || mongoose.model('User', userSchema);
};
