import { Router } from 'express';
import authController from '../controllers/authcontroller.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);


export default router;

