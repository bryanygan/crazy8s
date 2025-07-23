const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const UserStore = require('./stores/UserStore');
const sessionStore = require('./stores/SessionStore');
const SocketValidator = require('./utils/socketValidator');
const connectionLogger = require('./utils/connectionLogger');
const logger = require('./utils/logger');

let io;

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // Allow unauthenticated connections (guest mode)
      socket.user = null;
      socket.isAuthenticated = false;
      logger.info(`Guest user connected: ${socket.id}`);
      return next();
    }

    try {
      // Verify JWT token
      const secret = process.env.JWT_SECRET;
      const decoded = jwt.verify(token, secret);
      
      // Find user
      const user = await UserStore.findById(decoded.id);
      
      if (!user) {
        logger.warn(`Socket authentication failed - user not found: ${decoded.id}`);
        socket.user = null;
        socket.isAuthenticated = false;
        return next();
      }
      
      if (!user.profile.isActive) {
        logger.warn(`Socket authentication failed - account deactivated: ${user.username}`);
        socket.user = null;
        socket.isAuthenticated = false;
        return next();
      }
      
      if (user.isLocked()) {
        logger.warn(`Socket authentication failed - account locked: ${user.username}`);
        socket.user = null;
        socket.isAuthenticated = false;
        return next();
      }
      
      // Set user context on socket
      socket.user = user;
      socket.isAuthenticated = true;
      socket.userId = user.id;
      
      logger.info(`Authenticated user connected: ${user.username} (${socket.id})`);
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        logger.warn(`Socket authentication failed - token expired: ${socket.id}`);
        socket.emit('auth_error', { 
          code: 'TOKEN_EXPIRED', 
          message: 'Authentication token has expired' 
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        logger.warn(`Socket authentication failed - invalid token: ${socket.id}`);
        socket.emit('auth_error', { 
          code: 'INVALID_TOKEN', 
          message: 'Invalid authentication token' 
        });
      }
      
      // Continue as guest user
      socket.user = null;
      socket.isAuthenticated = false;
      next();
    }
  } catch (error) {
    logger.error('Socket authentication middleware error:', error);
    socket.user = null;
    socket.isAuthenticated = false;
    next();
  }
};

