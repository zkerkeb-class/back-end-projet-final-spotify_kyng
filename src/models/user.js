import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true},
  password: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'User','Artiste'], required: true },
  playlists: {type: Text, required: true },
  last_connexion :{type: Date, required: true},
  preferences: {type: String, required: false},
});

const User = mongoose.model('User',userSchema);
export default User;