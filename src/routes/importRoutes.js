const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const validate = require('../middlewares/validationMiddleware');
const { searchSchema, idSchema } = require('../validators/movieValidator');

// Search movies
router.get('/search', validate(searchSchema), movieController.search);

// Get movie preview (aggregates multiple TMDB endpoints)
router.get('/preview/:tmdbId', validate(idSchema, 'params'), movieController.preview);

// Get person details
router.get('/person/:id', validate(idSchema, 'params'), movieController.person);

// Get genres
router.get('/genres', movieController.genres);

// Movie Lists
const listValidation = validate(require('joi').object({ page: require('joi').number().integer().min(1).default(1) }));

router.get('/popular', listValidation, movieController.movieList);
router.get('/upcoming', listValidation, movieController.movieList);
router.get('/now-playing', listValidation, movieController.movieList);
router.get('/top-rated', listValidation, movieController.movieList);

module.exports = router;
