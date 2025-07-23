/**
 * Reconnection Error Handler Utility
 * 
 * Provides intelligent error categorization and recovery strategies for
 * connection and reconnection failures. Integrates with ConnectionContext
 * and useReconnectionHandler for enhanced user experience.
 */

// Error severity levels
export const ERROR_SEVERITY = {
  TEMPORARY: 'temporary',
  RECOVERABLE: 'recoverable',
  PERMANENT: 'permanent',
  CRITICAL: 'critical'
};

// Error categories
export const ERROR_CATEGORIES = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  SESSION: 'session',
  SERVER: 'server',
  CLIENT: 'client',
  TIMEOUT: 'timeout',
  RATE_LIMIT: 'rate_limit',
  GAME_STATE: 'game_state'
};

// Recovery actions
export const RECOVERY_ACTIONS = {
  RETRY: 'retry',
  REFRESH: 'refresh',
  REJOIN: 'rejoin',
  CLEAR_SESSION: 'clear_session',
  WAIT: 'wait',
  MANUAL: 'manual',
  ESCALATE: 'escalate'
};

// Error patterns for classification
const ERROR_PATTERNS = {
  // Network-related errors
  network: [
    /network/i,
    /connection.*(refused|reset|timeout|lost)/i,
    /unreachable/i,
    /dns/i,
    /enotfound/i,
    /enetunreach/i,
    /econnrefused/i,
    /timeout/i
  ],
  
  // Authentication errors
  authentication: [
    /auth/i,
    /unauthorized/i,
    /invalid.*token/i,
    /expired.*token/i,
    /forbidden/i,
    /credential/i
  ],
  
  // Session-related errors
  session: [
    /session.*(invalid|expired|not.found)/i,
    /player.*already.*exists/i,
    /game.*not.*found/i,
    /invalid.*session/i
  ],
  
  // Server errors
  server: [
    /internal.*server/i,
    /service.*unavailable/i,
    /bad.*gateway/i,
    /gateway.*timeout/i,
    /server.*error/i,
    /50[0-9]/
  ],
  
  // Client errors
  client: [
    /bad.*request/i,
    /malformed/i,
    /invalid.*request/i,
    /40[0-9]/
  ],
  
  // Rate limiting
  rate_limit: [
    /rate.*limit/i,
    /too.*many.*requests/i,
    /429/
  ],
  
  // Game state errors
  game_state: [
    /game.*(finished|ended)/i,
    /turn.*(invalid|expired)/i,
    /move.*not.*allowed/i,
    /invalid.*game.*state/i
  ]
};

/**
 * Classify error based on message and context
 * 
 * @param {Error|string} error - Error object or message
 * @param {Object} context - Additional context about the error
 * @returns {Object} Error classification
 */
