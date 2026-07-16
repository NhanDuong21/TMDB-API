const express = require('express');
const router = express.Router();
const tmdbSyncController = require('../controllers/tmdbSyncController');
const verifyApiKey = require('../middlewares/authMiddleware');

router.use(verifyApiKey);

router.post('/download-export', tmdbSyncController.downloadExportFile);
router.get('/export', tmdbSyncController.exportMovies);
router.get('/movies/latest', tmdbSyncController.latestMovies);
router.get('/movies/updated', tmdbSyncController.updatedMovies);
router.get('/movies/:tmdbId', tmdbSyncController.movieDetail);

module.exports = router;
