/**
 * Centralized Timeout Configuration Module
 * 
 * Manages all timeout settings for the Crazy 8's game backend.
 * Optimized for 8-player games with complex card stacking scenarios.
 */

const logger = require('../utils/logger');

/**
 * Base timeout configurations with environment variable overrides
 */
const TIMEOUT_CONFIG = {
  // Socket.IO Configuration
  socket: {
    // Increased from 60s to 120s to prevent timeouts during complex 8-player games
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT) || 120000,
    
    // Increased from 25s to 30s to match frontend and reduce ping frequency
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL) || 30000,
    
    // Connection timeout for initial socket connection
    connectionTimeout: parseInt(process.env.SOCKET_CONNECTION_TIMEOUT) || 30000,
    
    // Upgrade timeout for WebSocket transport upgrade
    upgradeTimeout: parseInt(process.env.SOCKET_UPGRADE_TIMEOUT) || 15000,
    
    // Disconnection grace period to prevent false reconnection notifications
    disconnectionGracePeriod: parseInt(process.env.SOCKET_DISCONNECTION_GRACE) || 5000
  },

  // Database Configuration
  database: {
    // PostgreSQL timeouts
    postgresql: {
      // Increased from 30s to 60s for complex 8-player game queries
      queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 60000,
      
      // Increased from 30s to 45s to handle connection pool pressure
      acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 45000,
      
      // Increased from 10s to 30s to reduce connection churn
      idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      
      // Connection timeout for initial database connection
      connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT) || 20000,
      
      // Timeout for transactions that are idle
      idleInTransactionTimeout: parseInt(process.env.DB_IDLE_IN_TRANSACTION_TIMEOUT) || 45000,
      
      // Eviction timeout for removing old connections
      evictTimeout: parseInt(process.env.DB_EVICT_TIMEOUT) || 2000
    },
    
    // MongoDB timeouts
    mongodb: {
      serverSelectionTimeout: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT) || 10000,
      socketTimeout: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 60000,
      connectTimeout: parseInt(process.env.MONGODB_CONNECT_TIMEOUT) || 15000,
      maxIdleTime: parseInt(process.env.MONGODB_MAX_IDLE_TIME) || 45000,
      heartbeatFrequency: parseInt(process.env.MONGODB_HEARTBEAT_FREQUENCY) || 10000
    }
  },

  // Game-specific timeouts
  game: {
    // Base turn timeout in seconds
    baseTurnTimeout: parseInt(process.env.GAME_TIMER_DEFAULT) || 60,
    
    // Additional time per player for complex games (in seconds)
    turnTimeoutPerPlayer: parseInt(process.env.GAME_TIMER_PER_PLAYER) || 5,
    
    // Maximum turn timeout (in seconds)
    maxTurnTimeout: parseInt(process.env.GAME_MAX_TIMER) || 180,
    
    // Minimum turn timeout (in seconds)
    minTurnTimeout: parseInt(process.env.GAME_MIN_TIMER) || 15,
    
    // Warning threshold before turn timeout (in seconds)
    turnWarningThreshold: parseInt(process.env.GAME_TIMER_WARNING) || 10,
    
    // Card action throttling (in milliseconds)
    actionThrottle: parseInt(process.env.GAME_ACTION_THROTTLE) || 500,
    
    // Skip turn throttling (in milliseconds)
    skipThrottle: parseInt(process.env.GAME_SKIP_THROTTLE) || 1000,
    
    // Card stacking throttling for rapid play (in milliseconds)
    stackingThrottle: parseInt(process.env.GAME_STACKING_THROTTLE) || 250
  },

  // Session management timeouts
  session: {
    // Session expiration time (30 minutes default)
    timeout: parseInt(process.env.SESSION_TIMEOUT) || 30 * 60 * 1000,
    
    // Session validation timeout
    validationTimeout: parseInt(process.env.SESSION_VALIDATION_TIMEOUT) || 10000,
    
    // Session cleanup interval (5 minutes instead of 1 minute)
    checkInterval: parseInt(process.env.SESSION_CHECK_INTERVAL) || 5 * 60 * 1000,
    
    // Session cleanup frequency (every 10 minutes)
    cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL) || 10 * 60 * 1000
  },

  // Reconnection timeouts
  reconnection: {
    // Initial reconnection delay
    initialDelay: parseInt(process.env.RECONNECTION_INITIAL_DELAY) || 2000,
    
    // Maximum reconnection delay
    maxDelay: parseInt(process.env.RECONNECTION_MAX_DELAY) || 30000,
    
    // Maximum reconnection attempts
    maxAttempts: parseInt(process.env.RECONNECTION_MAX_ATTEMPTS) || 5,
    
    // Backoff multiplier for exponential backoff
    backoffMultiplier: parseFloat(process.env.RECONNECTION_BACKOFF_MULTIPLIER) || 1.5,
    
    // Auto-reconnection timeout
    autoReconnectionTimeout: parseInt(process.env.AUTO_RECONNECTION_TIMEOUT) || 15000,
    
    // Manual reconnection timeout
    manualReconnectionTimeout: parseInt(process.env.MANUAL_RECONNECTION_TIMEOUT) || 10000
  },

  // Network quality and adaptive timeouts
  network: {
    // Poor network quality multiplier
    poorNetworkMultiplier: parseFloat(process.env.NETWORK_POOR_MULTIPLIER) || 1.5,
    
    // Ping threshold for poor network detection (in ms)
    poorNetworkThreshold: parseInt(process.env.NETWORK_POOR_THRESHOLD) || 200,
    
    // Network quality check interval
    qualityCheckInterval: parseInt(process.env.NETWORK_QUALITY_CHECK_INTERVAL) || 30000
  }
};

