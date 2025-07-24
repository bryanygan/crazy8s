/**
 * Centralized Timeout Configuration for Frontend
 * 
 * Synchronized with backend timeout optimizations to ensure
 * seamless client-server timeout coordination.
 * 
 * Backend Reference: backend/src/config/timeouts.js
 */

// Environment-based configuration with validation
const getEnvTimeout = (key, defaultValue, min = 1000, max = 300000) => {
  const value = process.env[key] ? parseInt(process.env[key], 10) : defaultValue;
  
  if (isNaN(value) || value < min || value > max) {
    console.warn(`⚠️ Invalid timeout value for ${key}: ${value}. Using default: ${defaultValue}`);
    return defaultValue;
  }
  
  return value;
};

// Socket timeout configurations (synchronized with backend)
export const SOCKET_TIMEOUTS = {
  // Connection timeouts - aligned with backend socket.js optimizations
  CONNECTION_TIMEOUT: getEnvTimeout('REACT_APP_SOCKET_CONNECTION_TIMEOUT', 30000), // 30s (up from 15s)
  PING_TIMEOUT: getEnvTimeout('REACT_APP_SOCKET_PING_TIMEOUT', 120000), // 120s (matches backend)
  PING_INTERVAL: getEnvTimeout('REACT_APP_SOCKET_PING_INTERVAL', 30000), // 30s (matches backend)
  UPGRADE_TIMEOUT: getEnvTimeout('REACT_APP_SOCKET_UPGRADE_TIMEOUT', 15000), // 15s (up from 10s)
  
  // Reconnection timeouts - enhanced for reliability
  RECONNECTION_DELAY: getEnvTimeout('REACT_APP_SOCKET_RECONNECTION_DELAY', 1000), // 1s initial
  RECONNECTION_DELAY_MAX: getEnvTimeout('REACT_APP_SOCKET_RECONNECTION_DELAY_MAX', 15000), // 15s max (up from 10s)
  MAX_RECONNECTION_ATTEMPTS: getEnvTimeout('REACT_APP_SOCKET_MAX_RECONNECTION_ATTEMPTS', 10, 1, 20), // 10 attempts (up from 8)
  
  // Event-specific timeouts
  GAME_JOIN_TIMEOUT: getEnvTimeout('REACT_APP_SOCKET_GAME_JOIN_TIMEOUT', 15000), // 15s
  GAME_REJOIN_TIMEOUT: getEnvTimeout('REACT_APP_SOCKET_GAME_REJOIN_TIMEOUT', 20000), // 20s (up from 10s)
  GAME_ACTION_TIMEOUT: getEnvTimeout('REACT_APP_SOCKET_GAME_ACTION_TIMEOUT', 10000), // 10s
  SESSION_VALIDATION_TIMEOUT: getEnvTimeout('REACT_APP_SOCKET_SESSION_VALIDATION_TIMEOUT', 8000), // 8s (up from 5s)
};

// API timeout configurations
export const API_TIMEOUTS = {
  // HTTP request timeouts
  DEFAULT_REQUEST_TIMEOUT: getEnvTimeout('REACT_APP_API_DEFAULT_TIMEOUT', 10000), // 10s default
  AUTH_REQUEST_TIMEOUT: getEnvTimeout('REACT_APP_API_AUTH_TIMEOUT', 15000), // 15s for auth
  UPLOAD_REQUEST_TIMEOUT: getEnvTimeout('REACT_APP_API_UPLOAD_TIMEOUT', 30000), // 30s for uploads
  
  // Retry configuration
  RETRY_ATTEMPTS: getEnvTimeout('REACT_APP_API_RETRY_ATTEMPTS', 3, 1, 10), // 3 retry attempts
  RETRY_DELAY_BASE: getEnvTimeout('REACT_APP_API_RETRY_DELAY_BASE', 1000), // 1s base delay
  RETRY_DELAY_MAX: getEnvTimeout('REACT_APP_API_RETRY_DELAY_MAX', 10000), // 10s max delay
  RETRY_BACKOFF_FACTOR: 2, // 2x exponential backoff
};

