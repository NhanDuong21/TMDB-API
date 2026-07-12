const { normalizeMovieData, getImageUrl } = require('../../src/utils/normalizeData');

describe('normalizeData Utility', () => {
  it('should normalize movie data correctly', () => {
    const rawData = {
      id: 123,
      title: 'Test Movie',
      poster_path: '/test.jpg'
    };

    const result = normalizeMovieData(rawData);
    expect(result.provider).toBe('TMDB');
    expect(result.movie.tmdbId).toBe(123);
    expect(result.movie.title).toBe('Test Movie');
    expect(result.movie.poster).toContain('/test.jpg');
    expect(result.genres).toEqual([]);
    expect(result.casts).toEqual([]);
  });

  it('should format image url correctly', () => {
    const url = getImageUrl('/path.jpg');
    expect(url).toBe('https://image.tmdb.org/t/p/original/path.jpg');
  });
});
