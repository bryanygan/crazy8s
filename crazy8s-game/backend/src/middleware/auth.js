const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserStore = require('../stores/UserStore');
const logger = require('../utils/logger');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }
    
    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. Invalid token format.',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }
    
    try {
      // Verify JWT token
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable not set');
      }
      const decoded = jwt.verify(token, secret);
      
      // Find user
      const user = await UserStore.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Access denied. User not found.',
          code: 'USER_NOT_FOUND'
        });
      }
      
      if (!user.profile.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Access denied. Account is deactivated.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }
      
      if (user.isLocked()) {
        return res.status(423).json({
          success: false,
          error: 'Account is temporarily locked due to failed login attempts.',
          code: 'ACCOUNT_LOCKED',
          lockUntil: user.security.lockUntil
        });
      }
      
      // Add user to request object
      req.user = user;
      req.token = token;
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Access denied. Token has expired.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Access denied. Invalid token.',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable not set');
      }
      const decoded = jwt.verify(token, secret);
      
      const user = await UserStore.findById(decoded.id);
      
      if (user && user.profile.isActive && !user.isLocked()) {
        req.user = user;
        req.token = token;
      } else {
        req.user = null;
      }
    } catch (jwtError) {
      req.user = null;
    }
    
    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    req.user = null;
    next();
  }
};

// Admin authentication middleware
const requireAdmin = async (req, res, next) => {
  try {
    // First authenticate the user
    await new Promise((resolve, reject) => {
      authenticate(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Check if user has admin privileges
    if (!req.user.profile.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.',
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }
    
    next();
  } catch (error) {
    // Error handling is done in authenticate middleware
    return;
  }
};

// Rate limiting middleware for authentication endpoints
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(key);
      }
    }
    
    const userAttempts = attempts.get(identifier);
    
    if (!userAttempts) {
      attempts.set(identifier, {
        count: 1,
        firstAttempt: now
      });
    } else if (now - userAttempts.firstAttempt > windowMs) {
      // Reset if window has passed
      attempts.set(identifier, {
        count: 1,
        firstAttempt: now
      });
    } else {
      userAttempts.count++;
      
      if (userAttempts.count > maxAttempts) {
        return res.status(429).json({
          success: false,
          error: `Too many authentication attempts. Please try again later.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000)
        });
      }
    }
    
    next();
  };
};

// Middleware to validate user ownership of resources
const requireOwnership = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    const resourceId = req.params[resourceIdParam];
    const userId = req.user.id;
    
    if (resourceId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own resources.',
        code: 'OWNERSHIP_REQUIRED'
      });
    }
    
    next();
  };
};

// Middleware to extract user from token without requiring authentication
const extractUser = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      
      if (token) {
        try {
          const secret = process.env.JWT_SECRET;
          if (!secret) {
            throw new Error('JWT_SECRET environment variable not set');
          }
          const decoded = jwt.verify(token, secret);
          
          const user = await UserStore.findById(decoded.id);
          if (user) {
            req.user = user;
            req.token = token;
          }
        } catch (jwtError) {
          // Ignore token errors in extract mode
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('Extract user middleware error:', error);
    next();
  }
};

// Refresh token validation
const validateRefreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required.',
        code: 'REFRESH_TOKEN_REQUIRED'
      });
    }
    
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error('JWT_SECRET environment variable not set');
      }
      const decoded = jwt.verify(refreshToken, secret);
      
      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token type.',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
      
      const user = await UserStore.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found.',
          code: 'USER_NOT_FOUND'
        });
      }
      
      if (!user.profile.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }
      
      req.user = user;
      req.refreshToken = refreshToken;
      
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Refresh token has expired.',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token.',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }
    }
  } catch (error) {
    logger.error('Refresh token validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during token validation.',
      code: 'TOKEN_VALIDATION_ERROR'
    });
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  authRateLimit,
  requireOwnership,
  extractUser,
  validateRefreshToken
};