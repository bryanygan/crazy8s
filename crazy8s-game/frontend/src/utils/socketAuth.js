import { io } from 'socket.io-client';

const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001';

export const createAuthenticatedSocket = (token) => {
  console.log('🔐 Creating authenticated socket');
  
  const socket = io(SERVER_URL, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling'],
    reconnection: false, // Disable automatic reconnection
    timeout: 20000 // 20 seconds connection timeout
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
  console.log('👥 Creating guest socket');
  
  const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: false, // Disable automatic reconnection
    timeout: 20000 // 20 seconds connection timeout
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