const classifyError = (error, context = {}) => {
  const errorMessage = error?.message || error?.toString() || '';
  const errorCode = error?.code || context.status || context.statusCode;
  
  // Check for specific error codes first
  if (errorCode) {
    if (errorCode >= 500) {
      return { category: ERROR_CATEGORIES.SERVER, severity: ERROR_SEVERITY.RECOVERABLE };
    }
    if (errorCode === 429) {
      return { category: ERROR_CATEGORIES.RATE_LIMIT, severity: ERROR_SEVERITY.TEMPORARY };
    }
    if (errorCode === 401 || errorCode === 403) {
      return { category: ERROR_CATEGORIES.AUTHENTICATION, severity: ERROR_SEVERITY.PERMANENT };
    }
    if (errorCode >= 400 && errorCode < 500) {
      return { category: ERROR_CATEGORIES.CLIENT, severity: ERROR_SEVERITY.PERMANENT };
    }
  }
  
  // Pattern-based classification
  for (const [category, patterns] of Object.entries(ERROR_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(errorMessage)) {
        let severity = ERROR_SEVERITY.RECOVERABLE;
        
        // Determine severity based on category and specific patterns
        switch (category) {
          case ERROR_CATEGORIES.NETWORK:
            severity = /timeout/i.test(errorMessage) ? ERROR_SEVERITY.TEMPORARY : ERROR_SEVERITY.RECOVERABLE;
            break;
          case ERROR_CATEGORIES.AUTHENTICATION:
            severity = ERROR_SEVERITY.PERMANENT;
            break;
          case ERROR_CATEGORIES.SESSION:
            severity = /expired/i.test(errorMessage) ? ERROR_SEVERITY.RECOVERABLE : ERROR_SEVERITY.PERMANENT;
            break;
          case ERROR_CATEGORIES.SERVER:
            severity = ERROR_SEVERITY.RECOVERABLE;
            break;
          case ERROR_CATEGORIES.CLIENT:
            severity = ERROR_SEVERITY.PERMANENT;
            break;
          case ERROR_CATEGORIES.RATE_LIMIT:
            severity = ERROR_SEVERITY.TEMPORARY;
            break;
          case ERROR_CATEGORIES.GAME_STATE:
            severity = /finished|ended/i.test(errorMessage) ? ERROR_SEVERITY.PERMANENT : ERROR_SEVERITY.RECOVERABLE;
            break;
          default:
            severity = ERROR_SEVERITY.RECOVERABLE;
        }
        
        return { category, severity };
      }
    }
  }
  
  // Default classification for unknown errors
  return {
    category: ERROR_CATEGORIES.CLIENT,
    severity: ERROR_SEVERITY.RECOVERABLE
  };
};

/**
 * Determine recovery strategy based on error classification
 * 
 * @param {Object} classification - Error classification
 * @param {Object} context - Additional context
 * @returns {Object} Recovery strategy
 */
const determineRecoveryStrategy = (classification, context = {}) => {
  const { category, severity } = classification;
  const { attemptCount = 0, maxAttempts = 3, gameState = null } = context;
  
  let action = RECOVERY_ACTIONS.RETRY;
  let delay = 1000; // Default 1 second delay
  let maxDelay = 30000; // Max 30 seconds
  let userMessage = '';
  let userAction = null;
  
  switch (severity) {
    case ERROR_SEVERITY.TEMPORARY:
      action = RECOVERY_ACTIONS.WAIT;
      delay = Math.min(1000 * Math.pow(2, attemptCount), 5000); // Max 5 seconds for temporary
      userMessage = 'Temporary connection issue. Retrying automatically...';
      break;
      
    case ERROR_SEVERITY.RECOVERABLE:
      if (attemptCount >= maxAttempts) {
        action = RECOVERY_ACTIONS.MANUAL;
        userMessage = 'Connection issues persist. Please check your network and try again.';
        userAction = 'refresh';
      } else {
        action = RECOVERY_ACTIONS.RETRY;
        delay = Math.min(1000 * Math.pow(2, attemptCount), maxDelay);
        userMessage = `Connection issue detected. Retrying in ${Math.round(delay / 1000)} seconds...`;
      }
      break;
      
    case ERROR_SEVERITY.PERMANENT:
      switch (category) {
        case ERROR_CATEGORIES.AUTHENTICATION:
          action = RECOVERY_ACTIONS.REFRESH;
          userMessage = 'Authentication expired. Please refresh the page to continue.';
          userAction = 'refresh';
          break;
          
        case ERROR_CATEGORIES.SESSION:
          action = RECOVERY_ACTIONS.REJOIN;
          userMessage = 'Session expired. You may need to rejoin the game.';
          userAction = 'rejoin';
          break;
          
        case ERROR_CATEGORIES.GAME_STATE:
          if (gameState?.gameState === 'finished') {
            action = RECOVERY_ACTIONS.CLEAR_SESSION;
            userMessage = 'Game has ended. Returning to main menu.';
            userAction = 'navigate_home';
          } else {
            action = RECOVERY_ACTIONS.REFRESH;
            userMessage = 'Game state error. Please refresh to rejoin.';
            userAction = 'refresh';
          }
          break;
          
        default:
          action = RECOVERY_ACTIONS.MANUAL;
          userMessage = 'A permanent error occurred. Please refresh the page.';
          userAction = 'refresh';
      }
      break;
      
    case ERROR_SEVERITY.CRITICAL:
      action = RECOVERY_ACTIONS.ESCALATE;
      userMessage = 'Critical error encountered. Please refresh the page or contact support.';
      userAction = 'refresh';
      break;
      
    default:
      action = RECOVERY_ACTIONS.RETRY;
      userMessage = 'Connection error. Retrying...';
  }
  
  return {
    action,
    delay,
    maxDelay,
    userMessage,
    userAction,
    shouldNotifyUser: severity !== ERROR_SEVERITY.TEMPORARY || attemptCount > 1
  };
};

