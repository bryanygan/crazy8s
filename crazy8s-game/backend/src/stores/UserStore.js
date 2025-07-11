const User = require('../models/User');
const { databaseManager } = require('../config/database');
const logger = require('../utils/logger');

class UserStore {
  constructor() {
    // In-memory storage for users (fallback when database is unavailable)
    this.users = new Map();
    this.usersByEmail = new Map();
    this.usersByUsername = new Map();
    this.dbModels = null;
  }

  // Initialize database models
  async initialize() {
    try {
      if (databaseManager.isConnected) {
        const { getModels } = require('../models/database');
        this.dbModels = getModels();
        logger.info('UserStore initialized with database models');
      } else {
        logger.info('UserStore initialized in memory-only mode');
      }
    } catch (error) {
      logger.warn('Failed to initialize database models, using memory-only mode:', error.message);
    }
  }

  // Get database User model or fallback to memory
  get isUsingDatabase() {
    return !!(this.dbModels && this.dbModels.User);
  }

  // Create a new user
  async create(userData) {
    try {
      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        throw new Error('Username, email, and password are required');
      }

      // Validate using in-memory User model
      const usernameValidation = User.validateUsername(userData.username);
      if (!usernameValidation.isValid) {
        throw new Error(usernameValidation.error);
      }

      const emailValidation = User.validateEmail(userData.email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.error);
      }

