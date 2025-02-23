const request = require('supertest');
const express = require('express');
const trackService = require('../src/services/trackService'); 
const logger = require('../src/utils/logger'); 

jest.mock('../src/services/trackService');
jest.mock('../src/utils/logger');

const app = express();
app.use(express.json());

const trackRouter = require('../src/routes/track.route'); 
app.use('/', trackRouter);

describe('GET /', () => {
  it('should return 200 and the list of tracks', async () => {
    const mockTracks = {
      tracks: [{ id: 1, name: 'Track 1' }],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 }
    };

    // Mockez la fonction getAllTracks pour retourner les données simulées
    trackService.getAllTracks.mockResolvedValue(mockTracks);

    const response = await request(app).get('/');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(mockTracks);
    expect(logger.info).toHaveBeenCalledWith('Track list retrieval request handled successfully.');
  });

  it('should return 500 if there is an error', async () => {
    const mockError = new Error('Database error');

    // Mockez la fonction getAllTracks pour lancer une erreur
    trackService.getAllTracks.mockRejectedValue(mockError);

    const response = await request(app).get('/');

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: 'Database error' });
    expect(logger.error).toHaveBeenCalledWith(`Error in getAllTrack: ${mockError.message}.`);
  });
});