/**
 * Generate user-friendly error messages
 * 
 * @param {Object} classification - Error classification
 * @param {Object} context - Additional context
 * @returns {Object} User messages
 */
const generateUserMessages = (classification, context = {}) => {
  const { category /* , severity */ } = classification;
  const { gameState = null, isInGame = false } = context;
  
  const messages = {
    title: 'Connection Issue',
    description: 'A connection error occurred.',
    action: 'Please try again.',
    icon: '⚠️'
  };
  
  switch (category) {
    case ERROR_CATEGORIES.NETWORK:
      messages.title = 'Network Error';
      messages.description = 'Unable to connect to the game server.';
      messages.action = 'Please check your internet connection and try again.';
      messages.icon = '🌐';
      break;
      
    case ERROR_CATEGORIES.AUTHENTICATION:
      messages.title = 'Authentication Error';
      messages.description = 'Your session has expired or is invalid.';
      messages.action = 'Please refresh the page to sign in again.';
      messages.icon = '🔐';
      break;
      
    case ERROR_CATEGORIES.SESSION:
      messages.title = 'Session Error';
      if (isInGame) {
        messages.description = 'Your game session is no longer valid.';
        messages.action = 'You may need to rejoin the game.';
      } else {
        messages.description = 'Session expired.';
        messages.action = 'Please start a new session.';
      }
      messages.icon = '🎮';
      break;
      
    case ERROR_CATEGORIES.SERVER:
      messages.title = 'Server Error';
      messages.description = 'The game server is experiencing issues.';
      messages.action = 'Please wait a moment and try again.';
      messages.icon = '🖥️';
      break;
      
    case ERROR_CATEGORIES.RATE_LIMIT:
      messages.title = 'Too Many Requests';
      messages.description = 'You are connecting too frequently.';
      messages.action = 'Please wait a moment before trying again.';
      messages.icon = '⏱️';
      break;
      
    case ERROR_CATEGORIES.GAME_STATE:
      messages.title = 'Game State Error';
      if (gameState?.gameState === 'finished') {
        messages.description = 'The game has ended.';
        messages.action = 'Returning to main menu.';
        messages.icon = '🏁';
      } else {
        messages.description = 'The game state is inconsistent.';
        messages.action = 'Please refresh to rejoin the game.';
        messages.icon = '🎮';
      }
      break;
      
    default:
      messages.title = 'Connection Error';
      messages.description = 'An unexpected error occurred.';
      messages.action = 'Please try again or refresh the page.';
      messages.icon = '❌';
  }
  
  return messages;
};

/**
 * Main error handling function
 * 
 * @param {Error|string} error - Error object or message
 * @param {Object} handlers - Handler callbacks
 * @param {Object} context - Additional context
 * @returns {Object} Error handling result
 */
