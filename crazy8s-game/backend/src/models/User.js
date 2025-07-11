const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class User {
  constructor(userData) {
    this.id = userData.id || this.generateId();
    this.username = userData.username;
    this.email = userData.email;
    this.passwordHash = userData.passwordHash;
    
    // Enhanced game settings aligned with architect's schema
    this.gameSettings = {
      // Card organization settings
      sortByRank: false,
      groupBySuit: false,
      experiencedMode: false,
      
      // Timer settings
      enableTimer: true,
      timerDuration: 60,
      timerWarningTime: 15,
      
      // Card sorting preferences (complex JSONB object)
      cardSortingPreferences: {},
      
      // UI/UX preferences
      soundEnabled: true,
      notificationsEnabled: true,
      animationsEnabled: true,
      
      // Accessibility settings
      highContrastMode: false,
      reducedMotion: false,
      fontSizeMultiplier: 1.00,
      
      // Advanced settings
      autoSortHand: true,
      showCardCount: true,
      quickPlayMode: false,
      
      ...userData.gameSettings
    };
    
    // App-wide preferences
    this.appPreferences = {
      // Internationalization
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      
      // UI theme
      theme: 'light',
      colorScheme: 'default',
      
      // Communication preferences
      emailNotifications: true,
      pushNotifications: true,
      gameInvitesEnabled: true,
      friendRequestsEnabled: true,
      
      // Privacy settings
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowFriendRequests: true,
      
      ...userData.appPreferences
    };
    
    // Profile information
    this.profile = {
      displayName: userData.displayName || userData.username,
      avatarUrl: userData.avatarUrl || userData.avatar || null,
      bio: userData.bio || null,
      joinedAt: userData.joinedAt || new Date(),
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      isVerified: userData.isVerified !== undefined ? userData.isVerified : false,
      isDeleted: userData.isDeleted !== undefined ? userData.isDeleted : false,
      deletedAt: userData.deletedAt || null,
      ...userData.profile
    };
    
    // Enhanced statistics aligned with architect's schema
    this.statistics = {
      // Basic game stats
      totalGamesPlayed: 0,
      totalGamesWon: 0,
      totalGamesLost: 0,
      totalGamesAbandoned: 0,
      
      // Scoring statistics
      totalScore: 0,
      highestSingleGameScore: 0,
      lowestSingleGameScore: 0,
      averageScore: 0,
      
      // Streak tracking
      currentWinStreak: 0,
      longestWinStreak: 0,
      currentLossStreak: 0,
      longestLossStreak: 0,
      
      // Time-based statistics
      totalPlayTimeSeconds: 0,
      averageGameDurationSeconds: 0,
      shortestGameSeconds: null,
      longestGameSeconds: null,
      
      // Card-specific statistics
      totalCardsPlayed: 0,
      favoriteCardRank: null,
      favoriteCardSuit: null,
      eightCardsPlayed: 0,
      specialCardsPlayed: 0,
      
      // Advanced gameplay statistics
      averageCardsPerTurn: 0,
      mostCardsPlayedSingleTurn: 0,
      tournamentGamesPlayed: 0,
      tournamentWins: 0,
      
      // Monthly/seasonal tracking
      monthlyGamesWon: 0,
      monthlyGamesPlayed: 0,
      seasonStartDate: null,
      
      ...userData.statistics
    };
    
    // Enhanced security aligned with architect's schema
    this.security = {
      // Login tracking
      lastLogin: userData.lastLogin || null,
      lastLoginIp: userData.lastLoginIp || userData.lastLoginIP || null,
      lastLoginUserAgent: userData.lastLoginUserAgent || null,
      passwordChangedAt: userData.passwordChangedAt || new Date(),
      
      // Account protection
      loginAttempts: 0,
      lockedUntil: userData.lockedUntil || userData.lockUntil || null,
      failedLoginIps: userData.failedLoginIps || [],
      
      // Email verification
      emailVerified: false,
      emailVerificationToken: userData.emailVerificationToken || null,
      emailVerificationExpires: userData.emailVerificationExpires || null,
      
      // Password reset
      passwordResetToken: userData.passwordResetToken || null,
      passwordResetExpires: userData.passwordResetExpires || null,
      
      // Session management
      refreshTokenHash: userData.refreshTokenHash || null,
      refreshTokenExpires: userData.refreshTokenExpires || null,
      
      // Two-factor authentication (future feature)
      twoFactorEnabled: false,
      twoFactorSecret: userData.twoFactorSecret || null,
      backupCodes: userData.backupCodes || [],
      
      ...userData.security
    };
    
    this.createdAt = userData.createdAt || new Date();
    this.updatedAt = userData.updatedAt || new Date();
    
    // Backward compatibility - merge old settings format
    if (userData.settings) {
      this.gameSettings = { ...this.gameSettings, ...userData.settings };
    }
  }

  generateId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  // Password hashing
  static async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Password verification
  async comparePassword(candidatePassword) {
    try {
      return await bcrypt.compare(candidatePassword, this.passwordHash);
    } catch (error) {
      logger.error('Password comparison error:', error);
      return false;
    }
  }

  // JWT token generation
  generateAuthToken() {
    const payload = {
      id: this.id,
      username: this.username,
      email: this.email
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable not set');
    }
    const expiresIn = process.env.JWT_EXPIRE || '7d';

    return jwt.sign(payload, secret, { expiresIn });
  }

  // Generate refresh token
  generateRefreshToken() {
    const payload = {
      id: this.id,
      type: 'refresh'
    };

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable not set');
    }
    const expiresIn = process.env.JWT_REFRESH_EXPIRE || '30d';

    return jwt.sign(payload, secret, { expiresIn });
  }

  // Account locking methods
  async incLoginAttempts() {
    this.security.loginAttempts += 1;
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.security.loginAttempts >= 5) {
      this.security.lockedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
      logger.warn(`Account locked for user: ${this.username}`);
    }
    
    this.updatedAt = new Date();
  }

  resetLoginAttempts() {
    this.security.loginAttempts = 0;
    this.security.lockedUntil = null;
    this.updatedAt = new Date();
  }

  isLocked() {
    return !!(this.security.lockedUntil && this.security.lockedUntil > new Date());
  }

  // Update user settings (backward compatibility)
  updateSettings(newSettings) {
    this.gameSettings = {
      ...this.gameSettings,
      ...newSettings
    };
    this.updatedAt = new Date();
    logger.info(`Game settings updated for user: ${this.username}`);
  }

  // Update game settings specifically
  updateGameSettings(newSettings) {
    this.gameSettings = {
      ...this.gameSettings,
      ...newSettings
    };
    this.updatedAt = new Date();
    logger.info(`Game settings updated for user: ${this.username}`);
  }

  // Update app preferences
  updateAppPreferences(newPreferences) {
    this.appPreferences = {
      ...this.appPreferences,
      ...newPreferences
    };
    this.updatedAt = new Date();
    logger.info(`App preferences updated for user: ${this.username}`);
  }

  // Update profile
  updateProfile(profileData) {
    this.profile = {
      ...this.profile,
      ...profileData
    };
    this.updatedAt = new Date();
  }

  // Update statistics after a game
  updateGameStats(gameResult) {
    const { won, score, playTime, gameMode } = gameResult;
    
    this.statistics.gamesPlayed += 1;
    
    if (won) {
      this.statistics.gamesWon += 1;
      this.statistics.currentWinStreak += 1;
      this.statistics.longestWinStreak = Math.max(
        this.statistics.longestWinStreak,
        this.statistics.currentWinStreak
      );
    } else {
      this.statistics.gamesLost += 1;
      this.statistics.currentWinStreak = 0;
    }
    
    if (score !== undefined) {
      this.statistics.totalScore += score;
      this.statistics.bestScore = Math.max(this.statistics.bestScore, score);
    }
    
    if (playTime !== undefined) {
      this.statistics.totalPlayTime += playTime;
    }
    
    if (gameMode) {
      this.statistics.favoriteGameMode = gameMode;
    }
    
    this.updatedAt = new Date();
    logger.info(`Game statistics updated for user: ${this.username}`);
  }

  // Record successful login
  recordLogin(ipAddress, userAgent) {
    this.security.lastLogin = new Date();
    this.security.lastLoginIp = ipAddress;
    this.security.lastLoginUserAgent = userAgent;
    this.resetLoginAttempts();
    this.updatedAt = new Date();
  }

  // Get public user data (safe for API responses)
  toPublicJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      profile: {
        displayName: this.profile.displayName,
        avatarUrl: this.profile.avatarUrl,
        bio: this.profile.bio,
        joinedAt: this.profile.joinedAt,
        isVerified: this.profile.isVerified
      },
      gameSettings: this.gameSettings,
      appPreferences: {
        language: this.appPreferences.language,
        theme: this.appPreferences.theme,
        timezone: this.appPreferences.timezone
      },
      statistics: {
        totalGamesPlayed: this.statistics.totalGamesPlayed,
        totalGamesWon: this.statistics.totalGamesWon,
        totalGamesLost: this.statistics.totalGamesLost,
        highestSingleGameScore: this.statistics.highestSingleGameScore,
        longestWinStreak: this.statistics.longestWinStreak,
        currentWinStreak: this.statistics.currentWinStreak,
        tournamentWins: this.statistics.tournamentWins
      },
      createdAt: this.createdAt,
      
      // Backward compatibility
      settings: this.gameSettings
    };
  }

  // Get user data with auth info (for login response)
  toAuthJSON() {
    return {
      ...this.toPublicJSON(),
      token: this.generateAuthToken(),
      refreshToken: this.generateRefreshToken()
    };
  }

  // Validation methods
  static validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { isValid: false, error: 'Username is required' };
    }
    
    if (username.length < 3 || username.length > 30) {
      return { isValid: false, error: 'Username must be between 3 and 30 characters' };
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
    }
    
    return { isValid: true };
  }

  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }
    
    return { isValid: true };
  }

  static validatePassword(password) {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password is required' };
    }
    
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' };
    }
    
    if (password.length > 128) {
      return { isValid: false, error: 'Password must be less than 128 characters' };
    }
    
    // Check for at least one letter and one number
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return { isValid: false, error: 'Password must contain at least one letter and one number' };
    }
    
    return { isValid: true };
  }

  static validateSettings(settings) {
    const validSettings = {
      // Backend game settings
      sortByRank: 'boolean',
      groupBySuit: 'boolean',
      experiencedMode: 'boolean',
      enableTimer: 'boolean',
      timerDuration: 'number',
      timerWarningTime: 'number',
      cardSortingPreferences: ['object', 'string'],
      soundEnabled: 'boolean',
      notificationsEnabled: 'boolean',
      animationsEnabled: 'boolean',
      autoSortHand: 'boolean',
      showCardCount: 'boolean',
      quickPlayMode: 'boolean',
      
      // UI/UX preferences
      highContrastMode: 'boolean',
      reducedMotion: 'boolean',
      fontSizeMultiplier: 'number',
      
      // App preferences
      language: 'string',
      timezone: 'string',
      dateFormat: 'string',
      theme: 'string',
      colorScheme: 'string',
      
      // Communication
      emailNotifications: 'boolean',
      pushNotifications: 'boolean',
      gameInvitesEnabled: 'boolean',
      friendRequestsEnabled: 'boolean',
      
      // Privacy
      profileVisibility: 'string',
      showOnlineStatus: 'boolean',
      allowFriendRequests: 'boolean',
      
      // Frontend-specific settings
      cardAnimationSpeed: 'number',
      showHints: 'boolean',
      autoSort: 'boolean',
      chatVisible: 'boolean',
      
      // Migration settings
      migrationTimestamp: 'string',
      gameHistory: 'object',
      achievements: 'object',
      
      // Legacy compatibility
      notifications: 'boolean'
    };

    for (const [key, value] of Object.entries(settings)) {
      if (!(key in validSettings)) {
        // Allow unknown settings for forward compatibility, just log warning
        logger.warn(`Unknown setting received: ${key}. Adding to user settings for forward compatibility.`);
        continue;
      }
      
      const expectedTypes = Array.isArray(validSettings[key]) ? validSettings[key] : [validSettings[key]];
      
      if (!expectedTypes.includes(typeof value)) {
        return { isValid: false, error: `Invalid type for ${key}: expected ${expectedTypes.join(' or ')}, got ${typeof value}` };
      }
      
      // Validate specific ranges
      if (key === 'timerDuration' && (value < 30 || value > 300)) {
        return { isValid: false, error: 'Timer duration must be between 30 and 300 seconds' };
      }
      
      if (key === 'timerWarningTime' && (value < 5 || value > 60)) {
        return { isValid: false, error: 'Timer warning time must be between 5 and 60 seconds' };
      }
      
      if (key === 'cardAnimationSpeed' && (value < 100 || value > 2000)) {
        return { isValid: false, error: 'Card animation speed must be between 100 and 2000 milliseconds' };
      }
      
      if (key === 'theme' && !['light', 'dark', 'auto'].includes(value)) {
        return { isValid: false, error: 'Theme must be light, dark, or auto' };
      }
      
      if (key === 'cardSortingPreferences' && !['default', 'rank', 'suit', 'custom'].includes(value)) {
        return { isValid: false, error: 'Invalid card sorting preference' };
      }
    }
    
    return { isValid: true };
  }
}

module.exports = User;