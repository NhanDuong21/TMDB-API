const tmdbClient = require('../clients/tmdbClient');
const cache = require('../cache/nodeCache');

const getLanguageParam = (language) => {
  return language ? language : require('../config/config').tmdb.defaultLanguage;
};

/**
 * Searches for movies.
 */
const searchMovies = async (keyword, page = 1, language = null) => {
  const cacheKey = `search_${keyword}_${page}_${language}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const response = await tmdbClient.get('/search/movie', {
    params: {
      query: keyword,
      page,
      language: getLanguageParam(language),
    },
  });

  cache.set(cacheKey, response.data);
  return response.data;
};

/**
 * Gets comprehensive movie details using append_to_response for efficiency.
 */
const getMoviePreview = async (tmdbId, language = null) => {
  const langParam = getLanguageParam(language);
  const cacheKey = `preview_${tmdbId}_${langParam}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const appendList = 'credits,videos,images,keywords,similar,release_dates,translations,external_ids,reviews,watch/providers,alternative_titles,changes';

  const response = await tmdbClient.get(`/movie/${tmdbId}`, {
    params: {
      language: langParam,
      append_to_response: appendList
    }
  });

  let movieData = response.data;
  const config = require('../config/config');

  // If Vietnamese translation is requested but overview is empty, fallback to en-US
  if (langParam === config.tmdb.defaultLanguage && !movieData.overview) {
    try {
      const fallbackRes = await tmdbClient.get(`/movie/${tmdbId}`, { params: { language: config.tmdb.fallbackLanguage } });
      movieData.overview = fallbackRes.data.overview;
      // You could fallback other fields like tagline here if needed
      if (!movieData.tagline) movieData.tagline = fallbackRes.data.tagline;
    } catch (e) {
      console.warn(`Fallback to ${config.tmdb.fallbackLanguage} failed for movie ${tmdbId}`);
    }
  }

  cache.set(cacheKey, movieData);
  return movieData;
};

const getPersonDetail = async (personId, language = null) => {
  const cacheKey = `person_${personId}_${language}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const response = await tmdbClient.get(`/person/${personId}`, {
    params: { language: getLanguageParam(language), append_to_response: 'combined_credits' }
  });

  cache.set(cacheKey, response.data);
  return response.data;
};

const getGenres = async (language = null) => {
  const cacheKey = `genres_${language}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const response = await tmdbClient.get(`/genre/movie/list`, {
    params: { language: getLanguageParam(language) }
  });

  cache.set(cacheKey, response.data);
  return response.data;
};

const getMovieList = async (type, page = 1, language = null) => {
  const cacheKey = `list_${type}_${page}_${language}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const validTypes = ['popular', 'upcoming', 'now_playing', 'top_rated'];
  if (!validTypes.includes(type)) {
     const err = new Error('Invalid list type');
     err.code = 400;
     throw err;
  }

  const response = await tmdbClient.get(`/movie/${type}`, {
    params: { page, language: getLanguageParam(language) }
  });

  cache.set(cacheKey, response.data);
  return response.data;
};

const getMovieCredits = async (tmdbId, language = null) => {
  const cacheKey = `credits_${tmdbId}_${language}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const response = await tmdbClient.get(`/movie/${tmdbId}/credits`, {
    params: { language: getLanguageParam(language) }
  });

  cache.set(cacheKey, response.data);
  return response.data;
};

const getMovieVideos = async (tmdbId, language = null) => {
  const cacheKey = `videos_${tmdbId}_${language}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const response = await tmdbClient.get(`/movie/${tmdbId}/videos`, {
    params: { language: getLanguageParam(language) }
  });

  cache.set(cacheKey, response.data);
  return response.data;
};

const getMovieImages = async (tmdbId, language = null) => {
  const cacheKey = `images_${tmdbId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  // Images endpoint rarely uses language translation in the same way, but can be passed
  const response = await tmdbClient.get(`/movie/${tmdbId}/images`, {
    params: { language: getLanguageParam(language), include_image_language: 'en,null' }
  });

  cache.set(cacheKey, response.data);
  return response.data;
};

const searchKeywords = async (query, page = 1) => {
  const cacheKey = `search_keyword_${query}_${page}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const response = await tmdbClient.get('/search/keyword', {
    params: {
      query,
      page
    }
  });

  cache.set(cacheKey, response.data);
  return response.data;
};

module.exports = {
  searchMovies,
  getMoviePreview,
  getPersonDetail,
  getGenres,
  getMovieList,
  getMovieCredits,
  getMovieVideos,
  getMovieImages,
  searchKeywords
};
