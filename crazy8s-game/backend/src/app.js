const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connect: connectDatabase, healthCheck, getConnectionState } = require('./config/database');
const logger = require('./utils/logger');
const gameRoutes = require('./routes/gameRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const UserStore = require('./stores/UserStore');

const app = express();

// Initialize database connection
const initializeApp = async () => {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connection established');
    
    // Initialize database models if using PostgreSQL
    if (process.env.DB_TYPE === 'postgresql') {
      const { initializeModels } = require('./models/database/postgresql');
      await initializeModels();
      logger.info('PostgreSQL models initialized');
    }
    
    // Initialize UserStore with database models
    await UserStore.initialize();
    
  } catch (error) {
    logger.warn('Database connection failed, continuing in memory-only mode:', error.message);
    logger.info('Game will work normally but without persistent user accounts or game history');
    
    // Still initialize UserStore in memory-only mode
    await UserStore.initialize();
  }
};

// Security middleware
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
  app.use(compression());
  app.set('trust proxy', process.env.TRUST_PROXY === 'true');
}

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // List of allowed origins
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:3000', 'http://localhost:3001'];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow any localhost origin
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    // Log and reject unauthorized origins
    logger.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: process.env.CORS_CREDENTIALS !== 'false', // Default to true
  optionsSuccessStatus: 200,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await healthCheck();
    const connectionState = getConnectionState();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        ...dbHealth,
        connection: connectionState
      },
      memory: process.memoryUsage(),
      node_version: process.version
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    timestamp: new Date().toISOString()
  });
});

// Initialize app
initializeApp();

module.exports = app;