const initSocket = (server) => {
    io = socketIO(server, {
        cors: {
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
            credentials: true
        },
        // Enhanced configuration for reliability
        pingTimeout: 60000,
        pingInterval: 25000,
        transports: ['websocket', 'polling']
    });

    // Initialize socket validator
    const socketValidator = new SocketValidator(sessionStore);

    // Apply authentication middleware
    io.use(authenticateSocket);

    io.on('connection', (socket) => {
        // Enhanced connection logging
        const userInfo = socket.isAuthenticated ? {
            id: socket.userId,
            username: socket.user.username
        } : null;
        
        connectionLogger.logConnection(socket, userInfo);
        
        if (socket.isAuthenticated) {
            logger.info(`Authenticated user connected: ${socket.user.username} (${socket.id})`);
            
            // Join user to their personal room for direct messages
            socket.join(`user_${socket.userId}`);
            
            // Check for existing session and attempt auto-reconnection
            const existingSession = sessionStore.getSessionByAuthId(socket.userId);
            if (existingSession && sessionStore.isSessionValid(existingSession.sessionId)) {
                logger.info(`Found existing session for ${socket.user.username}, checking if actual reconnection needed for game ${existingSession.gameId}`);
                
                // Check if this is an actual disconnection or just a new browser tab/refresh
                const timeSinceLastActivity = Date.now() - (existingSession.lastActivity || 0);
                const ACTUAL_DISCONNECT_THRESHOLD = 5000; // 5 seconds
                const wasActuallyDisconnected = timeSinceLastActivity > ACTUAL_DISCONNECT_THRESHOLD;
                
                // Validate session consistency before offering reconnection
                const validation = socketValidator.validateSessionConsistency(socket, existingSession, 'auto-reconnection-check');
                if (validation.canProceed && wasActuallyDisconnected) {
                    logger.info(`Actual disconnection detected (${timeSinceLastActivity}ms gap) - offering reconnection`);
                    
                    // Emit reconnection opportunity only for actual disconnections
                    socket.emit('reconnection_available', {
                        gameId: existingSession.gameId,
                        playerName: existingSession.playerName,
                        lastActivity: existingSession.lastActivity,
                        reconnectionCount: existingSession.reconnectionCount || 0,
                        disconnectDuration: timeSinceLastActivity
                    });
                } else if (validation.canProceed && !wasActuallyDisconnected) {
                    logger.info(`Session refresh detected (${timeSinceLastActivity}ms gap) - silently reconnecting without notification`);
                    
                    // Silent reconnection for quick refreshes/new tabs
                    socket.emit('silent_reconnection_available', {
                        gameId: existingSession.gameId,
                        playerName: existingSession.playerName,
                        lastActivity: existingSession.lastActivity,
                        type: 'session_refresh'
                    });
                } else {
                    logger.warn(`Session consistency check failed for auto-reconnection: ${validation.errors.join(', ')}`);
                    // Clean up invalid session
                    sessionStore.removeSession(existingSession.sessionId);
                }
            }
            
            // Emit authentication success
            socket.emit('authenticated', {
                user: socket.user.toPublicJSON(),
                socketId: socket.id
            });
        } else {
            logger.info(`Guest user connected: ${socket.id}`);
            socket.emit('guest_connected', { socketId: socket.id });
        }

        socket.on('disconnect', (reason) => {
            // Enhanced disconnection logging
            const gameInfo = socket.gameId ? {
                gameId: socket.gameId,
                playerName: socket.playerName
            } : null;
            
            connectionLogger.logDisconnection(socket, reason, gameInfo);
            
            if (socket.isAuthenticated) {
                logger.info(`Authenticated user disconnected: ${socket.user.username} (${socket.id}) - Reason: ${reason}`);
            } else {
                logger.info(`Guest user disconnected: ${socket.id} - Reason: ${reason}`);
            }
            
            // Update session activity but don't remove it (preserve for reconnection)
            const session = sessionStore.getSessionBySocketId(socket.id);
            if (session) {
                sessionStore.updateActivity(session.sessionId);
                logger.info(`Session preserved for potential reconnection: ${session.playerName} in game ${session.gameId}`);
                
                // Emit disconnection event to game with session info
                if (socket.gameId) {
                    socket.to(socket.gameId).emit('player_session_disconnected', {
                        playerId: socket.id,
                        playerName: socket.playerName || session.playerName,
                        disconnectReason: reason,
                        sessionPreserved: true,
                        timestamp: Date.now()
                    });
                    
                }
            } else {
                logger.warn(`No session found for disconnecting socket: ${socket.id}`);
            }
        });

        // Join game room with enhanced validation
        socket.on('joinGame', (data) => {
            try {
                // Validate socket state
                const socketValidation = socketValidator.validateSocketState(socket, 'joinGame');
                if (!socketValidation.isValid) {
                    socket.emit('error', {
                        message: 'Cannot join game: invalid socket state',
                        details: socketValidation.errors,
                        code: 'INVALID_SOCKET_STATE'
                    });
                    return;
                }
                
                const { gameId, playerName } = data || {};
                
                // Validate required data
                if (!gameId) {
                    socket.emit('error', {
                        message: 'Game ID is required to join a game',
                        code: 'MISSING_GAME_ID'
                    });
                    return;
                }
                
                // Determine player name
                const finalPlayerName = socket.isAuthenticated 
                    ? (socket.user.profile?.displayName || socket.user.username)
                    : (playerName || `Guest_${socket.id.slice(0, 6)}`);
                
                // Check if player is already in a game
                if (socket.gameId) {
                    logger.warn(`Player ${finalPlayerName} attempted to join game ${gameId} while already in game ${socket.gameId}`);
                    socket.emit('error', {
                        message: 'Already in a game. Leave current game first.',
                        currentGameId: socket.gameId,
                        code: 'ALREADY_IN_GAME'
                    });
                    return;
                }
                
                // Check for existing session conflicts
                const existingSession = socket.isAuthenticated 
                    ? sessionStore.getSessionByAuthId(socket.userId)
                    : sessionStore.findSessionByNameAndGame(finalPlayerName, gameId);
                
                if (existingSession && existingSession.gameId !== gameId) {
                    logger.warn(`Player ${finalPlayerName} has existing session in different game: ${existingSession.gameId}`);
                    socket.emit('error', {
                        message: 'You have an existing session in another game',
                        existingGameId: existingSession.gameId,
                        code: 'EXISTING_SESSION_CONFLICT'
                    });
                    return;
                }
                
                // Join the room
                socket.join(gameId);
                
                // Set player context atomically
                socket.gameId = gameId;
                socket.playerName = finalPlayerName;
                
                // Create or update session for this player
                const sessionData = sessionStore.createSession(
                    socket.id,   // socketId
                    socket.id,   // playerId is socket.id
                    gameId,
                    socket.playerName,
                    socket.userId || null // authId for authenticated users
                );
                
                if (!sessionData) {
                    logger.error(`Failed to create session for ${socket.playerName} in game ${gameId}`);
                    socket.emit('error', {
                        message: 'Failed to create game session',
                        code: 'SESSION_CREATION_FAILED'
                    });
                    return;
                }
                
                logger.info(`Player ${socket.playerName} joined game ${gameId} (${socket.id}) - session created`);
                
                // Notify other players
                socket.to(gameId).emit('playerJoined', {
                    playerId: socket.id,
                    playerName: socket.playerName,
                    isAuthenticated: socket.isAuthenticated,
                    userId: socket.userId || null,
                    timestamp: Date.now()
                });
                
                // Confirm join to player
                socket.emit('gameJoined', {
                    gameId,
                    playerId: socket.id,
                    playerName: socket.playerName,
                    sessionId: sessionData.sessionId,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                logger.error(`Error in joinGame for socket ${socket.id}:`, error);
                socket.emit('error', {
                    message: 'Internal server error while joining game',
                    code: 'INTERNAL_ERROR'
                });
            }
        });

        // Leave game room
        socket.on('leaveGame', (gameId) => {
            socket.leave(gameId);
            
            logger.info(`Player ${socket.playerName || socket.id} left game ${gameId}`);
            
            // Remove session when player intentionally leaves
            const session = sessionStore.getSessionBySocketId(socket.id);
            if (session) {
                sessionStore.removeSession(session.sessionId);
            }
            
            // Notify other players
            socket.to(gameId).emit('playerLeft', {
                playerId: socket.id,
                playerName: socket.playerName
            });
            
            // Clear game context
            socket.gameId = null;
            socket.playerName = null;
        });

        // Auto-reconnection handler with robust error recovery
        socket.on('auto_reconnect', async (data) => {
            const startTime = Date.now();
            let reconnectionAttempt = null;
            
            try {
                // Validate socket state
                if (!socket || socket.disconnected) {
                    logger.error(`Auto-reconnection attempted on invalid socket: ${socket?.id || 'undefined'}`);
                    return;
                }
                
                const { gameId } = data || {};
                
                // Create reconnection attempt record
                reconnectionAttempt = {
                    socketId: socket.id,
                    gameId: gameId,
                    userId: socket.userId,
                    username: socket.user?.username,
                    isAuthenticated: socket.isAuthenticated,
                    startTime: startTime
                };
                
                logger.info(`Auto-reconnection attempt started: ${JSON.stringify(reconnectionAttempt)}`);
                
                let reconnectionData = null;
                
                if (socket.isAuthenticated && socket.userId) {
                    // Try reconnection by authenticated user ID
                    reconnectionData = sessionStore.getReconnectionData(socket.userId);
                    if (!reconnectionData.success && gameId) {
                        // Fallback: try by username and game ID
                        reconnectionData = sessionStore.getReconnectionData(socket.user.username, gameId);
                    }
                } else if (gameId) {
                    // For guest users, need both game ID and player name from session
                    const guestName = socket.playerName || `Guest_${socket.id.slice(0, 6)}`;
                    const existingSession = sessionStore.findSessionByNameAndGame(guestName, gameId);
                    if (existingSession) {
                        reconnectionData = { success: true, ...existingSession };
                    }
                }
                
                if (reconnectionData && reconnectionData.success) {
                    // Validate reconnection data
                    if (!reconnectionData.gameId || !reconnectionData.playerName) {
                        throw new Error('Invalid reconnection data: missing gameId or playerName');
                    }
                    
                    // Validate game state for restoration
                    const gameValidation = socketValidator.validateGameStateForRestoration(
                        reconnectionData.gameId,
                        socket.id,
                        reconnectionData.playerName
                    );
                    
                    if (!gameValidation.canRestore) {
                        logger.warn(`Game state validation failed for auto-reconnection: ${gameValidation.errors.join(', ')}`);
                        if (!socket.disconnected) {
                            socket.emit('auto_reconnect_failed', {
                                error: 'Cannot restore to this game state',
                                code: 'GAME_STATE_INVALID',
                                details: gameValidation.errors,
                                canRetry: false
                            });
                        }
                        return;
                    }
                    
                    // Update session with new socket ID
                    const newSessionId = sessionStore.updateSessionSocket(
                        reconnectionData.sessionId || socket.id,
                        socket.id
                    );
                    
                    if (newSessionId) {
                        // Validate socket is still connected before proceeding
                        if (socket.disconnected) {
                            logger.warn(`Socket disconnected during auto-reconnection: ${socket.id}`);
                            return;
                        }
                        
                        // Set player context atomically
                        socket.gameId = reconnectionData.gameId;
                        socket.playerName = reconnectionData.playerName;
                        
                        // Join the game room with error handling
                        try {
                            socket.join(reconnectionData.gameId);
                        } catch (joinError) {
                            logger.error(`Failed to join game room during auto-reconnection: ${joinError.message}`);
                            throw new Error(`Failed to join game room: ${joinError.message}`);
                        }
                        
                        const duration = Date.now() - startTime;
                        logger.info(`Auto-reconnection successful: ${reconnectionData.playerName} reconnected to game ${reconnectionData.gameId} (${socket.id}) in ${duration}ms`);
                        
                        // Emit successful reconnection with validation
                        if (!socket.disconnected) {
                            socket.emit('auto_reconnect_success', {
                                gameId: reconnectionData.gameId,
                                playerId: socket.id,
                                playerName: reconnectionData.playerName,
                                reconnectionCount: reconnectionData.reconnectionCount,
                                sessionDuration: duration,
                                message: 'Successfully reconnected to your previous game'
                            });
                            
                            // Notify game about reconnection
                            socket.emit('request_game_restore', {
                                gameId: reconnectionData.gameId,
                                playerId: socket.id,
                                playerName: reconnectionData.playerName
                            });
                            
                        }
                    } else {
                        throw new Error('Failed to update session - possible race condition');
                    }
                } else {
                    const error = reconnectionData?.error || 'No valid session found for reconnection';
                    logger.warn(`Auto-reconnection failed for ${socket.id}: ${error}`);
                    
                    if (!socket.disconnected) {
                        socket.emit('auto_reconnect_failed', {
                            error: error,
                            code: 'NO_SESSION_FOUND',
                            canRetry: false
                        });
                    }
                }
            } catch (error) {
                const duration = Date.now() - startTime;
                logger.error(`Auto-reconnection error for ${socket?.id || 'undefined'} after ${duration}ms:`, {
                    error: error.message,
                    stack: error.stack,
                    attempt: reconnectionAttempt
                });
                
                if (socket && !socket.disconnected) {
                    socket.emit('auto_reconnect_failed', {
                        error: 'Internal server error during reconnection',
                        code: 'INTERNAL_ERROR',
                        details: error.message,
                        canRetry: true,
                        retryDelay: 5000
                    });
                }
            }
        });

        // Manual reconnection handler with enhanced error recovery
        socket.on('manual_reconnect', async (data) => {
            const startTime = Date.now();
            let reconnectionContext = null;
            
            try {
                // Validate socket state
                if (!socket || socket.disconnected) {
                    logger.error(`Manual reconnection attempted on invalid socket: ${socket?.id || 'undefined'}`);
                    return;
                }
                
                const { gameId, playerName } = data || {};
                
                // Validate required parameters
                if (!gameId || !playerName) {
                    logger.warn(`Manual reconnection missing params: gameId=${gameId}, playerName=${playerName}`);
                    if (!socket.disconnected) {
                        socket.emit('manual_reconnect_failed', {
                            error: 'Game ID and player name are required',
                            code: 'MISSING_PARAMS',
                            canRetry: false
                        });
                    }
                    return;
                }
                
                // Create reconnection context for debugging
                reconnectionContext = {
                    socketId: socket.id,
                    gameId: gameId,
                    playerName: playerName,
                    userId: socket.userId,
                    isAuthenticated: socket.isAuthenticated,
                    startTime: startTime
                };
                
                logger.info(`Manual reconnection attempt: ${JSON.stringify(reconnectionContext)}`);
                
                // Try to find existing session with multiple strategies
                let session = null;
                let sessionSource = 'none';
                
                if (socket.isAuthenticated && socket.userId) {
                    // Strategy 1: For authenticated users, try by auth ID first
                    session = sessionStore.getSessionByAuthId(socket.userId);
                    if (session && session.gameId === gameId) {
                        sessionSource = 'auth_id';
                    } else {
                        session = null;
                    }
                }
                
                if (!session) {
                    // Strategy 2: Fallback to name and game lookup
                    session = sessionStore.findSessionByNameAndGame(playerName, gameId);
                    if (session) {
                        sessionSource = 'name_game';
                    }
                }
                
                // Validate session
                if (!session) {
                    logger.warn(`No session found for manual reconnection: ${JSON.stringify(reconnectionContext)}`);
                    if (!socket.disconnected) {
                        socket.emit('manual_reconnect_failed', {
                            error: 'No session found for the specified game and player',
                            code: 'SESSION_NOT_FOUND',
                            canRetry: false
                        });
                    }
                    return;
                }
                
                // Validate session is still valid
                const sessionId = session.sessionId || Object.keys(sessionStore.sessions.entries()).find(
                    ([_, s]) => s === session
                )?.[0];
                
                if (!sessionId || !sessionStore.isSessionValid(sessionId)) {
                    logger.warn(`Session expired for manual reconnection: ${sessionId}`);
                    if (!socket.disconnected) {
                        socket.emit('manual_reconnect_failed', {
                            error: 'Session has expired',
                            code: 'SESSION_EXPIRED',
                            canRetry: false
                        });
                    }
                    return;
                }
                
                // Update session with new socket ID
                const newSessionId = sessionStore.updateSessionSocket(sessionId, socket.id);
                
                if (!newSessionId) {
                    throw new Error('Failed to update session - possible concurrent access');
                }
                
                // Validate socket is still connected before proceeding
                if (socket.disconnected) {
                    logger.warn(`Socket disconnected during manual reconnection: ${socket.id}`);
                    return;
                }
                
                // Set player context atomically
                socket.gameId = gameId;
                socket.playerName = playerName;
                
                // Join the game room with error handling
                try {
                    socket.join(gameId);
                } catch (joinError) {
                    logger.error(`Failed to join game room during manual reconnection: ${joinError.message}`);
                    throw new Error(`Failed to join game room: ${joinError.message}`);
                }
                
                const duration = Date.now() - startTime;
                logger.info(`Manual reconnection successful: ${playerName} reconnected to game ${gameId} (${socket.id}) via ${sessionSource} in ${duration}ms`);
                
                // Emit successful reconnection with validation
                if (!socket.disconnected) {
                    socket.emit('manual_reconnect_success', {
                        gameId: gameId,
                        playerId: socket.id,
                        playerName: playerName,
                        reconnectionCount: session.reconnectionCount || 0,
                        sessionSource: sessionSource,
                        duration: duration,
                        message: 'Successfully reconnected to game'
                    });
                    
                    // Notify game about reconnection
                    socket.emit('request_game_restore', {
                        gameId: gameId,
                        playerId: socket.id,
                        playerName: playerName
                    });
                    
                }
                
            } catch (error) {
                const duration = Date.now() - startTime;
                logger.error(`Manual reconnection error for ${socket?.id || 'undefined'} after ${duration}ms:`, {
                    error: error.message,
                    stack: error.stack,
                    context: reconnectionContext
                });
                
                if (socket && !socket.disconnected) {
                    socket.emit('manual_reconnect_failed', {
                        error: 'Internal server error during reconnection',
                        code: 'INTERNAL_ERROR',
                        details: error.message,
                        canRetry: true,
                        retryDelay: 3000
                    });
                }
            }
        });

        // Handle game moves
        socket.on('makeMove', (data) => {
            if (!socket.gameId) {
                socket.emit('error', { message: 'Not in a game' });
                return;
            }
            
            logger.info(`Player ${socket.playerName} made a move in game ${socket.gameId}:`, data);
            
            // Add player context to move data
            const moveData = {
                ...data,
                playerId: socket.id,
                playerName: socket.playerName,
                userId: socket.userId || null,
                timestamp: new Date().toISOString()
            };
            
            // Emit the move to other players in the game
            socket.to(socket.gameId).emit('moveMade', moveData);
        });

        // Handle chat messages (authenticated users only)
        socket.on('chatMessage', (data) => {
            if (!socket.isAuthenticated) {
                socket.emit('error', { message: 'Authentication required for chat' });
                return;
            }
            
            if (!socket.gameId) {
                socket.emit('error', { message: 'Not in a game' });
                return;
            }
            
            const messageData = {
                id: `msg_${Date.now()}_${socket.id.slice(0, 6)}`,
                playerId: socket.id,
                playerName: socket.user.username,
                userId: socket.userId,
                message: data.message,
                timestamp: new Date().toISOString()
            };
            
            // Emit to all players in the game including sender
            io.to(socket.gameId).emit('chatMessage', messageData);
            
            logger.info(`Chat message from ${socket.user.username} in game ${socket.gameId}: ${data.message}`);
        });

        // Handle game state requests
        socket.on('getGameState', (data) => {
            const gameId = data?.gameId || data;
            // This would typically fetch game state from game service
            // For now, return a mock game state for testing
            socket.emit('gameState', { 
                gameId,
                currentPlayer: socket.id,
                players: [socket.id],
                gamePhase: 'playing',
                timestamp: Date.now()
            });
        });
        
        // Handle reconnection requests (for testing compatibility)
        socket.on('reconnect', (data) => {
            try {
                const { sessionId, playerId } = data || {};
                
                if (!sessionId || !playerId) {
                    socket.emit('error', {
                        message: 'Session ID and Player ID are required for reconnection',
                        code: 'MISSING_RECONNECT_DATA'
                    });
                    return;
                }
                
                // Try to find the session
                const session = sessionStore.getSession(sessionId);
                if (!session || !sessionStore.isSessionValid(sessionId)) {
                    socket.emit('error', {
                        message: 'Invalid session for reconnection',
                        code: 'INVALID_SESSION'
                    });
                    return;
                }
                
                // Validate the player ID matches
                if (session.playerId !== playerId) {
                    socket.emit('error', {
                        message: 'Player ID mismatch for session',
                        code: 'PLAYER_MISMATCH'
                    });
                    return;
                }
                
                // Update session with new socket ID
                const updatedSessionId = sessionStore.updateSessionSocket(sessionId, socket.id);
                if (!updatedSessionId) {
                    socket.emit('error', {
                        message: 'Failed to update session for reconnection',
                        code: 'SESSION_UPDATE_FAILED'
                    });
                    return;
                }
                
                // Set player context
                socket.gameId = session.gameId;
                socket.playerName = session.playerName;
                
                // Join the game room
                socket.join(session.gameId);
                
                // Confirm successful reconnection
                socket.emit('reconnected', {
                    success: true,
                    gameId: session.gameId,
                    playerId: session.playerId,
                    playerName: session.playerName,
                    sessionId: updatedSessionId,
                    reconnectionCount: session.reconnectionCount,
                    timestamp: Date.now()
                });
                
                logger.info(`Player ${session.playerName} reconnected to game ${session.gameId} (${socket.id})`);
                
            } catch (error) {
                logger.error('Reconnection error:', error);
                socket.emit('error', {
                    message: 'Internal server error during reconnection',
                    code: 'RECONNECTION_ERROR'
                });
            }
        });
        
        // Handle game start requests (for testing)
        socket.on('startGame', (data) => {
            const gameId = data?.gameId;
            if (!gameId) {
                socket.emit('error', {
                    message: 'Game ID is required to start game',
                    code: 'MISSING_GAME_ID'
                });
                return;
            }
            
            // For testing, just emit game started event
            socket.to(gameId).emit('gameStarted', {
                gameId,
                startedBy: socket.id,
                timestamp: Date.now()
            });
            
            socket.emit('gameStarted', {
                gameId,
                startedBy: socket.id,
                timestamp: Date.now()
            });
            
            logger.info(`Game ${gameId} started by ${socket.playerName} (${socket.id})`);
        });
        
        // Handle authentication (for testing)
        socket.on('authenticate', (data) => {
            const { authToken } = data || {};
            if (!authToken) {
                socket.emit('error', {
                    message: 'Auth token is required',
                    code: 'MISSING_AUTH_TOKEN'
                });
                return;
            }
            
            // For testing, just update session with auth token
            const session = sessionStore.getSessionBySocketId(socket.id);
            if (session) {
                sessionStore.updateSession(session.sessionId, { authToken });
                socket.emit('authenticated', {
                    success: true,
                    authToken,
                    timestamp: Date.now()
                });
            } else {
                socket.emit('error', {
                    message: 'No session found for authentication',
                    code: 'NO_SESSION'
                });
            }
        });

        // Handle authentication token refresh
        socket.on('refreshAuth', async (data) => {
            try {
                const { token } = data;
                
                if (!token) {
                    socket.emit('auth_error', { 
                        code: 'NO_TOKEN', 
                        message: 'No token provided' 
                    });
                    return;
                }

                const secret = process.env.JWT_SECRET;
                const decoded = jwt.verify(token, secret);
                const user = await UserStore.findById(decoded.id);
                
                if (user && user.profile.isActive && !user.isLocked()) {
                    socket.user = user;
                    socket.isAuthenticated = true;
                    socket.userId = user.id;
                    
                    socket.emit('authRefreshed', {
                        user: user.toPublicJSON()
                    });
                    
                    logger.info(`Socket authentication refreshed: ${user.username} (${socket.id})`);
                } else {
                    socket.emit('auth_error', { 
                        code: 'USER_INVALID', 
                        message: 'User account is not valid' 
                    });
                }
            } catch (error) {
                socket.emit('auth_error', { 
                    code: 'TOKEN_INVALID', 
                    message: 'Invalid or expired token' 
                });
            }
        });



    });
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = {
    initSocket,
    getIO,
};