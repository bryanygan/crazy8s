import { io } from 'socket.io-client';
import { SOCKET_TIMEOUTS, calculateAdaptiveTimeout } from '../config/timeouts';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export const createAuthenticatedSocket = (token, options = {}) => {
  // Calculate adaptive timeouts based on connection quality
  const adaptiveConnectionTimeout = calculateAdaptiveTimeout(SOCKET_TIMEOUTS.CONNECTION_TIMEOUT, options);
  const adaptivePingTimeout = calculateAdaptiveTimeout(SOCKET_TIMEOUTS.PING_TIMEOUT, options);
  
  console.log('🔐 Creating authenticated socket with optimized timeouts:', {
    connectionTimeout: adaptiveConnectionTimeout,
    pingTimeout: adaptivePingTimeout,
    pingInterval: SOCKET_TIMEOUTS.PING_INTERVAL,
    maxAttempts: SOCKET_TIMEOUTS.MAX_RECONNECTION_ATTEMPTS
  });
  
  const socket = io(SERVER_URL, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling'],
    // Enhanced reconnection configuration synchronized with backend
    reconnection: true,
    reconnectionAttempts: SOCKET_TIMEOUTS.MAX_RECONNECTION_ATTEMPTS, // Increased to 10
    reconnectionDelay: SOCKET_TIMEOUTS.RECONNECTION_DELAY, // 1s initial
    reconnectionDelayMax: SOCKET_TIMEOUTS.RECONNECTION_DELAY_MAX, // 15s max (up from 10s)
    maxReconnectionAttempts: SOCKET_TIMEOUTS.MAX_RECONNECTION_ATTEMPTS,
    timeout: adaptiveConnectionTimeout, // 30s adaptive (up from 15s)
    forceNew: false,
    // Additional error handling options
    autoConnect: true,
    randomizationFactor: 0.5,
    // Enable multiplex to handle multiple connections
    multiplex: true,
    // Synchronized with backend timeout optimizations
    upgradeTimeout: SOCKET_TIMEOUTS.UPGRADE_TIMEOUT, // 15s (up from 10s)
    pingTimeout: adaptivePingTimeout, // 120s adaptive (matches backend)
    pingInterval: SOCKET_TIMEOUTS.PING_INTERVAL // 30s (matches backend)
  });
  
  // Enhanced error handling
  socket.on('connect_error', (error) => {
    console.error('❌ Auth socket connect error:', error);
    // Don't throw here, let ConnectionContext handle it
  });
  
  socket.on('reconnect_error', (error) => {
    console.error('❌ Auth socket reconnect error:', error);
  });
  
  socket.on('error', (error) => {
    console.error('❌ Auth socket general error:', error);
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected with authentication');
  });

  socket.on('authenticated', (data) => {
    console.log('✅ Socket authenticated:', data);
  });

  socket.on('auth_error', (error) => {
    console.error('❌ Socket authentication error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Auth socket disconnected:', reason);
  });

  return socket;
};

export const createGuestSocket = (options = {}) => {
  // Calculate adaptive timeouts based on connection quality
  const adaptiveConnectionTimeout = calculateAdaptiveTimeout(SOCKET_TIMEOUTS.CONNECTION_TIMEOUT, options);
  const adaptivePingTimeout = calculateAdaptiveTimeout(SOCKET_TIMEOUTS.PING_TIMEOUT, options);
  
  console.log('👥 Creating guest socket with optimized timeouts:', {
    connectionTimeout: adaptiveConnectionTimeout,
    pingTimeout: adaptivePingTimeout,
    pingInterval: SOCKET_TIMEOUTS.PING_INTERVAL,
    maxAttempts: SOCKET_TIMEOUTS.MAX_RECONNECTION_ATTEMPTS
  });
  
  const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    // Enhanced reconnection configuration synchronized with backend
    reconnection: true,
    reconnectionAttempts: SOCKET_TIMEOUTS.MAX_RECONNECTION_ATTEMPTS, // Increased to 10
    reconnectionDelay: SOCKET_TIMEOUTS.RECONNECTION_DELAY, // 1s initial
    reconnectionDelayMax: SOCKET_TIMEOUTS.RECONNECTION_DELAY_MAX, // 15s max (up from 10s)
    maxReconnectionAttempts: SOCKET_TIMEOUTS.MAX_RECONNECTION_ATTEMPTS,
    timeout: adaptiveConnectionTimeout, // 30s adaptive (up from 15s)
    forceNew: false,
    // Additional error handling options
    autoConnect: true,
    randomizationFactor: 0.5,
    // Enable multiplex to handle multiple connections
    multiplex: true,
    // Synchronized with backend timeout optimizations
    upgradeTimeout: SOCKET_TIMEOUTS.UPGRADE_TIMEOUT, // 15s (up from 10s)
    pingTimeout: adaptivePingTimeout, // 120s adaptive (matches backend)
    pingInterval: SOCKET_TIMEOUTS.PING_INTERVAL // 30s (matches backend)
  });
  
  // Enhanced error handling
  socket.on('connect_error', (error) => {
    console.error('❌ Guest socket connect error:', error);
    // Don't throw here, let ConnectionContext handle it
  });
  
  socket.on('reconnect_error', (error) => {
    console.error('❌ Guest socket reconnect error:', error);
  });
  
  socket.on('error', (error) => {
    console.error('❌ Guest socket general error:', error);
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected as guest');
  });

  socket.on('guest_connected', (data) => {
    console.log('✅ Guest socket connected:', data);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Guest socket disconnected:', reason);
  });

  return socket;
};

export const refreshSocketAuth = (socket, newToken) => {
  if (socket && socket.connected) {
    try {
      socket.emit('refreshAuth', { token: newToken });
    } catch (error) {
      console.error('❌ Failed to refresh socket auth:', error);
      throw error;
    }
  } else {
    console.warn('⚠️ Cannot refresh auth - socket not connected');
    throw new Error('Socket not connected');
  }
};

export const migrateSocketToAuth = (socket, token) => {
  if (socket && socket.connected) {
    try {
      socket.emit('migrateToAuth', { token: token });
    } catch (error) {
      console.error('❌ Failed to migrate socket to auth:', error);
      throw error;
    }
  } else {
    console.warn('⚠️ Cannot migrate to auth - socket not connected');
    throw new Error('Socket not connected');
  }
};

// Add utility for safe socket operations
export const safeEmit = (socket, event, data, callback) => {
  if (!socket) {
    console.warn('⚠️ Cannot emit - socket is null');
    return false;
  }
  
  if (!socket.connected) {
    console.warn('⚠️ Cannot emit - socket not connected');
    return false;
  }
  
  try {
    if (callback) {
      socket.emit(event, data, callback);
    } else {
      socket.emit(event, data);
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to emit ${event}:`, error);
    return false;
  }
};

// Check socket health
export const checkSocketHealth = (socket) => {
  if (!socket) {
    return { healthy: false, reason: 'Socket is null' };
  }
  
  if (!socket.connected) {
    return { healthy: false, reason: 'Socket not connected' };
  }
  
  if (socket.disconnected) {
    return { healthy: false, reason: 'Socket is disconnected' };
  }
  
  return { healthy: true, reason: 'Socket is healthy' };
};

// Enhanced socket error handler
export const handleSocketError = (error, context = 'unknown') => {
  const errorInfo = {
    message: error.message || error.toString(),
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    type: error.type || 'unknown'
  };
  
  console.error('🔥 Socket Error Details:', errorInfo);
  
  // Return standardized error info
  return errorInfo;
};