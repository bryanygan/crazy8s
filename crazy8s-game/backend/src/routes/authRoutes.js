const express = require('express');
const { 
  AuthController, 
  registerValidation, 
  loginValidation, 
  updateProfileValidation, 
  changePasswordValidation 
} = require('../controllers/authController');
const { 
  authenticate, 
  authRateLimit, 
  validateRefreshToken, 
  requireOwnership 
} = require('../middleware/auth');

const router = express.Router();

// Apply rate limiting to authentication routes
const authLimiter = authRateLimit(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

// Public routes
router.post('/register', authLimiter, registerValidation, AuthController.register);
router.post('/login', authLimiter, loginValidation, AuthController.login);
router.post('/refresh', validateRefreshToken, AuthController.refreshToken);

// Protected routes (require authentication)
router.use(authenticate); // All routes below this require authentication

router.get('/profile', AuthController.getProfile);
router.put('/profile', updateProfileValidation, AuthController.updateProfile);
router.get('/settings', AuthController.getSettings);
router.put('/settings', AuthController.updateSettings);
router.get('/statistics', AuthController.getStatistics);
router.post('/change-password', changePasswordValidation, AuthController.changePassword);
router.post('/logout', AuthController.logout);

module.exports = router;