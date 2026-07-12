// Not found error handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// General error handler
const errorHandler = (err, req, res, next) => {
  // Extract status code from Axios error if present
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (err.response && err.response.status) {
    statusCode = err.response.status;
  }
  
  res.status(statusCode).json({
    success: false,
    errorCode: err.code || statusCode.toString(),
    message: err.response ? (err.response.data.status_message || err.message) : err.message,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  notFound,
  errorHandler,
};
