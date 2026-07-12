const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('../config/config');

// Ép Node.js sử dụng IPv4 (khắc phục lỗi timeout thường gặp trên Node 17+ khi mạng có cấu hình IPv6 không ổn định)
const httpAgent = new http.Agent({ family: 4 });
const httpsAgent = new https.Agent({ family: 4 });

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
    
    // If the config doesn't exist or we already retried, throw error
    if (!config || config._retry) {
      return Promise.reject(error);
    }
    
    // Retry on 5xx errors or network errors
    if (!response || response.status >= 500) {
      config._retry = true;
      console.log(`Retrying request to ${config.url}`);
      return tmdbClient(config);
    }
    
    return Promise.reject(error);
  }
);

module.exports = tmdbClient;
