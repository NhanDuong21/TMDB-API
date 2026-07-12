const tmdbService = require('../services/tmdbService');
const { normalizeMovieData } = require('../utils/normalizeData');

const search = async (req, res, next) => {
  try {
    const { keyword, page } = req.query;
    // We could extract language from Accept-Language, but requirement says default to vi-VN
    const data = await tmdbService.searchMovies(keyword, page);
    
    // Format response slightly to match expected search response fields
    const formattedResults = data.results.map(movie => ({
      tmdbId: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      releaseDate: movie.release_date,
      poster: movie.poster_path ? require('../config/config').tmdb.imageBase + movie.poster_path : null,
      backdrop: movie.backdrop_path ? require('../config/config').tmdb.imageBase + movie.backdrop_path : null,
      overview: movie.overview,
      popularity: movie.popularity
    }));

    res.status(200).json({
      success: true,
      message: 'Success',
      data: {
        page: data.page,
        results: formattedResults,
        total_pages: data.total_pages,
        total_results: data.total_results
      }
    });
  } catch (error) {
    next(error);
  }
};

const preview = async (req, res, next) => {
  try {
    const { tmdbId } = req.params;
    const rawData = await tmdbService.getMoviePreview(tmdbId);
    const normalizedData = normalizeMovieData(rawData);
    
    res.status(200).json({
      success: true,
      message: 'Success',
      data: normalizedData
    });
  } catch (error) {
    next(error);
  }
};

const person = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await tmdbService.getPersonDetail(id);
    
    // Add image url parsing to person response
    if (data.profile_path) {
      data.profile_path = require('../config/config').tmdb.imageBase + data.profile_path;
    }

    res.status(200).json({
      success: true,
      message: 'Success',
      data
    });
  } catch (error) {
    next(error);
  }
};

const genres = async (req, res, next) => {
  try {
    const data = await tmdbService.getGenres();
    res.status(200).json({
      success: true,
      message: 'Success',
      data: data.genres || []
    });
  } catch (error) {
    next(error);
  }
};

const movieList = async (req, res, next) => {
  try {
    const { page } = req.query;
    // Map url path to TMDB list type
    const type = req.path.split('/').pop().replace('-', '_'); 
    
    const data = await tmdbService.getMovieList(type, page || 1);
    
    const formattedResults = data.results.map(movie => ({
      tmdbId: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      releaseDate: movie.release_date,
      poster: movie.poster_path ? require('../config/config').tmdb.imageBase + movie.poster_path : null,
      backdrop: movie.backdrop_path ? require('../config/config').tmdb.imageBase + movie.backdrop_path : null,
      overview: movie.overview,
      popularity: movie.popularity
    }));

    res.status(200).json({
      success: true,
      message: 'Success',
      data: {
        page: data.page,
        results: formattedResults,
        total_pages: data.total_pages,
        total_results: data.total_results
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  search,
  preview,
  person,
  genres,
  movieList
};