/**
 * Get timeout configuration for a specific category
 * @param {string} category - The timeout category (socket, database, game, etc.)
 * @param {string} subcategory - Optional subcategory
 * @returns {Object|number} Timeout configuration
 */
function getTimeout(category, subcategory = null) {
  if (!TIMEOUT_CONFIG[category]) {
    logger.warn(`Invalid timeout category: ${category}`);
    return null;
  }

  if (subcategory) {
    if (!TIMEOUT_CONFIG[category][subcategory]) {
      logger.warn(`Invalid timeout subcategory: ${category}.${subcategory}`);
      return null;
    }
    return TIMEOUT_CONFIG[category][subcategory];
  }

  return TIMEOUT_CONFIG[category];
}

/**
 * Calculate adaptive turn timeout based on player count and game complexity
 * @param {number} playerCount - Number of players in the game
 * @param {Object} gameState - Current game state for complexity analysis
 * @returns {number} Timeout in milliseconds
 */
function calculateAdaptiveTurnTimeout(playerCount, gameState = {}) {
  const baseTimeout = TIMEOUT_CONFIG.game.baseTurnTimeout * 1000; // Convert to ms
  const perPlayerTimeout = TIMEOUT_CONFIG.game.turnTimeoutPerPlayer * 1000;
  const maxTimeout = TIMEOUT_CONFIG.game.maxTurnTimeout * 1000;
  
  // Base calculation: base + (players * per-player-time)
  let adaptiveTimeout = baseTimeout + (playerCount * perPlayerTimeout);
  
  // Adjust for game complexity
  if (gameState.stackedCards && gameState.stackedCards.length > 3) {
    // Add extra time for complex stacking scenarios
    adaptiveTimeout += Math.min(gameState.stackedCards.length * 2000, 15000);
  }
  
  if (gameState.activeEffects && gameState.activeEffects.length > 0) {
    // Add extra time for active card effects
    adaptiveTimeout += gameState.activeEffects.length * 3000;
  }
  
  // Ensure we don't exceed maximum timeout
  adaptiveTimeout = Math.min(adaptiveTimeout, maxTimeout);
  
  // Ensure we don't go below minimum timeout
  const minTimeout = TIMEOUT_CONFIG.game.minTurnTimeout * 1000;
  adaptiveTimeout = Math.max(adaptiveTimeout, minTimeout);
  
  return adaptiveTimeout;
}

/**
 * Calculate adaptive database timeout based on operation complexity
 * @param {string} operation - Database operation type
 * @param {number} playerCount - Number of players affected
 * @param {Object} options - Additional options
 * @returns {number} Timeout in milliseconds
 */