// Game-specific timeout configurations
export const GAME_TIMEOUTS = {
  // Turn timer configurations - adaptive based on backend settings
  TURN_TIMER_DEFAULT: getEnvTimeout('REACT_APP_GAME_TURN_TIMER_DEFAULT', 60, 15, 300), // 60s default
  TURN_TIMER_WARNING_THRESHOLD: getEnvTimeout('REACT_APP_GAME_TURN_TIMER_WARNING', 15, 5, 60), // 15s warning
  TURN_TIMER_PER_PLAYER_BONUS: getEnvTimeout('REACT_APP_GAME_TURN_TIMER_PER_PLAYER', 5, 0, 30), // 5s per player
  TURN_TIMER_MAX: getEnvTimeout('REACT_APP_GAME_TURN_TIMER_MAX', 180, 60, 600), // 3min max
  
  // Animation timeouts
  CARD_ANIMATION_DURATION: 300, // 300ms card animations
  STACK_ANIMATION_DURATION: 500, // 500ms stack animations
  TRANSITION_ANIMATION_DURATION: 250, // 250ms state transitions
  CONFETTI_ANIMATION_DURATION: 3000, // 3s confetti celebration
  
  // Game state timeouts
  GAME_START_TIMEOUT: getEnvTimeout('REACT_APP_GAME_START_TIMEOUT', 5000), // 5s game start
  ROUND_TRANSITION_TIMEOUT: getEnvTimeout('REACT_APP_GAME_ROUND_TRANSITION_TIMEOUT', 3000), // 3s round transitions
  ELIMINATION_DISPLAY_TIMEOUT: getEnvTimeout('REACT_APP_GAME_ELIMINATION_TIMEOUT', 4000), // 4s elimination display
};

// UI timeout configurations
export const UI_TIMEOUTS = {
  // Toast notifications - enhanced based on message importance
  TOAST_DEFAULT_DURATION: getEnvTimeout('REACT_APP_UI_TOAST_DEFAULT_DURATION', 4000), // 4s default
  TOAST_SUCCESS_DURATION: getEnvTimeout('REACT_APP_UI_TOAST_SUCCESS_DURATION', 3000), // 3s success
  TOAST_WARNING_DURATION: getEnvTimeout('REACT_APP_UI_TOAST_WARNING_DURATION', 6000), // 6s warning
  TOAST_ERROR_DURATION: getEnvTimeout('REACT_APP_UI_TOAST_ERROR_DURATION', 8000), // 8s error
  TOAST_INFO_DURATION: getEnvTimeout('REACT_APP_UI_TOAST_INFO_DURATION', 5000), // 5s info
  TOAST_MAX_CONCURRENT: 5, // Maximum 5 toasts
  
  // Loading states
  LOADING_MIN_DISPLAY_TIME: 500, // 500ms minimum loading display
  LOADING_SPINNER_DELAY: 200, // 200ms delay before showing spinner
  DEBOUNCE_INPUT_DELAY: 300, // 300ms input debouncing
  
  // Modal timeouts
  MODAL_FADE_DURATION: 250, // 250ms modal fade
  TOOLTIP_SHOW_DELAY: 800, // 800ms tooltip delay
  TOOLTIP_HIDE_DELAY: 200, // 200ms tooltip hide
};

// Session and persistence timeouts
export const SESSION_TIMEOUTS = {
  // Session management - aligned with backend and useAutoReconnection
  SESSION_EXPIRY_TIME: getEnvTimeout('REACT_APP_SESSION_EXPIRY_TIME', 1800000), // 30min (1800s)
  SESSION_CHECK_INTERVAL: getEnvTimeout('REACT_APP_SESSION_CHECK_INTERVAL', 60000), // 1min checks
  SESSION_RENEWAL_THRESHOLD: getEnvTimeout('REACT_APP_SESSION_RENEWAL_THRESHOLD', 300000), // 5min renewal
  
  // Auto-reconnection settings
  AUTO_RECONNECTION_TIMEOUT: getEnvTimeout('REACT_APP_AUTO_RECONNECTION_TIMEOUT', 20000), // 20s (up from 10s)
  AUTO_RECONNECTION_MAX_ATTEMPTS: getEnvTimeout('REACT_APP_AUTO_RECONNECTION_MAX_ATTEMPTS', 5, 1, 10), // 5 attempts (up from 3)
  AUTO_RECONNECTION_RETRY_DELAY: getEnvTimeout('REACT_APP_AUTO_RECONNECTION_RETRY_DELAY', 2000), // 2s retry delay
  
  // Cross-tab synchronization
  CROSS_TAB_SYNC_INTERVAL: getEnvTimeout('REACT_APP_CROSS_TAB_SYNC_INTERVAL', 60000), // 1min sync
  STORAGE_CLEANUP_INTERVAL: getEnvTimeout('REACT_APP_STORAGE_CLEANUP_INTERVAL', 300000), // 5min cleanup
};

// Connection quality-based timeout multipliers
export const CONNECTION_QUALITY_MULTIPLIERS = {
  EXCELLENT: 0.8, // Reduce timeouts by 20% for excellent connections
  GOOD: 1.0, // Standard timeouts for good connections
  FAIR: 1.4, // Increase timeouts by 40% for fair connections
  POOR: 2.0, // Double timeouts for poor connections
  UNKNOWN: 1.2, // 20% increase for unknown quality
};

