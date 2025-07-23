/**
 * Session Persistence Utility
 * 
 * Provides cross-browser storage for session data including:
 * - Backend session IDs
 * - Game state snapshots
 * - Player reconnection context
 * - Activity timestamps
 * 
 * Integrates with both localStorage (persistent) and sessionStorage (tab-specific)
 */

// Storage keys
const STORAGE_KEYS = {
  SESSION_ID: 'crazy8s_session_id',
  GAME_SESSION: 'crazy8s_game_session',
  RECONNECTION_CONTEXT: 'crazy8s_reconnection_context',
  LAST_ACTIVITY: 'crazy8s_last_activity',
  SESSION_METADATA: 'crazy8s_session_metadata'
};

// Session expiry duration (30 minutes, matching backend)
const SESSION_EXPIRY_MS = 30 * 60 * 1000;

/**
 * Storage utilities
 */
const getStorageItem = (key, useSessionStorage = false) => {
  try {
    const storage = useSessionStorage ? sessionStorage : localStorage;
    const item = storage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Failed to get storage item ${key}:`, error);
    return null;
  }
};

const setStorageItem = (key, value, useSessionStorage = false) => {
  try {
    const storage = useSessionStorage ? sessionStorage : localStorage;
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to set storage item ${key}:`, error);
    return false;
  }
};

