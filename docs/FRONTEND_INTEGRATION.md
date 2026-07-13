# LoraFilm TMDB Frontend Integration Guide

This API acts as an integration adapter to normalize TMDB responses into a format strictly compatible with the LoraFilm Movie Service frontend workflow.

## Recommended Admin Flow

1. **Call search suggestions while typing:**
   ```http
   GET /api/import/search/suggestions?keyword=dune
   ```
   *Displays a quick autocomplete dropdown with thumbnail posters.*

2. **Call search for the full result list:**
   ```http
   GET /api/import/search?keyword=dune&page=1
   ```
   *Used if the admin presses Enter to see the full paginated list of results.*

3. **Select tmdbId.** (e.g., `693134` for Dune 2)

4. **Call the bundle endpoint once:**
   ```http
   GET /api/import/movies/693134/bundle
   ```
   *This single request fetches details, casts, crew, images, videos, release dates, and translations.*

5. **Populate the create-movie form:**
   *Use the response to auto-fill title, overview, primary poster, main cast, release date, and certifications.*

6. **Allow admin edits.**
   *Admins can edit translated text, select a different trailer, or adjust cast order.*

7. **Submit normalized form data to Movie Service.**

## Example TypeScript Interfaces

```typescript
export interface TmdbMovieSearchItem {
  tmdbId: number;
  title: string;
  originalTitle: string | null;
  overview: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  genreIds: number[];
  voteAverage: number;
  voteCount: number;
}

export interface TmdbMovieBundle {
  movie: TmdbMoviePreview;
  genres: TmdbGenre[];
  credits: {
    directors: TmdbPerson[];
    writers: TmdbPerson[];
    producers: TmdbPerson[];
    mainCast: TmdbCast[];
    supportingCast: TmdbCast[];
    crew: TmdbPerson[];
  };
  media: {
    primaryPoster: TmdbImage;
    primaryBackdrop: TmdbImage;
    posters: TmdbImage[];
    backdrops: TmdbImage[];
    logos: TmdbImage[];
  };
  videos: {
    primaryTrailer: TmdbVideo;
    trailers: TmdbVideo[];
    teasers: TmdbVideo[];
    clips: TmdbVideo[];
    featurettes: TmdbVideo[];
    other: TmdbVideo[];
  };
  releaseInfo: {
    preferredCountry: string;
    preferredRelease: TmdbRelease;
    countries: TmdbCountryReleases[];
  };
  translations: TmdbTranslation[];
  alternativeTitles: TmdbAlternativeTitle[];
  keywords: TmdbKeyword[];
  externalIds: TmdbExternalIds;
  productionCompanies: TmdbCompany[];
  metadata: {
    provider: string;
    language: string;
    fallbackLanguage: string;
    fetchedAt: string;
    cacheHit: boolean;
  };
}
```

## Security Warning
**The `x-api-key` MUST NOT be hardcoded into a public React/Vite bundle.**
It is an internal key meant to be kept secure.

Recommended production flow:
`Admin Frontend -> LoraFilm API Gateway -> TMDB Integration API -> TMDB`
