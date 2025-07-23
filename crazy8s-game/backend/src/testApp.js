const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');

// Test-specific app that doesn't require database connection
const createTestApp = () => {
  const app = express();

  // Basic middleware for testing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // CORS for testing
  app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }));

  // Health check endpoint for tests
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      environment: 'test',
      timestamp: new Date().toISOString() 
    });
  });

  // Basic error handling
  app.use((err, req, res, next) => {
    logger.error('Test app error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
};

module.exports = createTestApp;