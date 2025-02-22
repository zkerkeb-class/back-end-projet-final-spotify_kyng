const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user')(mongoose);



const loginUser = async (email, password) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid password');
    }

    // Inclus le rôle de l'utilisateur dans le payload du token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, // Ajoute le rôle ici
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return token;
  } catch (error) {
    console.error('Error in loginUser:', error.message);
    throw error;
  }
};



module.exports = {
  loginUser,
 
};
