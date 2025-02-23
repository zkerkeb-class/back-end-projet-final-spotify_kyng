const request = require('supertest');
const express = require('express');
const trackService = require('../src/services/trackService'); 
const logger = require('../src/utils/logger'); 

jest.mock('../src/services/trackService');
jest.mock('../src/utils/logger');

const app = express();
app.use(express.json());

const trackRouter = require('../src/routes/track.route'); 
app.use('/track', trackRouter);

describe('GET /track/title/:title', () => {
  it('should return 200 and the track if found', async () => {
    const mockTrack = {
      _id: '123',
      title: 'Test Track',
      artistId: '456',
      albumId: '789',
    };

    // Mockez la fonction getTrackByTitle pour retourner la piste simulée
    trackService.getTrackByTitle.mockResolvedValue(mockTrack);

    const response = await request(app).get('/track/title/Test Track');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockTrack);
    expect(logger.info).toHaveBeenCalledWith(
      'Track with title Test Track retrieved successfully.'
    );
  });

  it('should return 404 if the track is not found', async () => {
    // Mockez la fonction getTrackByTitle pour retourner null (piste non trouvée)
    trackService.getTrackByTitle.mockResolvedValue(null);

    const response = await request(app).get('/track/title/Unknown Track');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: 'Track not found.' });
    expect(logger.warn).toHaveBeenCalledWith(
      'Track with title Unknown Track not found'
    );
  });

  it('should return 400 if there is an error', async () => {
    const mockError = new Error('Database error');

    // Mockez la fonction getTrackByTitle pour lancer une erreur
    trackService.getTrackByTitle.mockRejectedValue(mockError);

    const response = await request(app).get('/track/title/Test Track');

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Database error' });
    expect(logger.error).toHaveBeenCalledWith(
      `Error in getTrackByTitle: ${mockError.message}.`
    );
  });

  it('should return 404 if the title is missing', async () => {
    // Mockez la fonction getTrackByTitle pour retourner null (simuler une piste non trouvée)
    trackService.getTrackByTitle.mockResolvedValue(null);
  
    const response = await request(app).get('/track/title/'); // Titre manquant dans l'URL
  
    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: 'Track not found.' });
    expect(logger.warn).toHaveBeenCalledWith(
      'Track with title Unknown Track not found' 
    );
  });
});