class TmdbLatestMovieCacheService {
  constructor() {
    this.movies = [];
    this.maxLimit = 10;
  }

  addMovie(movie) {
    // Insert at the beginning (newest first)
    this.movies.unshift(movie);
    
    // Remove oldest when size > 10
    if (this.movies.length > this.maxLimit) {
      this.movies.pop();
    }
  }

  getMovies() {
    return this.movies;
  }

  exists(movieId) {
    return this.movies.some(m => m.tmdbId === movieId);
  }

  getLatestMovies(limit = 10) {
    const validLimit = Math.min(Math.max(1, limit), this.maxLimit);
    return this.movies.slice(0, validLimit);
  }

  clear() {
    this.movies = [];
  }
}

module.exports = new TmdbLatestMovieCacheService();
