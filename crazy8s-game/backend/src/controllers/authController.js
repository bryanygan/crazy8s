const User = require('../models/User');
const UserStore = require('../stores/UserStore');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

class AuthController {
  // User registration
  static async register(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { username, email, password, displayName, settings } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Create user
      const user = await UserStore.create({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        displayName: displayName?.trim(),
        settings: settings || {}
      });

      // Record the registration
      user.recordLogin(ipAddress);

      logger.info(`User registered successfully: ${user.username} from ${ipAddress}`);

      // Return user data with token in correct format
      const authData = user.toAuthJSON();
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: authData,
          token: authData.token
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);

      // Handle specific errors
      if (error.message.includes('Username already exists')) {
        return res.status(409).json({
          success: false,
          error: 'Username already exists',
          code: 'USERNAME_EXISTS'
        });
      }

      if (error.message.includes('Email already exists')) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          code: 'EMAIL_EXISTS'
        });
      }

      res.status(400).json({
        success: false,
        error: error.message,
        code: 'REGISTRATION_FAILED'
      });
    }
  }

  // User login
  static async login(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { identifier, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;

      // Find user by username or email
      const user = await UserStore.findByUsernameOrEmail(identifier.trim());
      
      // Perform constant-time authentication to prevent timing attacks
      let isPasswordValid = false;
      let shouldProceed = true;
      
      if (!user) {
        // Perform dummy password comparison to maintain constant time
        const bcrypt = require('bcrypt');
        await bcrypt.compare(password, '$2b$12$dummyHashToPreventTimingAttack');
        shouldProceed = false;
        logger.warn(`Login attempt with unknown identifier: ${identifier} from ${ipAddress}`);
      } else {
        // Check if account is locked
        if (user.isLocked()) {
          shouldProceed = false;
          logger.warn(`Login attempt on locked account: ${user.username} from ${ipAddress}`);
        }

        // Check if account is active
        if (!user.profile.isActive) {
          shouldProceed = false;
          logger.warn(`Login attempt on inactive account: ${user.username} from ${ipAddress}`);
        }

        // Verify password (always perform comparison for constant time)
        isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid && shouldProceed) {
          // Increment login attempts
          await user.incLoginAttempts();
          await UserStore.update(user.id, { security: user.security });
          shouldProceed = false;
          logger.warn(`Failed login attempt for user: ${user.username} from ${ipAddress}`);
        }
      }

      // Return appropriate error after constant-time checks
      if (!shouldProceed) {
        if (user?.isLocked()) {
          return res.status(423).json({
            success: false,
            error: 'Account is temporarily locked due to failed login attempts',
            code: 'ACCOUNT_LOCKED',
            lockUntil: user.security.lockUntil
          });
        }
        
        if (user && !user.profile.isActive) {
          return res.status(401).json({
            success: false,
            error: 'Account is deactivated',
            code: 'ACCOUNT_DEACTIVATED'
          });
        }
        
        // Generic invalid credentials response
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Successful login
      user.recordLogin(ipAddress);
      await UserStore.update(user.id, {
        profile: user.profile,
        security: user.security
      });

      logger.info(`User logged in successfully: ${user.username} from ${ipAddress}`);

      // Return user data with token in correct format
      const authData = user.toAuthJSON();
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: authData,
          token: authData.token
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during login',
        code: 'LOGIN_ERROR'
      });
    }
  }

  // Refresh token
  static async refreshToken(req, res) {
    try {
      const user = req.user; // Set by validateRefreshToken middleware

      // Generate new tokens
      const authData = user.toAuthJSON();

      logger.info(`Token refreshed for user: ${user.username}`);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          user: authData,
          token: authData.token
        }
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during token refresh',
        code: 'TOKEN_REFRESH_ERROR'
      });
    }
  }

  // Get current user profile
  static async getProfile(req, res) {
    try {
      const user = req.user; // Set by authentication middleware

      res.json({
        success: true,
        user: user.toPublicJSON()
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'PROFILE_ERROR'
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const user = req.user;
      const { displayName, avatar } = req.body;

      const profileData = {};
      if (displayName !== undefined) profileData.displayName = displayName.trim();
      if (avatar !== undefined) profileData.avatar = avatar;

      await UserStore.update(user.id, { profile: profileData });

      logger.info(`Profile updated for user: ${user.username}`);

      // Return updated user data
      const updatedUser = await UserStore.findById(user.id);
      res.json({
        success: true,
        message: 'Profile updated successfully',
        user: updatedUser.toPublicJSON()
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'UPDATE_PROFILE_ERROR'
      });
    }
  }

  // Get user settings
  static async getSettings(req, res) {
    try {
      const user = req.user;

      res.json({
        success: true,
        settings: user.gameSettings || {}
      });
    } catch (error) {
      logger.error('Get settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'GET_SETTINGS_ERROR'
      });
    }
  }

  // Update user settings
  static async updateSettings(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const user = req.user;
      const newSettings = req.body;

      // Validate settings
      const settingsValidation = User.validateSettings(newSettings);
      if (!settingsValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: settingsValidation.error,
          code: 'INVALID_SETTINGS'
        });
      }

      await UserStore.update(user.id, { gameSettings: newSettings });

      logger.info(`Settings updated for user: ${user.username}`);

      // Return updated user with settings
      const updatedUser = await UserStore.findById(user.id);
      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: updatedUser.gameSettings || {},
        user: updatedUser.toPublicJSON()
      });
    } catch (error) {
      logger.error('Update settings error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'UPDATE_SETTINGS_ERROR'
      });
    }
  }

  // Change password
  static async changePassword(req, res) {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const user = req.user;
      const { currentPassword, newPassword } = req.body;

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Update password
      await UserStore.update(user.id, { password: newPassword });

      logger.info(`Password changed for user: ${user.username}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'CHANGE_PASSWORD_ERROR'
      });
    }
  }

  // Get user statistics
  static async getStatistics(req, res) {
    try {
      const user = req.user;

      res.json({
        success: true,
        statistics: user.statistics
      });
    } catch (error) {
      logger.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'GET_STATISTICS_ERROR'
      });
    }
  }

  // Logout (client-side token invalidation)
  static async logout(req, res) {
    try {
      const user = req.user;

      logger.info(`User logged out: ${user.username}`);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'LOGOUT_ERROR'
      });
    }
  }
}

// Validation rules
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one letter and one number'),
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name must be less than 50 characters')
];

const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Username or email is required')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const updateProfileValidation = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Display name must be less than 50 characters'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one letter and one number')
];

module.exports = {
  AuthController,
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
};