const removeStorageItem = (key, useSessionStorage = false) => {
  try {
    const storage = useSessionStorage ? sessionStorage : localStorage;
    storage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove storage item ${key}:`, error);
    return false;
  }
};

/**
 * Session data validation
 */
const isSessionDataValid = (sessionData) => {
  if (!sessionData || typeof sessionData !== 'object') return false;
  
  const now = Date.now();
  const lastActivity = sessionData.lastActivity || 0;
  const isExpired = (now - lastActivity) > SESSION_EXPIRY_MS;
  
  if (isExpired) {
    console.log('🕒 Session data expired, age:', Math.round((now - lastActivity) / 1000 / 60), 'minutes');
    return false;
  }
  
  return true;
};

/**
 * Load session data from storage
 * 
 * @param {boolean} useSessionStorage - Use sessionStorage instead of localStorage
 * @returns {Object|null} Session data or null if not found/expired
 */
export const loadSessionData = (useSessionStorage = false) => {
  console.log('🔍 Loading session data from', useSessionStorage ? 'sessionStorage' : 'localStorage');
  
  try {
    const sessionData = getStorageItem(STORAGE_KEYS.GAME_SESSION, useSessionStorage);
    
    if (!sessionData) {
      console.log('ℹ️ No session data found in storage');
      return null;
    }
    
    if (!isSessionDataValid(sessionData)) {
      console.log('❌ Session data invalid or expired, clearing...');
      clearSessionData(useSessionStorage);
      return null;
    }
    
    console.log('✅ Valid session data loaded:', {
      gameId: sessionData.gameId,
      playerId: sessionData.playerId,
      gameState: sessionData.gameState,
      age: Math.round((Date.now() - sessionData.lastActivity) / 1000 / 60)
    });
    
    return sessionData;
  } catch (error) {
    console.error('❌ Failed to load session data:', error);
    return null;
  }
};

/**
 * Save session data to storage
 * 
 * @param {Object} sessionData - Session data to save
 * @param {boolean} useSessionStorage - Use sessionStorage instead of localStorage
 * @returns {boolean} Success status
 */
export const saveSessionData = (sessionData, useSessionStorage = false) => {
  if (!sessionData || typeof sessionData !== 'object') {
    console.error('❌ Invalid session data provided for saving');
    return false;
  }
  
  console.log('💾 Saving session data to', useSessionStorage ? 'sessionStorage' : 'localStorage');
  
  try {
    const now = Date.now();
    const enrichedSessionData = {
      ...sessionData,
      lastActivity: now,
      savedAt: now,
      version: '1.0.0'
    };
    
    // Save main session data
    const success = setStorageItem(STORAGE_KEYS.GAME_SESSION, enrichedSessionData, useSessionStorage);
    
    if (success) {
      // Save backend session ID separately for quick access
      if (sessionData.sessionId) {
        setStorageItem(STORAGE_KEYS.SESSION_ID, sessionData.sessionId, useSessionStorage);
      }
      
      // Update activity timestamp
      setStorageItem(STORAGE_KEYS.LAST_ACTIVITY, now, useSessionStorage);
      
      // Save metadata
      const metadata = {
        playerId: sessionData.playerId,
        gameId: sessionData.gameId,
        lastSaved: now,
        storageType: useSessionStorage ? 'session' : 'local'
      };
      setStorageItem(STORAGE_KEYS.SESSION_METADATA, metadata, useSessionStorage);
      
      console.log('✅ Session data saved successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Failed to save session data:', error);
    return false;
  }
};

/**
 * Clear session data from storage
 * 
 * @param {boolean} useSessionStorage - Use sessionStorage instead of localStorage
 * @returns {boolean} Success status
 */
export const clearSessionData = (useSessionStorage = false) => {
  console.log('🗑️ Clearing session data from', useSessionStorage ? 'sessionStorage' : 'localStorage');
  
  try {
    let cleared = 0;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      if (removeStorageItem(key, useSessionStorage)) {
        cleared++;
      }
    });
    
    console.log(`✅ Cleared ${cleared} session storage items`);
    return true;
  } catch (error) {
    console.error('❌ Failed to clear session data:', error);
    return false;
  }
};

/**
 * Get backend session ID
 * 
 * @param {boolean} useSessionStorage - Use sessionStorage instead of localStorage
 * @returns {string|null} Session ID or null if not found
 */
export const getSessionId = (useSessionStorage = false) => {
  return getStorageItem(STORAGE_KEYS.SESSION_ID, useSessionStorage);
};

/**
 * Save backend session ID
 * 
 * @param {string} sessionId - Backend session ID
 * @param {boolean} useSessionStorage - Use sessionStorage instead of localStorage
 * @returns {boolean} Success status
 */
export const saveSessionId = (sessionId, useSessionStorage = false) => {
  if (!sessionId || typeof sessionId !== 'string') {
    console.error('❌ Invalid session ID provided');
    return false;
  }
  
  return setStorageItem(STORAGE_KEYS.SESSION_ID, sessionId, useSessionStorage);
};

/**
 * Get reconnection context
 * 
 * @param {boolean} useSessionStorage - Use sessionStorage instead of localStorage
 * @returns {Object|null} Reconnection context or null if not found
 */
export const getReconnectionContext = (useSessionStorage = false) => {
  const context = getStorageItem(STORAGE_KEYS.RECONNECTION_CONTEXT, useSessionStorage);
  
  if (context && isSessionDataValid(context)) {
    return context;
  }
  
  return null;
};

/**
 * Save reconnection context
 * 
 * @param {Object} context - Reconnection context data
 * @param {boolean} useSessionStorage - Use sessionStorage instead of localStorage
 * @returns {boolean} Success status
 */
export const saveReconnectionContext = (context, useSessionStorage = false) => {
  if (!context || typeof context !== 'object') {
    console.error('❌ Invalid reconnection context provided');
    return false;
  }
  
  const enrichedContext = {
    ...context,
    lastActivity: Date.now(),
    contextType: 'reconnection'
  };
  
  return setStorageItem(STORAGE_KEYS.RECONNECTION_CONTEXT, enrichedContext, useSessionStorage);
};

/**
 * Update activity timestamp
 * 
 * @param {boolean} useSessionStorage - Use sessionStorage instead of localStorage
 * @returns {boolean} Success status
 */
export const updateActivity = (useSessionStorage = false) => {
  return setStorageItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now(), useSessionStorage);
};

/**
 * Setup automatic session persistence with change listeners
 * 
 * @param {Function} callback - Callback for session changes
 * @param {Object} options - Configuration options
 * @returns {Function} Cleanup function
 */
export const setupSessionPersistence = (callback, options = {}) => {
  const {
    interval = 30000, // 30 seconds
    useSessionStorage = false,
    enableCrossTabSync = true
  } = options;
  
  console.log('🔧 Setting up session persistence with options:', options);
  
  const intervals = [];
  const eventListeners = [];
  
  // Activity tracking interval
  const activityInterval = setInterval(() => {
    updateActivity(useSessionStorage);
  }, interval);
  intervals.push(activityInterval);
  
  // Cross-tab synchronization
  if (enableCrossTabSync && !useSessionStorage) {
    const handleStorageChange = (event) => {
      if (Object.values(STORAGE_KEYS).includes(event.key)) {
        console.log('🔄 Cross-tab session change detected:', event.key);
        
        try {
          const sessionData = loadSessionData(useSessionStorage);
          if (callback && typeof callback === 'function') {
            callback({
              type: 'storage_change',
              key: event.key,
              sessionData,
              newValue: event.newValue,
              oldValue: event.oldValue
            });
          }
        } catch (error) {
          console.error('❌ Error handling cross-tab session change:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    eventListeners.push({ event: 'storage', handler: handleStorageChange });
  }
  
  // Page visibility change handler
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      updateActivity(useSessionStorage);
      
      // Check if session is still valid when page becomes visible
      const sessionData = loadSessionData(useSessionStorage);
      if (callback && typeof callback === 'function') {
        callback({
          type: 'visibility_change',
          visible: true,
          sessionData
        });
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  eventListeners.push({ event: 'visibilitychange', handler: handleVisibilityChange });
  
  // Page unload handler for cleanup
  const handleBeforeUnload = () => {
    // Save final activity timestamp
    updateActivity(useSessionStorage);
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  eventListeners.push({ event: 'beforeunload', handler: handleBeforeUnload });
  
  console.log('✅ Session persistence setup complete');
  
  // Return cleanup function
  return () => {
    console.log('🧹 Cleaning up session persistence');
    
    // Clear intervals
    intervals.forEach(intervalId => clearInterval(intervalId));
    
    // Remove event listeners
    eventListeners.forEach(({ event, handler }) => {
      window.removeEventListener(event, handler);
      document.removeEventListener(event, handler);
    });
    
    console.log('✅ Session persistence cleanup complete');
  };
};

/**
 * Get session metadata
 * 
 * @param {boolean} useSessionStorage - Use sessionStorage instead of localStorage
 * @returns {Object|null} Session metadata or null if not found
 */
export const getSessionMetadata = (useSessionStorage = false) => {
  return getStorageItem(STORAGE_KEYS.SESSION_METADATA, useSessionStorage);
};

/**
 * Check if session exists and is valid
 * 
 * @param {boolean} useSessionStorage - Use sessionStorage instead of localStorage
 * @returns {boolean} True if valid session exists
 */
export const hasValidSession = (useSessionStorage = false) => {
  const sessionData = loadSessionData(useSessionStorage);
  return sessionData !== null;
};

/**
 * Migrate session data between storage types
 * 
 * @param {boolean} fromSessionStorage - Source storage type
 * @param {boolean} toSessionStorage - Target storage type
 * @returns {boolean} Success status
 */
export const migrateSessionData = (fromSessionStorage = false, toSessionStorage = true) => {
  console.log(`🔄 Migrating session data from ${fromSessionStorage ? 'sessionStorage' : 'localStorage'} to ${toSessionStorage ? 'sessionStorage' : 'localStorage'}`);
  
  try {
    const sessionData = loadSessionData(fromSessionStorage);
    
    if (!sessionData) {
      console.log('ℹ️ No session data to migrate');
      return true;
    }
    
    const success = saveSessionData(sessionData, toSessionStorage);
    
    if (success) {
      clearSessionData(fromSessionStorage);
      console.log('✅ Session data migrated successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Failed to migrate session data:', error);
    return false;
  }
};

/**
 * Debug utility to inspect current session state
 * 
 * @returns {Object} Debug information
 */
export const debugSessionState = () => {
  const localData = loadSessionData(false);
  const sessionData = loadSessionData(true);
  const metadata = getSessionMetadata(false);
  const sessionMetadata = getSessionMetadata(true);
  
  const debug = {
    localStorage: {
      sessionData: localData,
      metadata,
      hasValidSession: hasValidSession(false)
    },
    sessionStorage: {
      sessionData,
      metadata: sessionMetadata,
      hasValidSession: hasValidSession(true)
    },
    keys: STORAGE_KEYS,
    expiryMs: SESSION_EXPIRY_MS
  };
  
  console.table(debug);
  return debug;
};

// Export storage keys for testing
export { STORAGE_KEYS, SESSION_EXPIRY_MS };