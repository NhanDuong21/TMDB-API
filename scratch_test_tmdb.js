const tmdbClient = require('./src/clients/tmdbClient');

async function test() {
  try {
    const res = await tmdbClient.get('/movie/popular');
    console.log('Success:', res.status, res.data.results.length, 'movies');
  } catch (error) {
    console.error('Error calling TMDB API:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}
test();
