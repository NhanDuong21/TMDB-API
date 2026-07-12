const config = require('../config/config');

const verifyApiKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!providedKey) {
    return res.status(401).json({
      success: false,
      errorCode: 401,
      message: 'API Key is missing. Please provide it via "x-api-key" header or "api_key" query parameter.',
      timestamp: new Date().toISOString()
    });
  }

  if (providedKey !== config.security.apiKey) {
    return res.status(403).json({
      success: false,
      errorCode: 403,
      message: 'Invalid API Key.',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

module.exports = verifyApiKey;