      const passwordValidation = User.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.error);
      }

      if (this.isUsingDatabase) {
        return await this.createUserInDatabase(userData);
      } else {
        return await this.createUserInMemory(userData);
      }
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async createUserInDatabase(userData) {
    const { User: UserModel, UserSettings, UserStatistics } = this.dbModels;
    
    // Check for existing users
    const existingUser = await UserModel.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { username: userData.username.toLowerCase() },
          { email: userData.email.toLowerCase() }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === userData.username.toLowerCase()) {
        throw new Error('Username already exists');
      }
      if (existingUser.email === userData.email.toLowerCase()) {
        throw new Error('Email already exists');
      }
    }

    // Create user with associations
    const user = await UserModel.create({
      username: userData.username.toLowerCase(),
      email: userData.email.toLowerCase(),
      passwordHash: userData.password, // Will be hashed by hooks
      displayName: userData.displayName || userData.username
    });

    // Create associated settings and statistics
    await UserSettings.create({
      userId: user.id,
      ...userData.settings
    });

    await UserStatistics.create({
      userId: user.id
    });

    // Load the complete user with associations
    const completeUser = await UserModel.findByPk(user.id, {
      include: [
        { model: UserSettings, as: 'settings' },
        { model: UserStatistics, as: 'statistics' }
      ]
    });

    logger.info(`User created in database: ${user.username} (${user.id})`);
    return this.wrapDatabaseUser(completeUser);
  }

  async createUserInMemory(userData) {
    // Check if username already exists
    if (this.usersByUsername.has(userData.username.toLowerCase())) {
      throw new Error('Username already exists');
    }

    // Check if email already exists
    if (this.usersByEmail.has(userData.email.toLowerCase())) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await User.hashPassword(userData.password);

    // Create user object
    const user = new User({
      ...userData,
      passwordHash,
      email: userData.email.toLowerCase(),
      username: userData.username.toLowerCase()
    });

    // Store user
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);
    this.usersByUsername.set(user.username, user.id);

    logger.info(`User created in memory: ${user.username} (${user.id})`);
    return user;
  }

  // Wrap database user to provide consistent interface
  wrapDatabaseUser(dbUser) {
    if (!dbUser) return null;
    
    // Create a User instance with database data
    const userData = {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      passwordHash: dbUser.passwordHash,
      displayName: dbUser.displayName,
      avatar: dbUser.avatarUrl,
      joinedAt: dbUser.joinedAt,
      isActive: dbUser.isActive,
      settings: dbUser.settings ? {
        sortByRank: dbUser.settings.sortByRank,
        groupBySuit: dbUser.settings.groupBySuit,
        experiencedMode: dbUser.settings.experiencedMode,
        enableTimer: dbUser.settings.enableTimer,
        timerDuration: dbUser.settings.timerDuration,
        timerWarningTime: dbUser.settings.timerWarningTime,
        soundEnabled: dbUser.settings.soundEnabled,
        notifications: dbUser.settings.notifications,
        language: dbUser.settings.language,
        theme: dbUser.settings.theme
      } : {},
      statistics: dbUser.statistics ? {
        gamesPlayed: dbUser.statistics.gamesPlayed,
        gamesWon: dbUser.statistics.gamesWon,
        gamesLost: dbUser.statistics.gamesLost,
        totalScore: dbUser.statistics.totalScore,
        bestScore: dbUser.statistics.bestScore,
        longestWinStreak: dbUser.statistics.longestWinStreak,
        currentWinStreak: dbUser.statistics.currentWinStreak,
        totalPlayTime: dbUser.statistics.totalPlayTime
      } : {},
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    };

    const user = new User(userData);
    // Store reference to database instance for updates
    user._dbInstance = dbUser;
    return user;
  }

  // Find user by ID
  async findById(id) {
    if (this.isUsingDatabase) {
      const { User: UserModel, UserSettings, UserStatistics } = this.dbModels;
      const dbUser = await UserModel.findByPk(id, {
        include: [
          { model: UserSettings, as: 'settings' },
          { model: UserStatistics, as: 'statistics' }
        ]
      });
      return this.wrapDatabaseUser(dbUser);
    } else {
      return this.users.get(id) || null;
    }
  }

  // Find user by email
  async findByEmail(email) {
    if (this.isUsingDatabase) {
      const { User: UserModel, UserSettings, UserStatistics } = this.dbModels;
      const dbUser = await UserModel.findOne({
        where: { email: email.toLowerCase() },
        include: [
          { model: UserSettings, as: 'settings' },
          { model: UserStatistics, as: 'statistics' }
        ]
      });
      return this.wrapDatabaseUser(dbUser);
    } else {
      const userId = this.usersByEmail.get(email.toLowerCase());
      return userId ? this.users.get(userId) : null;
    }
  }

  // Find user by username
  async findByUsername(username) {
    if (this.isUsingDatabase) {
      const { User: UserModel, UserSettings, UserStatistics } = this.dbModels;
      const dbUser = await UserModel.findOne({
        where: { username: username.toLowerCase() },
        include: [
          { model: UserSettings, as: 'settings' },
          { model: UserStatistics, as: 'statistics' }
        ]
      });
      return this.wrapDatabaseUser(dbUser);
    } else {
      const userId = this.usersByUsername.get(username.toLowerCase());
      return userId ? this.users.get(userId) : null;
    }
  }

  // Find user by username or email
  async findByUsernameOrEmail(identifier) {
    if (this.isUsingDatabase) {
      const { User: UserModel, UserSettings, UserStatistics } = this.dbModels;
      const dbUser = await UserModel.findOne({
        where: {
          [require('sequelize').Op.or]: [
            { username: identifier.toLowerCase() },
            { email: identifier.toLowerCase() }
          ]
        },
        include: [
          { model: UserSettings, as: 'settings' },
          { model: UserStatistics, as: 'statistics' }
        ]
      });
      return this.wrapDatabaseUser(dbUser);
    } else {
      const user = await this.findByUsername(identifier) || await this.findByEmail(identifier);
      return user;
    }
  }

  // Update user
  async update(id, updateData) {
    try {
      if (this.isUsingDatabase) {
        return await this.updateUserInDatabase(id, updateData);
      } else {
        return await this.updateUserInMemory(id, updateData);
      }
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserInDatabase(id, updateData) {
    const { User: UserModel, UserSettings, UserStatistics } = this.dbModels;
    
    const user = await UserModel.findByPk(id, {
      include: [
        { model: UserSettings, as: 'settings' },
        { model: UserStatistics, as: 'statistics' }
      ]
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update user fields
    const userFields = {};
    if (updateData.username) userFields.username = updateData.username.toLowerCase();
    if (updateData.email) userFields.email = updateData.email.toLowerCase();
    if (updateData.password) userFields.passwordHash = updateData.password; // Will be hashed by hooks
    if (updateData.profile) {
      if (updateData.profile.displayName) userFields.displayName = updateData.profile.displayName;
      if (updateData.profile.avatar) userFields.avatarUrl = updateData.profile.avatar;
      if (updateData.profile.isActive !== undefined) userFields.isActive = updateData.profile.isActive;
    }

    if (Object.keys(userFields).length > 0) {
      await user.update(userFields);
    }

    // Update settings
    if (updateData.settings && user.settings) {
      await user.settings.update(updateData.settings);
    }

    // Update statistics
    if (updateData.statistics && user.statistics) {
      await user.statistics.update(updateData.statistics);
    }

    // Update security fields
    if (updateData.security) {
      const securityFields = {};
      if (updateData.security.loginAttempts !== undefined) securityFields.loginAttempts = updateData.security.loginAttempts;
      if (updateData.security.lockUntil !== undefined) securityFields.lockUntil = updateData.security.lockUntil;
      if (updateData.security.lastLoginIP !== undefined) securityFields.lastLoginIP = updateData.security.lastLoginIP;
      
      if (Object.keys(securityFields).length > 0) {
        await user.update(securityFields);
      }
    }

    // Reload user with fresh data
    await user.reload();
    logger.info(`User updated in database: ${user.username} (${user.id})`);
    return this.wrapDatabaseUser(user);
  }

  // Update user in memory

  async updateUserInMemory(id, updateData) {
    try {
      const user = this.users.get(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Handle username change
      if (updateData.username && updateData.username !== user.username) {
        const usernameValidation = User.validateUsername(updateData.username);
        if (!usernameValidation.isValid) {
          throw new Error(usernameValidation.error);
        }

        const newUsername = updateData.username.toLowerCase();
        if (this.usersByUsername.has(newUsername)) {
          throw new Error('Username already exists');
        }

        // Update username index
        this.usersByUsername.delete(user.username);
        this.usersByUsername.set(newUsername, user.id);
        user.username = newUsername;
      }

      // Handle email change
      if (updateData.email && updateData.email !== user.email) {
        const emailValidation = User.validateEmail(updateData.email);
        if (!emailValidation.isValid) {
          throw new Error(emailValidation.error);
        }

        const newEmail = updateData.email.toLowerCase();
        if (this.usersByEmail.has(newEmail)) {
          throw new Error('Email already exists');
        }

        // Update email index
        this.usersByEmail.delete(user.email);
        this.usersByEmail.set(newEmail, user.id);
        user.email = newEmail;
      }

      // Handle password change
      if (updateData.password) {
        const passwordValidation = User.validatePassword(updateData.password);
        if (!passwordValidation.isValid) {
          throw new Error(passwordValidation.error);
        }

        user.passwordHash = await User.hashPassword(updateData.password);
        user.security.passwordChangedAt = new Date();
      }

      // Update other fields
      Object.keys(updateData).forEach(key => {
        if (key !== 'username' && key !== 'email' && key !== 'password') {
          if (key === 'settings' && updateData.settings) {
            user.updateSettings(updateData.settings);
          } else if (key === 'profile' && updateData.profile) {
            user.updateProfile(updateData.profile);
          } else if (user.hasOwnProperty(key)) {
            user[key] = updateData[key];
          }
        }
      });

      user.updatedAt = new Date();
      logger.info(`User updated: ${user.username} (${user.id})`);
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user (soft delete)
  async deleteUser(id) {
    try {
      const user = this.users.get(id);
      if (!user) {
        throw new Error('User not found');
      }

      user.profile.isActive = false;
      user.updatedAt = new Date();

      logger.info(`User deactivated: ${user.username} (${user.id})`);
      return user;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  // Permanently delete user
  async permanentDelete(id) {
    try {
      const user = this.users.get(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Remove from all indexes
      this.users.delete(id);
      this.usersByEmail.delete(user.email);
      this.usersByUsername.delete(user.username);

      logger.info(`User permanently deleted: ${user.username} (${user.id})`);
      return true;
    } catch (error) {
      logger.error('Error permanently deleting user:', error);
      throw error;
    }
  }

  // Get all users (for admin purposes)
  async findAll(filters = {}) {
    try {
      let users = Array.from(this.users.values());

      // Apply filters
      if (filters.isActive !== undefined) {
        users = users.filter(user => user.profile.isActive === filters.isActive);
      }

      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        users = users.filter(user => 
          user.username.includes(searchTerm) ||
          user.email.includes(searchTerm) ||
          user.profile.displayName.toLowerCase().includes(searchTerm)
        );
      }

      // Apply pagination
      if (filters.limit) {
        const offset = filters.offset || 0;
        users = users.slice(offset, offset + filters.limit);
      }

      return users;
    } catch (error) {
      logger.error('Error finding all users:', error);
      throw error;
    }
  }

  // Get user count
  async count(filters = {}) {
    try {
      let users = Array.from(this.users.values());

      if (filters.isActive !== undefined) {
        users = users.filter(user => user.profile.isActive === filters.isActive);
      }

      return users.length;
    } catch (error) {
      logger.error('Error counting users:', error);
      throw error;
    }
  }

  // Clear all users (for testing)
  async clear() {
    this.users.clear();
    this.usersByEmail.clear();
    this.usersByUsername.clear();
    logger.info('User store cleared');
  }

  // Get store statistics
  getStats() {
    const totalUsers = this.users.size;
    const activeUsers = Array.from(this.users.values()).filter(user => user.profile.isActive).length;
    const lockedUsers = Array.from(this.users.values()).filter(user => user.isLocked()).length;

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      locked: lockedUsers
    };
  }
}

// Create singleton instance
const userStore = new UserStore();

module.exports = userStore;