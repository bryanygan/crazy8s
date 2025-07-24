/**
 * useAutoReconnection Hook
 * 
 * Provides intelligent background reconnection capabilities with:
 * - Automatic session restoration from localStorage/sessionStorage
 * - Smart reconnection timing based on error patterns
 * - Connection quality monitoring
 * - Cross-tab session synchronization
 * - Game state-aware reconnection logic
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useConnection } from '../contexts/ConnectionContext';
import { useAuth } from '../contexts/AuthContext';
import { SESSION_TIMEOUTS } from '../config/timeouts';
// calculateAdaptiveTimeout imported for future adaptive timeout features
import { 
  loadSessionData, 
  saveSessionData, 
  clearSessionData, 
  setupSessionPersistence,
  hasValidSession 
} from '../utils/sessionPersistence';
import { 
  handleReconnectionError, 
  createRetryStrategy,
  isRecoverableError 
} from '../utils/reconnectionErrorHandler';

// Reconnection states
const RECONNECTION_STATES = {
  IDLE: 'idle',
  CHECKING: 'checking',
  CONNECTING: 'connecting',
  REJOINING: 'rejoining',
  SUCCESS: 'success',
  ERROR: 'error',
  TIMEOUT: 'timeout',
  DISABLED: 'disabled'
};

// Configuration constants (synchronized with centralized config)
const RECONNECTION_TIMEOUT = SESSION_TIMEOUTS.AUTO_RECONNECTION_TIMEOUT; // 20s (up from 10s)
const SESSION_CHECK_INTERVAL = SESSION_TIMEOUTS.SESSION_CHECK_INTERVAL; // 1 minute
const MAX_RECONNECTION_ATTEMPTS = SESSION_TIMEOUTS.AUTO_RECONNECTION_MAX_ATTEMPTS; // 5 (up from 3)

/**
 * Auto-reconnection hook
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Auto-reconnection state and controls
 */
