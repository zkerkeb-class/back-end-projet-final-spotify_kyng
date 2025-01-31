const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user')(mongoose);

const loginUser = async (email, password) => {
  try {
    // console.log('JWT_SECRET:', process.env.JWT_SECRET);
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    //const isMatch = password === 'spotify_kyng';
    /*console.log('Password:', password); 
  console.log('Hashed password:', user.password); 
  console.log('Password match:', isMatch); */
    if (!isMatch) {
      throw new Error('Invalid password');
    }
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return token;
  } catch (error) {
    console.error('Error in loginUser:', error.message);
    throw error;
  }
};

// Fonction register
/*const createUser = async (userData) => {
  const { firstname, lastname, email, phone, password, role } = userData;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error('User already exists');
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    firstname,
    lastname,
    email,
    phone,
    password: hashedPassword,
    role,
    playlists: [],
    preferences: {},
  });

  await user.save();
  return user;
}; */

module.exports = {
  loginUser,
  //createUser,
};
