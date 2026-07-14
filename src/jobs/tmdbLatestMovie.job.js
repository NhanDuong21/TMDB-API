const cron = require('node-cron');
const tmdbService = require('../services/tmdbService');
const latestCache = require('../services/tmdbLatestMovieCache.service');
const tmdbClient = require('../config/tmdbClient'); // To make direct GET /movie/{id} if we want

const runLatestMovieJob = async () => {
  try {
    // 1. Call GET /movie/latest
    // Note: The /movie/latest endpoint only returns ONE latest movie that has been added to TMDB.
    const latestMovie = await tmdbService.getLatestMovie();
    
    if (!latestMovie || !latestMovie.id) {
      console.warn('[Job] Invalid movie response from TMDB /movie/latest');
      return;
    }

    // 2. Extract movie ID
    const movieId = latestMovie.id;

    // 3. Check if movie ID already exists in cache
    if (latestCache.exists(movieId)) {
      return;
    }

    // 4. If it is a new movie: Call GET /movie/{movie_id}
    // We use tmdbClient directly or tmdbService to fetch detail.
    let movieDetail;
    try {
      const response = await tmdbClient.get(`/movie/${movieId}`);
      movieDetail = response.data;
    } catch (err) {
      console.error(`[Job] Failed to get detail for movie ${movieId}:`, err.message);
      // If failed due to timeout or rate limit, we can skip or use latestMovie object as fallback
      movieDetail = latestMovie;
    }

    // Format the movie according to the required response structure
    const formattedMovie = {
      tmdbId: movieDetail.id,
      title: movieDetail.title || movieDetail.original_title,
      overview: movieDetail.overview,
      posterPath: movieDetail.poster_path,
      backdropPath: movieDetail.backdrop_path,
      releaseDate: movieDetail.release_date
    };

    // 5. Add movie detail to cache
    // 6. Keep only latest 10 movies (handled by cache service)
    latestCache.addMovie(formattedMovie);
    console.log(`[Job] Added new latest movie to cache: ${formattedMovie.title} (${formattedMovie.tmdbId})`);

  } catch (error) {
    // Handle error without stopping scheduler (API timeout, rate limit, etc.)
    console.error('[Job] Error in tmdbLatestMovie job:', error.message);
  }
};

const startJob = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', runLatestMovieJob);
  console.log('[Job] Scheduled tmdbLatestMovie to run every 5 minutes.');
  
  // Optionally run once immediately to populate cache
  runLatestMovieJob();
};

module.exports = { startJob, runLatestMovieJob };
