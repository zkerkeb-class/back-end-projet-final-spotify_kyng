const express = require('express');
const authController = require('../controllers/auth.controller');
const router = express.Router();

router.post('/login', authController.loginController);
router.post('/logout', authController.logoutController);
//router.post('/register', authController.registerController);

module.exports = router;
