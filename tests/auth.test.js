const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authService = require('../src/services/authService'); 
const sessionCacheService = require('../src/services/sessionCacheService'); 
const logger = require('../src/utils/logger'); 


jest.mock('../src/services/authService');
jest.mock('../src/services/sessionCacheService');
jest.mock('../src/utils/logger');
jest.mock('jsonwebtoken'); // Mockez jwt pour contrôler la vérification du token

const app = express();
app.use(express.json());

const authRouter = require('../src/routes/auth.route'); 
app.use('/auth', authRouter);

describe('POST /auth/login', () => {
  it('should return 200 and a token if login is successful', async () => {
    const mockToken = 'mockToken123';
    const mockDecoded = { id: '123', email: 'test@example.com', role: 'user' };

    // Mockez les dépendances
    authService.loginUser.mockResolvedValue(mockToken);
    jwt.verify.mockReturnValue(mockDecoded); // Simule la vérification du token
    sessionCacheService.setSession.mockResolvedValue(true); // Simule l'enregistrement de la session

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ token: mockToken });
    expect(logger.info).toHaveBeenCalledWith(
      'Calling setSession with token:',
      mockToken,
      'and data:',
      mockDecoded
    );
    expect(sessionCacheService.setSession).toHaveBeenCalledWith(mockToken, mockDecoded);
  });

  it('should return 400 if login fails due to invalid credentials', async () => {
    const mockError = new Error('Invalid password');

    // Mockez la fonction loginUser pour lancer une erreur
    authService.loginUser.mockRejectedValue(mockError);

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid password' });
    expect(logger.error).toHaveBeenCalledWith('Erreur lors du login:', mockError.message);
  });

  it('should return 400 if JWT verification fails', async () => {
    const mockToken = 'invalidToken';
    const mockError = new Error('Invalid token');

    // Mockez les dépendances
    authService.loginUser.mockResolvedValue(mockToken);
    jwt.verify.mockImplementation(() => {
      throw mockError; // Simule une erreur de vérification JWT
    });

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ message: 'Invalid token' });
    expect(logger.error).toHaveBeenCalledWith('Erreur lors du login:', mockError.message);
  });
});