// Timeout validation and boundaries
export const TIMEOUT_BOUNDARIES = {
  MIN_SOCKET_TIMEOUT: 1000, // 1s minimum
  MAX_SOCKET_TIMEOUT: 300000, // 5min maximum
  MIN_API_TIMEOUT: 1000, // 1s minimum
  MAX_API_TIMEOUT: 60000, // 1min maximum
  MIN_GAME_TIMEOUT: 5000, // 5s minimum
  MAX_GAME_TIMEOUT: 600000, // 10min maximum
};

// Adaptive timeout calculation utilities
export const calculateAdaptiveTimeout = (baseTimeout, options = {}) => {
  const {
    connectionQuality = 'UNKNOWN',
    playerCount = 1,
    gameComplexity = 'SIMPLE',
    isRetry = false,
    retryAttempt = 0
  } = options;
  
  let adaptiveTimeout = baseTimeout;
  
  // Apply connection quality multiplier
  const qualityMultiplier = CONNECTION_QUALITY_MULTIPLIERS[connectionQuality] || CONNECTION_QUALITY_MULTIPLIERS.UNKNOWN;
  adaptiveTimeout *= qualityMultiplier;
  
  // Apply player count scaling (for game operations)
  if (playerCount > 4) {
    const playerMultiplier = 1 + ((playerCount - 4) * 0.1); // 10% per additional player over 4
    adaptiveTimeout *= Math.min(playerMultiplier, 2.0); // Cap at 2x
  }
  
  // Apply game complexity scaling
  const complexityMultipliers = {
    SIMPLE: 1.0,
    MODERATE: 1.2,
    COMPLEX: 1.5,
    VERY_COMPLEX: 2.0
  };
  adaptiveTimeout *= complexityMultipliers[gameComplexity] || 1.0;
  
  // Apply retry scaling (exponential backoff)
  if (isRetry && retryAttempt > 0) {
    const retryMultiplier = Math.pow(2, Math.min(retryAttempt, 4)); // Cap at 16x
    adaptiveTimeout *= retryMultiplier;
  }
  
  // Ensure timeout stays within boundaries
  return Math.max(
    TIMEOUT_BOUNDARIES.MIN_SOCKET_TIMEOUT,
    Math.min(adaptiveTimeout, TIMEOUT_BOUNDARIES.MAX_SOCKET_TIMEOUT)
  );
};

// Timeout configuration validation
export const validateTimeoutConfig = () => {
  const errors = [];
  
  // Validate Socket.IO timeout relationships
  if (SOCKET_TIMEOUTS.PING_TIMEOUT <= SOCKET_TIMEOUTS.PING_INTERVAL) {
    errors.push('PING_TIMEOUT must be greater than PING_INTERVAL');
  }
  
  if (SOCKET_TIMEOUTS.CONNECTION_TIMEOUT >= SOCKET_TIMEOUTS.PING_TIMEOUT) {
    errors.push('CONNECTION_TIMEOUT should be less than PING_TIMEOUT');
  }
  
  // Validate game timer relationships
  if (GAME_TIMEOUTS.TURN_TIMER_WARNING_THRESHOLD >= GAME_TIMEOUTS.TURN_TIMER_DEFAULT) {
    errors.push('TURN_TIMER_WARNING_THRESHOLD must be less than TURN_TIMER_DEFAULT');
  }
  
  // Validate session timeout relationships
  if (SESSION_TIMEOUTS.SESSION_RENEWAL_THRESHOLD >= SESSION_TIMEOUTS.SESSION_EXPIRY_TIME) {
    errors.push('SESSION_RENEWAL_THRESHOLD must be less than SESSION_EXPIRY_TIME');
  }
  
  if (errors.length > 0) {
    console.error('❌ Timeout configuration validation errors:');
    errors.forEach(error => console.error(`   • ${error}`));
    throw new Error(`Invalid timeout configuration: ${errors.join('; ')}`);
  }
  
  console.log('✅ Timeout configuration validation passed');
  return true;
};

// Initialize and validate configuration on module load
try {
  validateTimeoutConfig();
  console.log('🕐 Frontend timeout configuration initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize timeout configuration:', error.message);
}

// Export all timeout configurations
const timeoutConfig = {
  SOCKET_TIMEOUTS,
  API_TIMEOUTS,
  GAME_TIMEOUTS,
  UI_TIMEOUTS,
  SESSION_TIMEOUTS,
  CONNECTION_QUALITY_MULTIPLIERS,
  TIMEOUT_BOUNDARIES,
  calculateAdaptiveTimeout,
  validateTimeoutConfig
};

export default timeoutConfig;