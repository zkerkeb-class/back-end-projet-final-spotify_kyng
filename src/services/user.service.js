import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user';
import dotenv from 'dotenv';
dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
    throw new Error("SECRET_KEY is not defined.");
}

export class UserService {
    static async signup(data) {
        const {
          firstname,
          lastname,
          email,
          phone,
          role,
          password,
          playlists,
          last_connexion,
          preferences 
        } = data;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('Utilisateur déjà existant');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
          firstname,
          lastname,
          email,
          phone,
          role,
          password,
          playlists,
          last_connexion,
          preferences 
        });

        const token = jwt.sign(
            {
                id: newUser._id,
                email: newUser.email,
            },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        await newUser.save();
        return { token, userId: newUser._id };
    }
}