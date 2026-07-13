const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { validate, schemas } = require('../middlewares/requestValidator');
const verifyApiKey = require('../middlewares/authMiddleware');

// Health Check
router.get('/health', movieController.getHealthStatus);

// =======================
// PUBLIC ENDPOINTS
// =======================
// Search movies
router.get('/api/search', validate(schemas.searchSchema), movieController.search);

// Search keywords (for autocomplete/suggestions)
router.get('/api/search/keyword', validate(schemas.searchSchema), movieController.searchKeywords);

// Get movie preview (aggregates multiple TMDB endpoints)
router.get('/api/preview/:id', validate(schemas.idSchema, 'params'), movieController.preview);

// Standalone endpoints for movie details
router.get('/api/movie/:id/credits', validate(schemas.idSchema, 'params'), movieController.credits);
router.get('/api/movie/:id/videos', validate(schemas.idSchema, 'params'), movieController.videos);
router.get('/api/movie/:id/images', validate(schemas.idSchema, 'params'), movieController.images);

// Get person details
router.get('/api/person/:id', validate(schemas.idSchema, 'params'), movieController.person);

// Get genres
router.get('/api/genres', movieController.genres);

// Movie Lists
router.get('/api/popular', validate(schemas.listSchema), movieController.movieList);
router.get('/api/upcoming', validate(schemas.listSchema), movieController.movieList);
router.get('/api/now-playing', validate(schemas.listSchema), movieController.movieList);
router.get('/api/top-rated', validate(schemas.listSchema), movieController.movieList);

// =======================
// PROTECTED / IMPORT ENDPOINTS
// =======================
router.use('/api/import', verifyApiKey);

// Search movies
router.get('/api/import/search', validate(schemas.searchSchema), movieController.search);

// Search keywords
router.get('/api/import/search/keyword', validate(schemas.searchSchema), movieController.searchKeywords);

// Get movie preview
router.get('/api/import/preview/:id', validate(schemas.idSchema, 'params'), movieController.preview);

// Standalone endpoints for movie details
router.get('/api/import/movie/:id/credits', validate(schemas.idSchema, 'params'), movieController.credits);
router.get('/api/import/movie/:id/videos', validate(schemas.idSchema, 'params'), movieController.videos);
router.get('/api/import/movie/:id/images', validate(schemas.idSchema, 'params'), movieController.images);

// Get person details
router.get('/api/import/person/:id', validate(schemas.idSchema, 'params'), movieController.person);

// Get genres
router.get('/api/import/genres', movieController.genres);

// Movie Lists
router.get('/api/import/popular', validate(schemas.listSchema), movieController.movieList);
router.get('/api/import/upcoming', validate(schemas.listSchema), movieController.movieList);
router.get('/api/import/now-playing', validate(schemas.listSchema), movieController.movieList);
router.get('/api/import/top-rated', validate(schemas.listSchema), movieController.movieList);

module.exports = router;
