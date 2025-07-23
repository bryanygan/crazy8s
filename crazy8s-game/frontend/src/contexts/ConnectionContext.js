import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createAuthenticatedSocket, createGuestSocket } from '../utils/socketAuth';
import { 
  saveSessionData, 
  loadSessionData, 
  saveSessionId, 
  // getSessionId,
  clearSessionData,
  hasValidSession,
  setupSessionPersistence 
} from '../utils/sessionPersistence';

const ConnectionContext = createContext({
  socket: null,
  isConnected: false,
  isReconnecting: false,
  reconnectAttempts: 0,
  connectionStatus: 'disconnected', // 'connected', 'connecting', 'disconnected', 'reconnecting', 'failed'
  connectionLatency: null,
  connectionError: null,
  connectionStability: 'stable', // 'stable', 'unstable', 'critical'
  lastErrorTime: null,
  errorCount: 0,
  sessionValid: true,
  connectWithAuth: () => {},
  connectAsGuest: () => {},
  disconnect: () => {},
  requestGameState: () => {},
  addConnectionListener: () => {},
  removeConnectionListener: () => {},
  clearConnectionError: () => {},
  storeSessionData: () => {},
  validateSession: () => {},
  loadStoredSession: () => null,
  hasStoredSession: () => false,
  clearStoredSession: () => {}
});

