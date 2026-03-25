import { io } from 'socket.io-client';

const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const createAuthenticatedSocket = (token) => {
  const socket = io(SERVER_URL, {
    auth: {
      token: token
    },
    transports: ['websocket', 'polling'],
    reconnection: false, // Disable automatic reconnection
    timeout: 20000 // 20 seconds connection timeout
  });

  socket.on('connect', () => {
  });

  socket.on('authenticated', (data) => {
  });

  socket.on('auth_error', (error) => {
  });

  socket.on('disconnect', (reason) => {
  });

  return socket;
};

export const createGuestSocket = () => {
  const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling'],
    reconnection: false, // Disable automatic reconnection
    timeout: 20000 // 20 seconds connection timeout
  });

  socket.on('connect', () => {
  });

  socket.on('guest_connected', (data) => {
  });

  socket.on('disconnect', (reason) => {
  });

  return socket;
};

export const refreshSocketAuth = (socket, newToken) => {
  if (socket && socket.connected) {
    try {
      socket.emit('refreshAuth', { token: newToken });
    } catch (error) {
      throw error;
    }
  } else {
    throw new Error('Socket not connected');
  }
};

// Add utility for safe socket operations
export const safeEmit = (socket, event, data, callback) => {
  if (!socket) {
    return false;
  }

  if (!socket.connected) {
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
