const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('../config/config');

// Ép Node.js sử dụng IPv4 (khắc phục lỗi timeout thường gặp trên Node 17+ khi mạng có cấu hình IPv6 không ổn định)
const httpAgent = new http.Agent({ family: 4, keepAlive: true, maxSockets: 50 });
const httpsAgent = new https.Agent({ family: 4, keepAlive: true, maxSockets: 50 });

const tmdbClient = axios.create({
  baseURL: config.tmdb.baseUrl,
  timeout: config.tmdb.timeout,
  httpAgent,
  httpsAgent,
  headers: {
    Accept: 'application/json',
    Authorization: `Bearer ${config.tmdb.token}`,
    'Accept-Encoding': 'gzip,deflate,compress'
  }
});

// Response interceptor for basic retry logic
tmdbClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    
    config._retryCount = config._retryCount || 0;
    // If the config doesn't exist or we already retried 2 times, throw error
    if (!config || config._retryCount >= 2) {
      return Promise.reject(error);
    }
    
    // Retry on 5xx errors, 429 Too Many Requests, or network errors
    if (!response || response.status >= 500 || response.status === 429) {
      config._retryCount += 1;
      console.log(`Retrying request to ${config.url} (Attempt ${config._retryCount}/2)`);
      
      // If 429, respect Retry-After header if present, otherwise default wait
      let delay = 1000 * config._retryCount;
      if (response && response.status === 429 && response.headers['retry-after']) {
        delay = parseInt(response.headers['retry-after'], 10) * 1000;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return tmdbClient(config);
    }
    
    return Promise.reject(error);
  }
);

module.exports = tmdbClient;