function calculateAdaptiveDbTimeout(operation, playerCount = 1, options = {}) {
  const baseTimeout = TIMEOUT_CONFIG.database.postgresql.queryTimeout;
  
  // Complexity multipliers for different operations
  const operationMultipliers = {
    'simple_select': 1.0,
    'complex_join': 1.5,
    'game_state_update': 2.0,
    'card_validation': 1.2,
    'player_statistics': 1.8,
    'tournament_calculation': 3.0
  };
  
  const multiplier = operationMultipliers[operation] || 1.0;
  const playerMultiplier = 1 + (playerCount - 1) * 0.1; // 10% per additional player
  
  let adaptiveTimeout = baseTimeout * multiplier * playerMultiplier;
  
  // Add extra time for high-complexity operations
  if (options.highComplexity) {
    adaptiveTimeout *= 1.5;
  }
  
  // Cap at 5 minutes for any operation
  return Math.min(adaptiveTimeout, 5 * 60 * 1000);
}

/**
 * Apply network quality adjustments to timeouts
 * @param {number} timeout - Base timeout value
 * @param {string} networkQuality - Network quality ('good', 'fair', 'poor')
 * @returns {number} Adjusted timeout
 */
function applyNetworkQualityAdjustment(timeout, networkQuality) {
  switch (networkQuality) {
    case 'poor':
      return Math.floor(timeout * TIMEOUT_CONFIG.network.poorNetworkMultiplier);
    case 'fair':
      return Math.floor(timeout * 1.2);
    case 'good':
    default:
      return timeout;
  }
}

/**
 * Validate timeout configuration on startup
 */
function validateTimeoutConfig() {
  const errors = [];
  const warnings = [];
  
  // Check for potential timeout conflicts
  if (TIMEOUT_CONFIG.socket.pingTimeout <= TIMEOUT_CONFIG.socket.pingInterval) {
    errors.push('Socket pingTimeout must be greater than pingInterval');
  }
  
  if (TIMEOUT_CONFIG.game.maxTurnTimeout <= TIMEOUT_CONFIG.game.minTurnTimeout) {
    errors.push('Game maxTurnTimeout must be greater than minTurnTimeout');
  }
  
  if (TIMEOUT_CONFIG.database.postgresql.acquireTimeout <= TIMEOUT_CONFIG.database.postgresql.queryTimeout) {
    warnings.push('Database acquireTimeout should be greater than queryTimeout');
  }
  
  // Log validation results
  if (errors.length > 0) {
    logger.error('Timeout configuration errors:', errors);
    throw new Error(`Invalid timeout configuration: ${errors.join(', ')}`);
  }
  
  if (warnings.length > 0) {
    logger.warn('Timeout configuration warnings:', warnings);
  }
  
  logger.info('Timeout configuration validated successfully');
}

/**
 * Get a summary of current timeout configurations
 */
function getTimeoutSummary() {
  return {
    socket: {
      pingTimeout: `${TIMEOUT_CONFIG.socket.pingTimeout / 1000}s`,
      pingInterval: `${TIMEOUT_CONFIG.socket.pingInterval / 1000}s`,
      connectionTimeout: `${TIMEOUT_CONFIG.socket.connectionTimeout / 1000}s`
    },
    database: {
      queryTimeout: `${TIMEOUT_CONFIG.database.postgresql.queryTimeout / 1000}s`,
      acquireTimeout: `${TIMEOUT_CONFIG.database.postgresql.acquireTimeout / 1000}s`,
      idleTimeout: `${TIMEOUT_CONFIG.database.postgresql.idleTimeout / 1000}s`
    },
    game: {
      baseTurnTimeout: `${TIMEOUT_CONFIG.game.baseTurnTimeout}s`,
      maxTurnTimeout: `${TIMEOUT_CONFIG.game.maxTurnTimeout}s`,
      actionThrottle: `${TIMEOUT_CONFIG.game.actionThrottle}ms`
    },
    session: {
      timeout: `${TIMEOUT_CONFIG.session.timeout / (60 * 1000)}min`,
      checkInterval: `${TIMEOUT_CONFIG.session.checkInterval / (60 * 1000)}min`
    }
  };
}

module.exports = {
  TIMEOUT_CONFIG,
  getTimeout,
  calculateAdaptiveTurnTimeout,
  calculateAdaptiveDbTimeout,
  applyNetworkQualityAdjustment,
  validateTimeoutConfig,
  getTimeoutSummary
};