const useAutoReconnection = (options = {}) => {
  const {
    gameState,
    setGameState,
    playerId,
    setPlayerId,
    playerName,
    setPlayerName,
    gameId,
    setGameId,
    addToast,
    enableAutoReconnection = true,
    enableSessionPersistence = true,
    useSessionStorage = false,
    maxAttempts = MAX_RECONNECTION_ATTEMPTS,
    reconnectionTimeoutMs = RECONNECTION_TIMEOUT
  } = options;

  // Contexts  
  const { /* socket, isConnected, */ connectAsGuest, connectWithAuth } = useConnection();
  const { isAuthenticated, token } = useAuth();

  // State
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [reconnectionStatus, setReconnectionStatus] = useState(RECONNECTION_STATES.IDLE);
  const [reconnectionProgress, setReconnectionProgress] = useState(0);
  const [reconnectionError, setReconnectionError] = useState(null);

  // Refs for managing state and preventing multiple reconnections
  const reconnectionInProgress = useRef(false);
  const retryStrategy = useRef(createRetryStrategy({ maxAttempts }));
  const sessionPersistenceCleanup = useRef(null);
  const reconnectionTimeoutRef = useRef(null);
  const sessionCheckInterval = useRef(null);

  /**
   * Save current session data
   */
  const saveCurrentSession = useCallback(() => {
    if (!enableSessionPersistence || !gameState || !playerId) return;

    const sessionData = {
      gameId: gameState.gameId || gameId,
      playerId,
      playerName,
      gameState: gameState.gameState,
      playerCount: gameState.players?.length || 0,
      userType: isAuthenticated ? 'authenticated' : 'guest',
      lastSaved: Date.now()
    };

    saveSessionData(sessionData, useSessionStorage);
    console.log('💾 Session data saved:', sessionData);
  }, [gameState, playerId, playerName, gameId, isAuthenticated, enableSessionPersistence, useSessionStorage]);

  /**
   * Clear current session data
   */
  const clearCurrentSession = useCallback(() => {
    if (!enableSessionPersistence) return;

    clearSessionData(useSessionStorage);
    setSessionRestored(false);
    console.log('🗑️ Session data cleared');
  }, [enableSessionPersistence, useSessionStorage]);

  /**
   * Check for existing session and attempt reconnection
   */
  const checkAndReconnect = useCallback(async () => {
    if (reconnectionInProgress.current || !enableAutoReconnection) {
      console.log('⚠️ Reconnection already in progress or disabled');
      return;
    }

    if (!hasValidSession(useSessionStorage)) {
      console.log('ℹ️ No valid session found for reconnection');
      setReconnectionStatus(RECONNECTION_STATES.IDLE);
      return;
    }

    const sessionData = loadSessionData(useSessionStorage);
    if (!sessionData) {
      console.log('ℹ️ No session data available for reconnection');
      return;
    }

    console.log('🔍 Found session data for reconnection:', sessionData);

    // Don't reconnect to finished games
    if (sessionData.gameState === 'finished') {
      console.log('🏁 Game is finished, clearing session data');
      clearCurrentSession();
      return;
    }

    // Check if we're already in the same game
    if (gameState?.gameId === sessionData.gameId && playerId === sessionData.playerId) {
      console.log('ℹ️ Already connected to the same game');
      setSessionRestored(true);
      return;
    }

    await attemptReconnection(sessionData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, playerId, enableAutoReconnection, useSessionStorage, clearCurrentSession]);

  /**
   * Attempt to reconnect to a game
   */
  const attemptReconnection = useCallback(async (sessionData) => {
    if (reconnectionInProgress.current) return;

    reconnectionInProgress.current = true;
    setIsReconnecting(true);
    setReconnectionStatus(RECONNECTION_STATES.CHECKING);
    setReconnectionProgress(10);
    setReconnectionError(null);

    console.log('🔄 Attempting reconnection...', sessionData);

    try {
      // Notify user about reconnection attempt
      if (addToast) {
        addToast('🔄 Reconnecting to previous game...', 'info');
      }

      // Step 1: Connect to server
      setReconnectionStatus(RECONNECTION_STATES.CONNECTING);
      setReconnectionProgress(30);

      let connectionSocket;
      if (sessionData.userType === 'authenticated' && isAuthenticated && token) {
        connectionSocket = connectWithAuth(token);
      } else {
        connectionSocket = connectAsGuest();
      }

      if (!connectionSocket) {
        throw new Error('Failed to create socket connection');
      }

      // Step 2: Wait for connection
      await waitForConnection(connectionSocket);
      setReconnectionProgress(50);

      // Step 3: Attempt to rejoin game
      setReconnectionStatus(RECONNECTION_STATES.REJOINING);
      setReconnectionProgress(70);

      const rejoinResult = await rejoinGame(connectionSocket, sessionData);
      
      if (rejoinResult.success) {
        // Step 4: Restore game state
        setReconnectionProgress(90);
        await restoreGameState(rejoinResult.data);
        
        setReconnectionProgress(100);
        setReconnectionStatus(RECONNECTION_STATES.SUCCESS);
        setSessionRestored(true);
        
        if (addToast) {
          addToast('✅ Reconnected to previous game successfully!', 'success');
        }
        
        console.log('✅ Reconnection successful');
      } else {
        throw new Error(rejoinResult.error || 'Failed to rejoin game');
      }

    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      await handleReconnectionFailure(error, sessionData);
    } finally {
      reconnectionInProgress.current = false;
      
      // Clear timeout
      if (reconnectionTimeoutRef.current) {
        clearTimeout(reconnectionTimeoutRef.current);
        reconnectionTimeoutRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, connectWithAuth, connectAsGuest, addToast]);

  /**
   * Wait for socket connection
   */
  const waitForConnection = useCallback((socket, timeout = reconnectionTimeoutMs) => {
    return new Promise((resolve, reject) => {
      if (socket.connected) {
        resolve(socket);
        return;
      }

      const timeoutId = setTimeout(() => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
        reject(new Error('Connection timeout'));
      }, timeout);

      const onConnect = () => {
        clearTimeout(timeoutId);
        socket.off('connect_error', onError);
        resolve(socket);
      };

      const onError = (error) => {
        clearTimeout(timeoutId);
        socket.off('connect', onConnect);
        reject(error);
      };

      socket.on('connect', onConnect);
      socket.on('connect_error', onError);
    });
  }, [reconnectionTimeoutMs]);

  /**
   * Attempt to rejoin game
   */
  const rejoinGame = useCallback((socket, sessionData) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        socket.off('rejoinSuccess', onSuccess);
        socket.off('rejoinError', onError);
        reject(new Error('Rejoin timeout'));
      }, reconnectionTimeoutMs);

      const onSuccess = (data) => {
        clearTimeout(timeoutId);
        socket.off('rejoinError', onError);
        resolve({ success: true, data });
      };

      const onError = (error) => {
        clearTimeout(timeoutId);
        socket.off('rejoinSuccess', onSuccess);
        resolve({ success: false, error: error.message || error });
      };

      socket.on('rejoinSuccess', onSuccess);
      socket.on('rejoinError', onError);

      // Emit rejoin request
      socket.emit('rejoinGame', {
        gameId: sessionData.gameId,
        playerName: sessionData.playerName
      });
    });
  }, [reconnectionTimeoutMs]);

  /**
   * Restore game state after successful reconnection
   */
  const restoreGameState = useCallback(async (gameData) => {
    console.log('🔄 Restoring game state:', gameData);

    try {
      if (setGameState && gameData.gameState) {
        setGameState(gameData.gameState);
      }

      if (setGameId && gameData.gameState?.gameId) {
        setGameId(gameData.gameState.gameId);
      }

      if (setPlayerId && gameData.playerId) {
        setPlayerId(gameData.playerId);
      }

      if (setPlayerName && gameData.playerName) {
        setPlayerName(gameData.playerName);
      }

      // Update stored session data with fresh information
      if (enableSessionPersistence) {
        const updatedSessionData = {
          gameId: gameData.gameState?.gameId,
          playerId: gameData.playerId,
          playerName: gameData.playerName,
          gameState: gameData.gameState?.gameState,
          playerCount: gameData.gameState?.players?.length || 0,
          userType: isAuthenticated ? 'authenticated' : 'guest',
          lastRestored: Date.now()
        };

        saveSessionData(updatedSessionData, useSessionStorage);
      }

      console.log('✅ Game state restored successfully');
    } catch (error) {
      console.error('❌ Failed to restore game state:', error);
      throw error;
    }
  }, [setGameState, setGameId, setPlayerId, setPlayerName, enableSessionPersistence, isAuthenticated, useSessionStorage]);

  /**
   * Handle reconnection failure
   */
  const handleReconnectionFailure = useCallback(async (error, sessionData) => {
    console.log('❌ Handling reconnection failure:', error);

    const retryInfo = retryStrategy.current.nextAttempt();
    
    setReconnectionError(error.message || error.toString());
    
    // Use error handler to determine appropriate response
    handleReconnectionError(error, {
      onTemporaryError: (result) => {
        console.log('🔄 Temporary error, will retry:', result);
      },
      onRecoverableError: (result) => {
        console.log('⚠️ Recoverable error:', result);
      },
      onPermanentError: (result) => {
        console.log('❌ Permanent error, clearing session:', result);
        clearCurrentSession();
        
        if (addToast) {
          addToast(result.userMessages.description, 'error');
        }
      }
    }, {
      attemptCount: retryInfo.attempt,
      maxAttempts,
      gameState: sessionData
    });

    if (isRecoverableError(error) && retryInfo.shouldRetry) {
      setReconnectionStatus(RECONNECTION_STATES.ERROR);
      
      if (addToast) {
        addToast(`🔄 Reconnection failed. Retrying in ${Math.round(retryInfo.delay / 1000)} seconds...`, 'warning');
      }
      
      // Retry after delay
      setTimeout(() => {
        if (reconnectionInProgress.current) return;
        attemptReconnection(sessionData);
      }, retryInfo.delay);
    } else {
      // Give up on reconnection
      setReconnectionStatus(RECONNECTION_STATES.ERROR);
      setIsReconnecting(false);
      
      if (error.message?.includes('timeout')) {
        setReconnectionStatus(RECONNECTION_STATES.TIMEOUT);
        if (addToast) {
          addToast('⏰ Reconnection timed out', 'warning');
        }
      } else {
        if (addToast) {
          addToast('❌ Unable to reconnect to previous game', 'error');
        }
      }
      
      // Clear session data for permanent failures
      if (!isRecoverableError(error)) {
        clearCurrentSession();
      }
    }
  }, [clearCurrentSession, addToast, maxAttempts, attemptReconnection]);

  /**
   * Manual reconnection trigger
   */
  const triggerReconnection = useCallback(() => {
    if (reconnectionInProgress.current) {
      console.log('⚠️ Reconnection already in progress');
      return;
    }

    retryStrategy.current.reset();
    checkAndReconnect();
  }, [checkAndReconnect]);

  // Initialize auto-reconnection on mount
  useEffect(() => {
    if (!enableAutoReconnection) return;

    console.log('🚀 Initializing auto-reconnection');

    // Check for existing session immediately
    const initializeReconnection = async () => {
      // Small delay to ensure contexts are ready
      setTimeout(() => {
        checkAndReconnect();
      }, 100);
    };

    initializeReconnection();

    // Set up periodic session checks
    sessionCheckInterval.current = setInterval(() => {
      if (!reconnectionInProgress.current && !isReconnecting) {
        checkAndReconnect();
      }
    }, SESSION_CHECK_INTERVAL);

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [enableAutoReconnection, checkAndReconnect, isReconnecting]);

  // Save session data when game state changes
  useEffect(() => {
    if (gameState && playerId && gameState.gameState !== 'finished') {
      saveCurrentSession();
    }
  }, [gameState, playerId, playerName, saveCurrentSession]);

  // Clear session data when game finishes
  useEffect(() => {
    if (gameState?.gameState === 'finished') {
      console.log('🏁 Game finished, clearing session data');
      clearCurrentSession();
    }
  }, [gameState?.gameState, clearCurrentSession]);

  // Set up session persistence listeners
  useEffect(() => {
    if (!enableSessionPersistence) return;

    console.log('🔧 Setting up session persistence');

    const cleanup = setupSessionPersistence((event) => {
      console.log('📡 Session persistence event:', event);

      switch (event.type) {
        case 'storage_change':
          // Handle cross-tab session changes
          if (event.sessionData && !reconnectionInProgress.current) {
            console.log('🔄 Cross-tab session change detected');
            checkAndReconnect();
          }
          break;

        case 'visibility_change':
          // Check session when page becomes visible
          if (event.visible && !reconnectionInProgress.current) {
            checkAndReconnect();
          }
          break;
        default:
          console.log('🔧 Unknown session persistence event type:', event.type);
          break;
      }
    }, {
      useSessionStorage,
      enableCrossTabSync: !useSessionStorage
    });

    sessionPersistenceCleanup.current = cleanup;

    return () => {
      if (sessionPersistenceCleanup.current) {
        sessionPersistenceCleanup.current();
      }
    };
  }, [enableSessionPersistence, useSessionStorage, checkAndReconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectionTimeoutRef.current) {
        clearTimeout(reconnectionTimeoutRef.current);
      }
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
      if (sessionPersistenceCleanup.current) {
        sessionPersistenceCleanup.current();
      }
    };
  }, []);

  return {
    // State
    isReconnecting,
    sessionRestored,
    reconnectionStatus,
    reconnectionProgress,
    reconnectionError,

    // Actions
    triggerReconnection,
    clearCurrentSession,
    saveCurrentSession,

    // Status checks
    hasValidSession: () => hasValidSession(useSessionStorage),
    isReconnectionEnabled: enableAutoReconnection,

    // Configuration
    maxAttempts,
    currentAttempt: retryStrategy.current.getCurrentAttempt()
  };
};

export default useAutoReconnection;