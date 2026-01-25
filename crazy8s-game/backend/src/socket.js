const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const UserStore = require('./stores/UserStore');
const logger = require('./utils/logger');
const { TIMEOUT_CONFIG, getTimeout } = require('./config/timeouts');

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
    // Get optimized timeout configurations
    const socketTimeouts = getTimeout('socket');
    
    io = socketIO(server, {
        cors: {
            origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
            credentials: true
        },
        // Optimized configuration for 8-player games with complex scenarios
        pingTimeout: socketTimeouts.pingTimeout,          // 120s (increased from 60s)
        pingInterval: socketTimeouts.pingInterval,        // 30s (increased from 25s)
        connectTimeout: socketTimeouts.connectionTimeout, // 30s connection timeout
        upgradeTimeout: socketTimeouts.upgradeTimeout,    // 15s upgrade timeout
        transports: ['websocket', 'polling'],
        // Additional optimizations
        allowEIO3: true,
        rememberUpgrade: true,
        compression: true,
        serveClient: false
    });
    
    logger.info('Socket.IO initialized with optimized timeouts:', {
        pingTimeout: `${socketTimeouts.pingTimeout / 1000}s`,
        pingInterval: `${socketTimeouts.pingInterval / 1000}s`,
        connectionTimeout: `${socketTimeouts.connectionTimeout / 1000}s`
    });


    // Apply authentication middleware
    io.use(authenticateSocket);

    io.on('connection', (socket) => {
        
        if (socket.isAuthenticated) {
            logger.info(`Authenticated user connected: ${socket.user.username} (${socket.id})`);
            
            // Join user to their personal room for direct messages
            socket.join(`user_${socket.userId}`);
            
            
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
            
            if (socket.isAuthenticated) {
                logger.info(`Authenticated user disconnected: ${socket.user.username} (${socket.id}) - Reason: ${reason}`);
            } else {
                logger.info(`Guest user disconnected: ${socket.id} - Reason: ${reason}`);
            }
        });

        // Join game room with enhanced validation
        socket.on('joinGame', (data) => {
            try {
                
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
                
                
                // Join the room
                socket.join(gameId);
                
                // Set player context atomically
                socket.gameId = gameId;
                socket.playerName = finalPlayerName;
                
                logger.info(`Player ${socket.playerName} joined game ${gameId} (${socket.id})`);
                
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
            
            
            // Notify other players
            socket.to(gameId).emit('playerLeft', {
                playerId: socket.id,
                playerName: socket.playerName
            });
            
            // Clear game context
            socket.gameId = null;
            socket.playerName = null;
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