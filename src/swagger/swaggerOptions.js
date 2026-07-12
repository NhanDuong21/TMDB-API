const swaggerJsdoc = require('swagger-jsdoc');
const config = require('../config/config');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TMDB Integration API',
      version: '1.0.0',
      description: 'API to fetch and normalize data from The Movie Database (TMDB) for the Movie Booking System.',
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/swagger/docs/*.yaml'], // paths to files containing swagger annotations
};

// We will inject the inline swagger docs here for simplicity instead of relying purely on comments
const swaggerDocs = {
  ...swaggerJsdoc(options),
  paths: {
    '/health': {
      get: {
        summary: 'Check API Health',
        description: 'Returns the health status of the API, TMDB connection, and cache.',
        responses: {
          200: {
            description: 'Success',
            content: {
              'application/json': {
                example: {
                  status: 'UP',
                  tmdb: 'CONNECTED',
                  cache: 'OK'
                }
              }
            }
          }
        }
      }
    },
    '/api/import/search': {
      get: {
        summary: 'Search Movies',
        parameters: [
          { in: 'query', name: 'keyword', required: true, schema: { type: 'string' } },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } }
        ],
        responses: {
          200: { description: 'Success' },
          400: { description: 'Bad Request' }
        }
      }
    },
    '/api/import/preview/{tmdbId}': {
      get: {
        summary: 'Preview Movie details',
        description: 'Fetches comprehensive movie details concurrently and normalizes the data.',
        parameters: [
          { in: 'path', name: 'tmdbId', required: true, schema: { type: 'integer' } }
        ],
        responses: { 200: { description: 'Success' } }
      }
    }
  }
};

module.exports = swaggerDocs;