export const handleReconnectionError = (error, handlers = {}, context = {}) => {
  console.log('🔍 Handling reconnection error:', error, 'Context:', context);
  
  const classification = classifyError(error, context);
  const strategy = determineRecoveryStrategy(classification, context);
  const userMessages = generateUserMessages(classification, context);
  
  const result = {
    classification,
    strategy,
    userMessages,
    error: error?.message || error?.toString() || 'Unknown error',
    timestamp: Date.now()
  };
  
  console.log('📊 Error analysis result:', result);
  
  // Execute appropriate handler callbacks
  const {
    onTemporaryError,
    onRecoverableError,
    onPermanentError,
    onCriticalError,
    onNetworkError,
    onAuthError,
    onSessionError,
    onServerError,
    onRateLimitError,
    onGameStateError
  } = handlers;
  
  // Severity-based handlers
  switch (classification.severity) {
    case ERROR_SEVERITY.TEMPORARY:
      if (onTemporaryError) onTemporaryError(result);
      break;
    case ERROR_SEVERITY.RECOVERABLE:
      if (onRecoverableError) onRecoverableError(result);
      break;
    case ERROR_SEVERITY.PERMANENT:
      if (onPermanentError) onPermanentError(result);
      break;
    case ERROR_SEVERITY.CRITICAL:
      if (onCriticalError) onCriticalError(result);
      break;
    default:
      console.warn('⚠️ Unknown error severity:', classification.severity);
      break;
  }
  
  // Category-based handlers
  switch (classification.category) {
    case ERROR_CATEGORIES.NETWORK:
      if (onNetworkError) onNetworkError(result);
      break;
    case ERROR_CATEGORIES.AUTHENTICATION:
      if (onAuthError) onAuthError(result);
      break;
    case ERROR_CATEGORIES.SESSION:
      if (onSessionError) onSessionError(result);
      break;
    case ERROR_CATEGORIES.SERVER:
      if (onServerError) onServerError(result);
      break;
    case ERROR_CATEGORIES.RATE_LIMIT:
      if (onRateLimitError) onRateLimitError(result);
      break;
    case ERROR_CATEGORIES.GAME_STATE:
      if (onGameStateError) onGameStateError(result);
      break;
    default:
      console.warn('⚠️ Unknown error category:', classification.category);
      break;
  }
  
  return result;
};

/**
 * Create a retry strategy with exponential backoff
 * 
 * @param {Object} options - Retry options
 * @returns {Object} Retry strategy
 */
export const createRetryStrategy = (options = {}) => {
  const {
    maxAttempts = 5,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    jitter = true
  } = options;
  
  let attemptCount = 0;
  
  const getNextDelay = () => {
    const delay = Math.min(baseDelay * Math.pow(backoffFactor, attemptCount), maxDelay);
    
    if (jitter) {
      // Add ±25% jitter to prevent thundering herd
      const jitterAmount = delay * 0.25;
      return delay + (Math.random() - 0.5) * 2 * jitterAmount;
    }
    
    return delay;
  };
  
  const shouldRetry = () => attemptCount < maxAttempts;
  
  const nextAttempt = () => {
    attemptCount++;
    return {
      attempt: attemptCount,
      delay: getNextDelay(),
      shouldRetry: shouldRetry()
    };
  };
  
  const reset = () => {
    attemptCount = 0;
  };
  
  return {
    nextAttempt,
    shouldRetry,
    reset,
    getCurrentAttempt: () => attemptCount,
    getMaxAttempts: () => maxAttempts
  };
};

/**
 * Utility to check if error is recoverable
 * 
 * @param {Error|string} error - Error to check
 * @param {Object} context - Additional context
 * @returns {boolean} True if error is recoverable
 */
export const isRecoverableError = (error, context = {}) => {
  const classification = classifyError(error, context);
  return classification.severity === ERROR_SEVERITY.TEMPORARY || 
         classification.severity === ERROR_SEVERITY.RECOVERABLE;
};

/**
 * Utility to get error description for logging
 * 
 * @param {Error|string} error - Error to describe
 * @param {Object} context - Additional context
 * @returns {string} Error description
 */
export const getErrorDescription = (error, context = {}) => {
  const classification = classifyError(error, context);
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  return `${classification.category}/${classification.severity}: ${errorMessage}`;
};

// Export constants for use in other modules
export {
  ERROR_PATTERNS,
  classifyError,
  determineRecoveryStrategy,
  generateUserMessages
};