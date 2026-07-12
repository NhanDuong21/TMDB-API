const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const config = require('./config/config');
const importRoutes = require('./routes/importRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const swaggerSpecs = require('./swagger/swaggerOptions');

const app = express();

// Security Middlewares
app.use(helmet());
app.disable('x-powered-by');

// CORS
app.use(cors());

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes
app.use('/health', healthRoutes);
app.use('/api/import', importRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
