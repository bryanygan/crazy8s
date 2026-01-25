import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createAuthenticatedSocket, createGuestSocket } from '../utils/socketAuth';

const ConnectionContext = createContext({
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected', // 'connected', 'connecting', 'disconnected', 'failed'
  connectionError: null,
  connectWithAuth: () => {},
  connectAsGuest: () => {},
  disconnect: () => {},
  addConnectionListener: () => {},
  removeConnectionListener: () => {},
  clearConnectionError: () => {}
});

export const ConnectionProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionError, setConnectionError] = useState(null);
  
  const connectionListeners = useRef(new Set());
  const socketRef = useRef(null); // Track current socket in ref to avoid circular dependencies

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
  
  // Error handling
  const handleSocketError = useCallback((error, context = 'unknown') => {
    console.error(`❌ Socket error in ${context}:`, error);
    
    setConnectionError(error.message || error.toString());
    
    emitConnectionEvent('error', { error, context });
  }, [emitConnectionEvent]);

  // Create socket with basic connection handling
  const createSocket = useCallback((token = null) => {
    let newSocket;
    
    if (token) {
      console.log('🔌 Creating authenticated socket connection');
      newSocket = createAuthenticatedSocket(token);
    } else {
      console.log('🔌 Creating guest socket connection');
      newSocket = createGuestSocket();
    }

    // Basic connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected with ID:', newSocket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
      setConnectionError(null);
      
      emitConnectionEvent('connected', { socketId: newSocket.id });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      emitConnectionEvent('disconnected', { reason });
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      handleSocketError(error, 'connect');
      setConnectionStatus('failed');
      
      emitConnectionEvent('connect_error', { error: error.message });
    });

    // Authentication event handlers
    newSocket.on('authenticated', (data) => {
      console.log('✅ Socket authenticated:', data);
      emitConnectionEvent('authenticated', data);
    });

    newSocket.on('auth_error', (error) => {
      console.error('❌ Authentication error:', error);
      handleSocketError(error, 'auth');
      emitConnectionEvent('auth_error', { error: error.message });
    });

    newSocket.on('guest_connected', (data) => {
      console.log('✅ Connected as guest:', data);
      emitConnectionEvent('guest_connected', data);
    });
    
    // Add error handler for undefined socket errors
    newSocket.on('error', (error) => {
      console.error('❌ Undefined socket error:', error);
      handleSocketError(error, 'undefined');
    });

    return newSocket;
  }, [emitConnectionEvent, handleSocketError]);

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
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setConnectionError(null);
  }, [socket]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const value = {
    socket,
    isConnected,
    connectionStatus,
    connectionError,
    connectWithAuth,
    connectAsGuest,
    disconnect,
    addConnectionListener,
    removeConnectionListener,
    clearConnectionError
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