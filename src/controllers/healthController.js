const tmdbClient = require('../clients/tmdbClient');
const cache = require('../cache/nodeCache');

const getHealthStatus = async (req, res, next) => {
  try {
    let tmdbStatus = 'DISCONNECTED';
    
    try {
      // Fast check to see if TMDB is reachable and token is valid
      await tmdbClient.get('/configuration');
      tmdbStatus = 'CONNECTED';
    } catch (error) {
      console.error('TMDB connection error:', error.message);
    }

    const cacheStatus = cache ? 'OK' : 'ERROR';

    res.status(200).json({
      status: 'UP',
      tmdb: tmdbStatus,
      cache: cacheStatus
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealthStatus
};
