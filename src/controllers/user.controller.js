import { UserService } from '../services/user.service.js';

export async function signup(req, res) {
    try {
        const result = await UserService.signup(req.body);
        res.status(201).json({
            message: 'Utilisateur créé',
            //...result,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur lors de l\'inscription',
            error: error.message,
        });
    }
}