export const ConnectionProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionLatency, setConnectionLatency] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [connectionStability, setConnectionStability] = useState('stable'); // 'stable', 'unstable', 'critical'
  const [lastErrorTime, setLastErrorTime] = useState(null);
  const [errorCount, setErrorCount] = useState(0);
  const [sessionValid, setSessionValid] = useState(true);
  
  // Disconnection duration tracking for filtering false positives
  const [disconnectStartTime, setDisconnectStartTime] = useState(null);
  const [disconnectReason, setDisconnectReason] = useState(null);
  const [lastReconnectNotificationTime, setLastReconnectNotificationTime] = useState(0);
  
  const connectionListeners = useRef(new Set());
  const pingInterval = useRef(null);
  const reconnectTimeout = useRef(null);
  const lastPingTime = useRef(null);
  const errorHistory = useRef([]);
  const sessionData = useRef(null);
  const exponentialBackoff = useRef(1000); // Start with 1 second
  
  // Constants for filtering false reconnection notifications
  const MINIMUM_DISCONNECT_DURATION = 2000; // 2 seconds
  const RECONNECT_NOTIFICATION_DEBOUNCE = 3000; // 3 seconds between notifications
  
  // Helper function to determine if a disconnection/reconnection is user-impacting
  const isUserImpactingReconnection = useCallback((disconnectReason, disconnectDuration, attempts = 1) => {
    // Filter out technical reconnections that don't impact user experience
    const technicalReasons = [
      'transport close',
      'transport error', 
      'ping timeout',
      'io server disconnect', // Planned server disconnects
      'io client disconnect'  // Planned client disconnects
    ];
    
    // Don't show notifications for very brief disconnections (likely network blips)
    if (disconnectDuration < MINIMUM_DISCONNECT_DURATION) {
      console.log(`🔇 Suppressing reconnection notification: duration ${disconnectDuration}ms < ${MINIMUM_DISCONNECT_DURATION}ms threshold`);
      return false;
    }
    
    // Don't show notifications for technical transport issues
    if (technicalReasons.includes(disconnectReason)) {
      console.log(`🔇 Suppressing reconnection notification: technical reason "${disconnectReason}"`);
      return false;
    }
    
    // Don't show notifications too frequently (debounce)
    const timeSinceLastNotification = Date.now() - lastReconnectNotificationTime;
    if (timeSinceLastNotification < RECONNECT_NOTIFICATION_DEBOUNCE) {
      console.log(`🔇 Suppressing reconnection notification: debounce period active (${timeSinceLastNotification}ms < ${RECONNECT_NOTIFICATION_DEBOUNCE}ms)`);
      return false;
    }
    
    return true;
  }, [lastReconnectNotificationTime]);
  const maxBackoff = useRef(30000); // Max 30 seconds
  const socketRef = useRef(null); // Track current socket in ref to avoid circular dependencies

  // Enhanced connection monitoring with stability assessment
  const startPingMonitoring = useCallback((socketInstance) => {
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
    }
    
    pingInterval.current = setInterval(() => {
      if (socketInstance && socketInstance.connected) {
        lastPingTime.current = Date.now();
        socketInstance.emit('ping');
      }
    }, 10000); // Ping every 10 seconds
    
    socketInstance.on('pong', () => {
      if (lastPingTime.current) {
        const latency = Date.now() - lastPingTime.current;
        setConnectionLatency(latency);
        
        // Assess connection stability based on latency
        if (latency > 1000) {
          setConnectionStability('critical');
        } else if (latency > 500) {
          setConnectionStability('unstable');
        } else {
          setConnectionStability('stable');
        }
      }
    });
    
    // Handle ping timeout
    socketInstance.on('ping_timeout', () => {
      console.warn('⚠️ Ping timeout detected');
      setConnectionStability('unstable');
    });
  }, []);
  
  // Emit connection events to listeners
  const emitConnectionEvent = useCallback((event, data = {}) => {
    connectionListeners.current.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Connection listener error:', error);
      }
    });
  }, []);
  
  // Comprehensive error handling with exponential backoff
  const handleSocketError = useCallback((error, context = 'unknown') => {
    console.error(`❌ Socket error in ${context}:`, error);
    
    const now = Date.now();
    const errorEntry = { time: now, error: error.message || error, context };
    
    // Track error history for stability assessment
    errorHistory.current.push(errorEntry);
    
    // Keep only last 10 errors
    if (errorHistory.current.length > 10) {
      errorHistory.current.shift();
    }
    
    // Check for rapid error patterns
    const recentErrors = errorHistory.current.filter(e => now - e.time < 60000); // Last minute
    
    if (recentErrors.length > 3) {
      setConnectionStability('critical');
      console.warn('⚠️ Rapid error pattern detected - connection unstable');
    }
    
    setConnectionError(error.message || error.toString());
    setLastErrorTime(now);
    setErrorCount(prev => prev + 1);
    
    // Exponential backoff for reconnection
    if (context === 'reconnect' || context === 'connect') {
      exponentialBackoff.current = Math.min(exponentialBackoff.current * 2, maxBackoff.current);
      console.log(`⏱️ Next reconnection attempt in ${exponentialBackoff.current}ms`);
    }
    
    emitConnectionEvent('error', { error, context, stability: connectionStability });
  }, [connectionStability, emitConnectionEvent]);
  
  // Session validation after reconnect
  const validateSession = useCallback(async (socketInstance) => {
    if (!socketInstance || !socketInstance.connected) return false;
    
    try {
      console.log('🔍 Validating session after reconnect');
      
      // Request session validation from server
      const response = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Session validation timeout')), 5000);
        
        socketInstance.emit('validateSession', sessionData.current, (response) => {
          clearTimeout(timeout);
          resolve(response);
        });
      });
      
      if (response.valid) {
        setSessionValid(true);
        emitConnectionEvent('session_validated', response);
        return true;
      } else {
        setSessionValid(false);
        emitConnectionEvent('session_invalid', response);
        return false;
      }
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      setSessionValid(false);
      handleSocketError(error, 'session_validation');
      return false;
    }
  }, [emitConnectionEvent, handleSocketError]);
  
  // Store session data for validation and persistence
  const storeSessionData = useCallback((data) => {
    const enrichedData = {
      userId: data.userId,
      gameId: data.gameId,
      playerId: data.playerId,
      playerName: data.playerName,
      userType: data.type || 'guest',
      timestamp: Date.now(),
      ...data
    };
    
    // Store in memory for immediate use
    sessionData.current = enrichedData;
    
    // Persist to localStorage for recovery
    if (data.gameId && data.playerId) {
      const persistentData = {
        gameId: data.gameId,
        playerId: data.playerId,
        playerName: data.playerName,
        userType: data.type || 'guest',
        sessionId: data.sessionId,
        gameState: 'connected'
      };
      
      saveSessionData(persistentData);
      
      if (data.sessionId) {
        saveSessionId(data.sessionId);
      }
      
      console.log('💾 Session data stored for persistence:', persistentData);
    }
  }, []);

  // Create socket with enhanced connection handling
  const createSocket = useCallback((token = null) => {
    let newSocket;
    
    if (token) {
      console.log('🔌 Creating authenticated socket connection');
      newSocket = createAuthenticatedSocket(token);
    } else {
      console.log('🔌 Creating guest socket connection');
      newSocket = createGuestSocket();
    }

    // Enhanced connection configuration
    newSocket.io.timeout(5000); // 5 second timeout for connection
    
    // Enhanced connection event handlers with error recovery
    newSocket.on('connect', async () => {
      console.log('✅ Socket connected with ID:', newSocket.id);
      setIsConnected(true);
      setIsReconnecting(false);
      setReconnectAttempts(0);
      setConnectionStatus('connected');
      setConnectionError(null);
      setErrorCount(0);
      
      // Reset exponential backoff on successful connection
      exponentialBackoff.current = 1000;
      
      // Validate session if we have stored session data
      if (sessionData.current) {
        const isValid = await validateSession(newSocket);
        if (!isValid) {
          console.warn('⚠️ Session validation failed after reconnect');
          emitConnectionEvent('session_invalid');
        }
      }
      
      startPingMonitoring(newSocket);
      emitConnectionEvent('connected', { socketId: newSocket.id, sessionValid });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
      setConnectionLatency(null);
      setConnectionStability('unstable');
      
      // Track disconnection for filtering false reconnection notifications
      setDisconnectStartTime(Date.now());
      setDisconnectReason(reason);
      
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
      
      // Enhanced disconnect handling with stability assessment
      const isPlanned = reason === 'io server disconnect' || reason === 'io client disconnect';
      
      if (isPlanned) {
        setConnectionStatus('disconnected');
        emitConnectionEvent('disconnected', { reason, planned: true });
      } else {
        // Assess if we should attempt reconnection based on error history
        const recentErrors = errorHistory.current.filter(e => Date.now() - e.time < 300000); // Last 5 minutes
        
        if (recentErrors.length > 5) {
          console.warn('⚠️ Too many recent errors - delaying reconnection');
          setConnectionStatus('failed');
          setConnectionStability('critical');
          
          // Delay reconnection with exponential backoff
          setTimeout(() => {
            setConnectionStatus('reconnecting');
            setIsReconnecting(true);
          }, exponentialBackoff.current);
        } else {
          setConnectionStatus('reconnecting');
          setIsReconnecting(true);
        }
        
        emitConnectionEvent('disconnected', { reason, planned: false, stability: connectionStability });
      }
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
      setIsReconnecting(false);
      setReconnectAttempts(attemptNumber);
      setConnectionStatus('connected');
      setConnectionError(null);
      
      // Calculate disconnection duration for filtering
      const disconnectDuration = disconnectStartTime ? Date.now() - disconnectStartTime : 0;
      const shouldShowNotification = isUserImpactingReconnection(
        disconnectReason || 'unknown', 
        disconnectDuration, 
        attemptNumber
      );
      
      console.log(`🔄 Reconnection analysis: reason="${disconnectReason}", duration=${disconnectDuration}ms, attempts=${attemptNumber}, showNotification=${shouldShowNotification}`);
      
      startPingMonitoring(newSocket);
      
      if (shouldShowNotification) {
        setLastReconnectNotificationTime(Date.now());
        emitConnectionEvent('reconnected', { 
          attempts: attemptNumber, 
          duration: disconnectDuration,
          reason: disconnectReason,
          userImpacting: true
        });
      } else {
        // Still emit event but mark as technical reconnection for other handlers
        emitConnectionEvent('technical_reconnected', { 
          attempts: attemptNumber, 
          duration: disconnectDuration,
          reason: disconnectReason,
          userImpacting: false
        });
      }
      
      // Reset tracking
      setDisconnectStartTime(null);
      setDisconnectReason(null);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Reconnection attempt', attemptNumber);
      setReconnectAttempts(attemptNumber);
      setIsReconnecting(true);
      setConnectionStatus('reconnecting');
      
      emitConnectionEvent('reconnecting', { attempt: attemptNumber });
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
      handleSocketError(error, 'reconnect');
      emitConnectionEvent('reconnect_error', { error: error.message, stability: connectionStability });
    });

    newSocket.on('reconnect_failed', () => {
      console.error('❌ Reconnection failed after maximum attempts');
      setIsReconnecting(false);
      setConnectionStatus('failed');
      setConnectionError('Failed to reconnect after maximum attempts');
      
      emitConnectionEvent('reconnect_failed');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      handleSocketError(error, 'connect');
      setConnectionStatus('failed');
      
      emitConnectionEvent('connect_error', { error: error.message, stability: connectionStability });
    });

    // Authentication event handlers
    newSocket.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data);
      emitConnectionEvent('authenticated', data);
    });

    newSocket.on('auth_error', (error) => {
      console.error('❌ Authentication error:', error);
      handleSocketError(error, 'auth');
      setSessionValid(false);
      emitConnectionEvent('auth_error', { error: error.message, sessionValid: false });
    });

    newSocket.on('guest_connected', (data) => {
      console.log('✅ Connected as guest:', data);
      storeSessionData({ ...data, type: 'guest' });
      emitConnectionEvent('guest_connected', data);
    });
    
    newSocket.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data);
      storeSessionData({ ...data, type: 'authenticated' });
      emitConnectionEvent('authenticated', data);
    });
    
    // Add error handler for undefined socket errors
    newSocket.on('error', (error) => {
      console.error('❌ Undefined socket error:', error);
      handleSocketError(error, 'undefined');
    });
    
    // Handle connection timeout
    newSocket.on('connect_timeout', () => {
      console.error('❌ Connection timeout');
      handleSocketError(new Error('Connection timeout'), 'timeout');
    });
    
    // Handle any other uncaught socket errors
    newSocket.onAny((event, ...args) => {
      if (event.includes('error') && event !== 'connect_error' && event !== 'reconnect_error' && event !== 'auth_error') {
        console.error(`❌ Uncaught socket error event: ${event}`, args);
        handleSocketError(new Error(`Uncaught socket error: ${event}`), 'uncaught');
      }
    });

    return newSocket;
  }, [startPingMonitoring, emitConnectionEvent, connectionStability, handleSocketError, sessionValid, storeSessionData, validateSession, disconnectReason, disconnectStartTime, isUserImpactingReconnection]);

  // Update socket ref when socket state changes
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Public methods
  const connectWithAuth = useCallback((token) => {
    // Prevent duplicate connections
    if (connectionStatus === 'connecting' || connectionStatus === 'connected') {
      console.log('⚠️ Connection already in progress or established');
      return socketRef.current;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    setConnectionStatus('connecting');
    const newSocket = createSocket(token);
    setSocket(newSocket);
    
    return newSocket;
  }, [createSocket, connectionStatus]);

  const connectAsGuest = useCallback(() => {
    // Prevent duplicate connections
    if (connectionStatus === 'connecting' || connectionStatus === 'connected') {
      console.log('⚠️ Connection already in progress or established');
      return socketRef.current;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    setConnectionStatus('connecting');
    const newSocket = createSocket();
    setSocket(newSocket);
    
    return newSocket;
  }, [createSocket, connectionStatus]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
      pingInterval.current = null;
    }
    
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    setIsConnected(false);
    setIsReconnecting(false);
    setReconnectAttempts(0);
    setConnectionStatus('disconnected');
    setConnectionLatency(null);
    setConnectionError(null);
  }, [socket]);

  const requestGameState = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('🎮 Requesting game state restoration');
      socketRef.current.emit('requestGameState');
      emitConnectionEvent('game_state_requested');
    }
  }, [emitConnectionEvent]);

  const addConnectionListener = useCallback((listener) => {
    connectionListeners.current.add(listener);
    return () => connectionListeners.current.delete(listener);
  }, []);

  const removeConnectionListener = useCallback((listener) => {
    connectionListeners.current.delete(listener);
  }, []);

  const clearConnectionError = useCallback(() => {
    setConnectionError(null);
  }, []);

  // Setup session persistence monitoring
  useEffect(() => {
    console.log('🔧 Setting up ConnectionContext session persistence monitoring');
    
    const cleanup = setupSessionPersistence((event) => {
      console.log('📡 ConnectionContext session persistence event:', event);
      
      switch (event.type) {
        case 'storage_change':
          if (event.sessionData) {
            console.log('🔄 Cross-tab session change detected in ConnectionContext');
            // Update stored session data if it changed
            if (event.sessionData.gameId && event.sessionData.playerId) {
              storeSessionData(event.sessionData);
            }
          }
          break;
          
        case 'visibility_change':
          if (event.visible && event.sessionData) {
            console.log('👁️ Page became visible, refreshing session context');
            // Refresh session data when page becomes visible
            if (event.sessionData.gameId && event.sessionData.playerId) {
              storeSessionData(event.sessionData);
            }
          }
          break;
        default:
          console.log('📡 Unknown session persistence event type:', event.type);
          break;
      }
      
      // Emit session changes to connection listeners
      emitConnectionEvent('session_persistence_event', event);
    }, {
      enableCrossTabSync: true,
      interval: 60000 // Check every minute
    });
    
    return cleanup;
  }, [storeSessionData, emitConnectionEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [socket]);

  const value = {
    socket,
    isConnected,
    isReconnecting,
    reconnectAttempts,
    connectionStatus,
    connectionLatency,
    connectionError,
    connectionStability,
    lastErrorTime,
    errorCount,
    sessionValid,
    connectWithAuth,
    connectAsGuest,
    disconnect,
    requestGameState,
    addConnectionListener,
    removeConnectionListener,
    clearConnectionError,
    storeSessionData,
    validateSession,
    // Session persistence methods
    loadStoredSession: () => loadSessionData(),
    hasStoredSession: () => hasValidSession(),
    clearStoredSession: () => clearSessionData()
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};

export default ConnectionContext;