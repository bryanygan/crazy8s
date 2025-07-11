const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper functions for authentication

// Verify JWT token
const verifyToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable not set');
    }
    return jwt.verify(token, secret);
  } catch (error) {
    throw error;
  }
};

// Extract token from request
const extractTokenFromRequest = (req) => {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return null;
  }
  
  // Support both "Bearer <token>" and just "<token>" formats
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
};

// Generate secure random string
const generateSecureRandom = (length = 32) => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

// Hash string using crypto
const hashString = (string, salt = null) => {
  const crypto = require('crypto');
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  const hash = crypto.pbkdf2Sync(string, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
};

// Verify hashed string
const verifyHashedString = (string, hash, salt) => {
  const crypto = require('crypto');
  const hashToCheck = crypto.pbkdf2Sync(string, salt, 10000, 64, 'sha512').toString('hex');
  return hash === hashToCheck;
};

// Generate email verification token
const generateEmailVerificationToken = (userId) => {
  const payload = {
    userId,
    type: 'email_verification',
    timestamp: Date.now()
  };
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable not set');
  }
  return jwt.sign(payload, secret, { expiresIn: '24h' });
};

// Generate password reset token
const generatePasswordResetToken = (userId) => {
  const payload = {
    userId,
    type: 'password_reset',
    timestamp: Date.now()
  };
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable not set');
  }
  return jwt.sign(payload, secret, { expiresIn: '1h' });
};

// Validate password strength
const validatePasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    isValid: checks.length && (checks.uppercase || checks.lowercase) && checks.number,
    score,
    checks,
    strength: score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong'
  };
};

// Sanitize user data for API responses
const sanitizeUserData = (user, includeEmail = false) => {
  const sanitized = {
    id: user.id,
    username: user.username,
    profile: {
      displayName: user.profile.displayName,
      avatar: user.profile.avatar,
      joinedAt: user.profile.joinedAt,
      lastLogin: user.profile.lastLogin
    },
    settings: user.settings,
    statistics: {
      gamesPlayed: user.statistics.gamesPlayed,
      gamesWon: user.statistics.gamesWon,
      gamesLost: user.statistics.gamesLost,
      bestScore: user.statistics.bestScore,
      longestWinStreak: user.statistics.longestWinStreak,
      currentWinStreak: user.statistics.currentWinStreak,
      favoriteGameMode: user.statistics.favoriteGameMode
    },
    createdAt: user.createdAt
  };
  
  if (includeEmail) {
    sanitized.email = user.email;
  }
  
  return sanitized;
};

// Check if user is authorized for action
const isAuthorized = (user, resource, action = 'read') => {
  // Basic authorization logic
  if (!user || !user.profile.isActive) {
    return false;
  }
  
  // Admin can do anything
  if (user.profile.isAdmin) {
    return true;
  }
  
  // User can access their own resources
  if (resource && resource.userId === user.id) {
    return true;
  }
  
  // Public read access
  if (action === 'read' && resource && resource.public) {
    return true;
  }
  
  return false;
};

// Rate limiting helper
const createRateLimitKey = (req, identifier = 'ip') => {
  switch (identifier) {
    case 'ip':
      return req.ip || req.connection.remoteAddress;
    case 'user':
      return req.user?.id || req.ip;
    case 'session':
      return req.sessionID || req.ip;
    default:
      return req.ip;
  }
};

// CORS helper for dynamic origins
const createCorsOptions = (allowedOrigins = []) => {
  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // In development, allow localhost
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200
  };
};

// Session management helpers
const createSessionData = (user) => {
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    loginTime: new Date(),
    lastActivity: new Date()
  };
};

const updateSessionActivity = (session) => {
  if (session) {
    session.lastActivity = new Date();
  }
};

// Input sanitization
const sanitizeInput = (input, type = 'string') => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove potentially dangerous characters
  let sanitized = input.trim();
  
  switch (type) {
    case 'username':
      sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, '');
      break;
    case 'email':
      sanitized = sanitized.toLowerCase();
      break;
    case 'text':
      sanitized = sanitized.replace(/[<>]/g, '');
      break;
    case 'alphanumeric':
      sanitized = sanitized.replace(/[^a-zA-Z0-9]/g, '');
      break;
  }
  
  return sanitized;
};

// Error response helper
const createErrorResponse = (message, code = 'UNKNOWN_ERROR', statusCode = 500) => {
  return {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString()
  };
};

// Success response helper
const createSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    ...data,
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  verifyToken,
  extractTokenFromRequest,
  generateSecureRandom,
  hashString,
  verifyHashedString,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  validatePasswordStrength,
  sanitizeUserData,
  isAuthorized,
  createRateLimitKey,
  createCorsOptions,
  createSessionData,
  updateSessionActivity,
  sanitizeInput,
  createErrorResponse,
  createSuccessResponse
};