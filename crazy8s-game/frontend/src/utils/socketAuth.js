import { io } from 'socket.io-client';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export const createAuthenticatedSocket = (token) => {
  const socket = io(SERVER_URL, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling'],
    // Enhanced reconnection configuration with error recovery
    reconnection: true,
    reconnectionAttempts: 8, // Increased attempts
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000, // Increased max delay
    maxReconnectionAttempts: 8,
    timeout: 15000, // Increased timeout
    forceNew: false,
    // Additional error handling options
    autoConnect: true,
    randomizationFactor: 0.5,
    // Enable multiplex to handle multiple connections
    multiplex: true,
    // Upgrade timeout
    upgradeTimeout: 10000,
    // Ping timeout and interval
    pingTimeout: 60000,
    pingInterval: 25000
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

export const createGuestSocket = () => {
  const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    // Enhanced reconnection configuration with error recovery
    reconnection: true,
    reconnectionAttempts: 8, // Increased attempts
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000, // Increased max delay
    maxReconnectionAttempts: 8,
    timeout: 15000, // Increased timeout
    forceNew: false,
    // Additional error handling options
    autoConnect: true,
    randomizationFactor: 0.5,
    // Enable multiplex to handle multiple connections
    multiplex: true,
    // Upgrade timeout
    upgradeTimeout: 10000,
    // Ping timeout and interval
    pingTimeout: 60000,
    pingInterval: 25000
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