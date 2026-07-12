const config = require('../config/config');

/**
 * Converts a raw TMDB image path to a full URL
 */
const getImageUrl = (path) => {
  if (!path) return null;
  const base = config.tmdb.imageBase.replace(/\/$/, '');
  const size = config.tmdb.imageSize;
  if (base.endsWith(`/${size}`)) {
    return `${base}${path}`;
  }
  return `${base}/${size}${path}`;
};

/**
 * Normalizes movie detail responses from append_to_response
 */
const normalizeMovieData = (movie) => {
  if (!movie) return null;

  const credits = movie.credits || {};
  const videos = movie.videos || {};
  const images = movie.images || {};
  const keywords = movie.keywords || {};
  const recommendations = movie.recommendations || {};
  const similar = movie.similar || {};
  const releaseDates = movie.release_dates || {};
  const translations = movie.translations || {};
  const externalIds = movie.external_ids || {};
  const reviews = movie.reviews || {};
  const watchProviders = movie['watch/providers'] || {};
  const alternativeTitles = movie.alternative_titles || {};

  return {
    provider: 'TMDB',
    movie: {
      tmdbId: movie.id,
      imdbId: movie.imdb_id,
      title: movie.title,
      originalTitle: movie.original_title,
      originalLanguage: movie.original_language,
      overview: movie.overview,
      tagline: movie.tagline,
      status: movie.status,
      runtime: movie.runtime,
      adult: movie.adult,
      video: movie.video,
      popularity: movie.popularity,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      budget: movie.budget,
      revenue: movie.revenue,
      releaseDate: movie.release_date,
      homepage: movie.homepage,
      poster: getImageUrl(movie.poster_path),
      backdrop: getImageUrl(movie.backdrop_path),
    },
    genres: movie.genres || [],
    casts: (credits.cast || []).map(c => ({
      tmdbPersonId: c.id,
      name: c.name,
      originalName: c.original_name,
      character: c.character,
      gender: c.gender,
      popularity: c.popularity,
      profileImage: getImageUrl(c.profile_path),
      castOrder: c.order,
      knownForDepartment: c.known_for_department
    })),
    crew: (credits.crew || []).map(c => ({
      tmdbPersonId: c.id,
      name: c.name,
      originalName: c.original_name,
      job: c.job,
      department: c.department,
      gender: c.gender,
      popularity: c.popularity,
      profileImage: getImageUrl(c.profile_path)
    })),
    directors: (credits.crew || []).filter(c => c.job === 'Director').map(c => ({
      tmdbPersonId: c.id,
      name: c.name,
      profileImage: getImageUrl(c.profile_path)
    })),
    writers: (credits.crew || []).filter(c => ['Screenplay', 'Writer', 'Story', 'Original Story', 'Novel'].includes(c.job)).map(c => ({
      tmdbPersonId: c.id,
      name: c.name,
      job: c.job,
      profileImage: getImageUrl(c.profile_path)
    })),
    producers: (credits.crew || []).filter(c => ['Producer', 'Executive Producer'].includes(c.job)).map(c => ({
      tmdbPersonId: c.id,
      name: c.name,
      job: c.job,
      profileImage: getImageUrl(c.profile_path)
    })),
    trailers: (videos.results || []).filter(v => v.site === 'YouTube' && ['Trailer', 'Teaser', 'Clip', 'Featurette', 'Behind the Scenes'].includes(v.type)),
    images: {
      backdrops: (images.backdrops || []).map(img => ({ ...img, file_path: getImageUrl(img.file_path) })),
      posters: (images.posters || []).map(img => ({ ...img, file_path: getImageUrl(img.file_path) })),
      logos: (images.logos || []).map(img => ({ ...img, file_path: getImageUrl(img.file_path) }))
    },
    keywords: keywords.keywords || [],
    productionCompanies: (movie.production_companies || []).map(company => ({
      id: company.id,
      name: company.name,
      logo: getImageUrl(company.logo_path),
      originCountry: company.origin_country
    })),
    productionCountries: (movie.production_countries || []).map(country => ({
      isoCode: country.iso_3166_1,
      countryName: country.name
    })),
    spokenLanguages: (movie.spoken_languages || []).map(lang => ({
      isoCode: lang.iso_639_1,
      englishName: lang.english_name,
      nativeName: lang.name
    })),
    externalIds: externalIds,
    collection: movie.belongs_to_collection ? {
      collectionId: movie.belongs_to_collection.id,
      collectionName: movie.belongs_to_collection.name,
      poster: getImageUrl(movie.belongs_to_collection.poster_path),
      backdrop: getImageUrl(movie.belongs_to_collection.backdrop_path)
    } : null,
    recommendations: (recommendations.results || []).map(r => ({
      tmdbId: r.id,
      title: r.title,
      poster: getImageUrl(r.poster_path),
      backdrop: getImageUrl(r.backdrop_path)
    })),
    similarMovies: (similar.results || []).map(s => ({
      tmdbId: s.id,
      title: s.title,
      poster: getImageUrl(s.poster_path),
      backdrop: getImageUrl(s.backdrop_path)
    })),
    watchProviders: watchProviders.results || {},
    reviews: reviews.results || [],
    translations: translations.translations || [],
    releaseDates: releaseDates.results || [],
    alternativeTitles: alternativeTitles.titles || []
  };
};

module.exports = {
  getImageUrl,
  normalizeMovieData,
};
