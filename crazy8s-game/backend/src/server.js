// Load environment variables first
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const app = require('./app');
const Game = require('./models/game');
const UserStore = require('./stores/UserStore');
const sessionStore = require('./stores/SessionStore');
const connectionHandler = require('./utils/connectionHandler');
const GameEventEmitter = require('./utils/eventEmitter');
const { gracefulShutdown } = require('./config/database');
const logger = require('./utils/logger');
const gameTimers = new Map();

// Environment variable validation
function validateEnvironment() {
  const requiredVars = ['JWT_SECRET'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  // Validate JWT_SECRET is not the default value
  if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
    logger.error('JWT_SECRET is set to the default value. Please change it for security.');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      logger.warn('Using default JWT_SECRET in development mode - this is insecure!');
    }
  }
  
  logger.info('Environment validation passed');
}

// Validate environment on startup
validateEnvironment();

const server = http.createServer(app);

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // Allow unauthenticated connections (guest mode)
      socket.user = null;
      socket.isAuthenticated = false;
      socket.isGuest = true;
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
        socket.isGuest = true;
        return next();
      }
      
      if (!user.profile.isActive) {
        logger.warn(`Socket authentication failed - account deactivated: ${user.username}`);
        socket.user = null;
        socket.isAuthenticated = false;
        socket.isGuest = true;
        return next();
      }
      
      if (user.isLocked()) {
        logger.warn(`Socket authentication failed - account locked: ${user.username}`);
        socket.user = null;
        socket.isAuthenticated = false;
        socket.isGuest = true;
        return next();
      }
      
      // Set user context on socket
      socket.user = user;
      socket.isAuthenticated = true;
      socket.isGuest = false;
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
      socket.isGuest = true;
      next();
    }
  } catch (error) {
    logger.error('Socket authentication middleware error:', error);
    socket.user = null;
    socket.isAuthenticated = false;
    socket.isGuest = true;
    next();
  }
};

// Updated CORS configuration for production
const io = socketIo(server, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? [
                "https://crazy8s.me/", 
                "https://crazy8s-production.up.railway.app",
              ]
            : ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    },
    // Additional configuration for production
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

// Initialize event emitter with IO instance
const eventEmitter = new GameEventEmitter(io);

// Apply authentication middleware
io.use(authenticateSocket);

// Add Express CORS middleware as well
app.use((req, res, next) => {
    const allowedOrigins = process.env.NODE_ENV === 'production'
        ? [
            "https://crazy8s.me/", 
            "https://crazy8s-production.up.railway.app",
          ]
        : ["http://localhost:3000", "http://localhost:3001"];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Store connected players
// Map of socketId -> { name, gameId, playerId, user, isAuthenticated }
const connectedPlayers = new Map();

// Helper to get display name for a player
const getPlayerDisplayName = (socket, providedName = null) => {
    if (socket.isAuthenticated && socket.user) {
        return socket.user.profile.displayName || socket.user.username;
    }
    return providedName || `Guest_${socket.id.slice(0, 6)}`;
};

// Helper to update user statistics after game
const updateUserGameStats = async (userId, gameResult) => {
    if (!userId) return; // Skip for guest users
    
    try {
        const user = await UserStore.findById(userId);
        if (user) {
            user.updateGameStats(gameResult);
            await UserStore.update(userId, {
                statistics: user.statistics,
                updatedAt: new Date()
            });
            logger.info(`Updated game statistics for user: ${user.username}`);
        }
    } catch (error) {
        logger.error('Error updating user game statistics:', error);
    }
};

// Helper to find which socket currently controls a given player
const getSocketForPlayer = (gameId, playerId) => {
    for (const [sockId, info] of connectedPlayers.entries()) {
        if (info.gameId === gameId && info.playerId === playerId) {
            return sockId;
        }
    }
    return null;
};

// Helper function to broadcast game state to all players in a game
const broadcastGameState = (gameId) => {
    console.log(`broadcastGameState called for gameId: ${gameId}`);
    const game = Game.findById(gameId);
    if (game) {
        const gameState = game.getGameState();
        console.log(`Broadcasting game state for ${gameId}:`);
        console.log(`  Current Player: ${gameState.currentPlayer} (ID: ${gameState.currentPlayerId})`);
        console.log(`  Players: ${gameState.players.map(p => `${p.name}(${p.isCurrentPlayer ? 'CURRENT' : 'waiting'})`).join(', ')}`);
        
        // Send game state to all players in the game
        io.to(gameId).emit('gameUpdate', gameState);
        
        // Send each player their updated hand
        game.players.forEach(player => {
            const hand = game.getPlayerHand(player.id);
            console.log(`  Sending hand to ${player.name}: ${hand.length} cards`);
            const targetSocket = getSocketForPlayer(gameId, player.id);
            if (targetSocket) {
                io.to(targetSocket).emit('handUpdate', hand);
            }
        });
    }
};

// Helper function to check tournament progress and send notifications
const checkTournamentProgress = (gameId) => {
    const game = Game.findById(gameId);
    if (!game || !game.tournamentActive) return;
    
    // Check for player safety notifications
    game.safePlayersThisRound.forEach(player => {
        const alreadyNotified = game.safePlayerNotifications?.has(player.id);
        if (!alreadyNotified) {
            game.safePlayerNotifications.add(player.id);
            
            io.to(gameId).emit('playerSafe', {
                playerId: player.id,
                playerName: player.name,
                safePosition: game.safePlayersThisRound.length,
                message: `${player.name} is safe and advances to the next round!`
            });
        }
    });
    
    // Check for round end
    const playersStillPlaying = game.activePlayers.filter(p => !p.isSafe && !p.isEliminated);
    if (playersStillPlaying.length <= 1 && game.roundInProgress) {
        // Round is ending soon
        setTimeout(() => {
            const updatedGame = Game.findById(gameId);
            if (updatedGame && updatedGame.gameState === 'tournament_finished') {
                // Tournament finished
                io.to(gameId).emit('tournamentFinished', {
                    winner: updatedGame.tournamentWinner,
                    stats: updatedGame.calculateTournamentStats(),
                    message: `🏆 ${updatedGame.tournamentWinner.name} wins the tournament!`
                });
            } else if (updatedGame && !updatedGame.roundInProgress) {
                // Round ended, new round starting
                io.to(gameId).emit('roundEnded', {
                    round: updatedGame.currentRound - 1,
                    safeePlayers: updatedGame.safePlayersThisRound.map(p => p.name),
                    eliminatedPlayers: updatedGame.eliminatedThisRound.map(p => p.name),
                    nextRoundStartsIn: 10,
                    activePlayers: updatedGame.activePlayers.length
                });
            }
        }, 500);
    }
};

// Set up Socket.IO connections
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
        
        // Record login activity
        socket.user.recordLogin(
            socket.handshake.address, 
            socket.handshake.headers['user-agent']
        );
        UserStore.update(socket.userId, {
            security: socket.user.security
        }).catch(error => {
            logger.error('Error updating login activity:', error);
        });
    } else {
        logger.info(`Guest user connected: ${socket.id}`);
        socket.emit('guest_connected', { socketId: socket.id });
    }

    socket.emit('connect_success', { 
        socketId: socket.id,
        isAuthenticated: socket.isAuthenticated,
        user: socket.isAuthenticated ? socket.user.toPublicJSON() : null
    });

    // Handle creating a new game
    socket.on('createGame', (data) => {
        try {
            const { playerName } = data;
            const displayName = getPlayerDisplayName(socket, playerName);
            
            if (!displayName) {
                socket.emit('error', 'Player name is required');
                return;
            }

            // Create new game with this player
            const game = new Game([socket.id], [displayName], socket.id);
            Game.addGame(game);
            game.onAutoPass = (playerId) => {
                const player = game.getPlayerById(playerId);
                broadcastGameState(game.id);
                io.to(game.id).emit('playerAutoPassed', { playerName: player?.name });
            };
            
            // Store player info
            connectedPlayers.set(socket.id, {
                name: displayName,
                gameId: game.id,
                playerId: socket.id,
                user: socket.user,
                userId: socket.userId,
                isAuthenticated: socket.isAuthenticated
            });

            // Join socket room for this game
            socket.join(game.id);

            console.log(`Game ${game.id} created by ${displayName} (${socket.id}) - ${socket.isAuthenticated ? 'Authenticated' : 'Guest'}`);
            socket.emit('success', `Game created! Game ID: ${game.id}`);
            broadcastGameState(game.id);

        } catch (error) {
            console.error('Error creating game:', error);
            socket.emit('error', 'Failed to create game');
        }
    });

    // Handle creating a debug game with custom hands
    socket.on('createDebugGame', (data) => {
        try {
            const { playerIds, playerNames, customHands, startingCard, debugMode } = data;

            console.log('🐛 Creating debug game:', {
                playerCount: playerIds.length,
                playerNames,
                startingCard: `${startingCard.rank} of ${startingCard.suit}`
            });

            const game = new Game(playerIds, playerNames, playerIds[0]);
            game.debugMode = debugMode;
            Game.addGame(game);
            game.onAutoPass = (playerId) => {
                const player = game.getPlayerById(playerId);
                broadcastGameState(game.id);
                io.to(game.id).emit('playerAutoPassed', { playerName: player?.name });
            };

            game.gameState = 'playing';
            game.currentPlayerIndex = 0;

            playerIds.forEach((id, index) => {
                const player = game.getPlayerById(id);
                if (player && customHands[index]) {
                    player.hand = [...customHands[index]];
                }
            });

            game.discardPile = [startingCard];

            const { createDeck } = require('./utils/deck');
            const fullDeck = createDeck();
            const used = [...customHands.flat(), startingCard];
            game.drawPile = fullDeck.filter(card =>
                !used.some(u => u.suit === card.suit && u.rank === card.rank)
            );

            // Track the creator's socket control over the first debug player
            connectedPlayers.set(socket.id, {
                name: playerNames[0],
                gameId: game.id,
                playerId: playerIds[0],
                user: socket.user,
                userId: socket.userId,
                isAuthenticated: socket.isAuthenticated
            });

            socket.join(game.id);

            console.log(`🐛 Debug game ${game.id} created successfully`);
            socket.emit('success', `Debug game created! Game ID: ${game.id}`);
            broadcastGameState(game.id);

        } catch (error) {
            console.error('🐛 Error creating debug game:', error);
            socket.emit('error', 'Failed to create debug game: ' + error.message);
        }
    });

    // Allow the debug client to switch which player ID it controls
    socket.on('switchPlayer', (data) => {
        try {
            const { newPlayerId } = data;
            const info = connectedPlayers.get(socket.id);
            if (!info) {
                socket.emit('error', 'Not connected to a game');
                return;
            }

            const game = Game.findById(info.gameId);
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            const player = game.getPlayerById(newPlayerId);
            if (!player) {
                socket.emit('error', 'Player not found');
                return;
            }

            info.playerId = newPlayerId;
            info.name = player.name;

            const hand = game.getPlayerHand(newPlayerId);
            io.to(socket.id).emit('handUpdate', hand);
            socket.emit('success', `Switched control to ${player.name}`);

            // Also send updated game state so client knows which hand to show
            broadcastGameState(info.gameId);

        } catch (error) {
            console.error('Error switching player:', error);
            socket.emit('error', 'Failed to switch player');
        }
    });
  
    // Handle joining an existing game
    socket.on('joinGame', (data) => {
        try {
            const { gameId, playerName } = data;
            const displayName = getPlayerDisplayName(socket, playerName);
            
            if (!gameId || !displayName) {
                socket.emit('error', 'Game ID and player name are required');
                return;
            }

            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            if (game.gameState === 'playing') {
                socket.emit('error', 'Game has already started');
                return;
            }

            if (game.players.length >= 4) {
                socket.emit('error', 'Game is full (maximum 4 players)');
                return;
            }

            // Check if player is already in the game
            const existingPlayer = game.players.find(p => p.id === socket.id);
            if (!existingPlayer) {
                // Add player to game
                const newPlayer = {
                    id: socket.id,
                    name: displayName,
                    hand: [],
                    isSafe: false,
                    isEliminated: false,
                    isConnected: true,
                    userId: socket.userId || null,
                    isAuthenticated: socket.isAuthenticated
                };

                game.players.push(newPlayer);
                game.activePlayers.push(newPlayer);
            }

            // Store player info
            connectedPlayers.set(socket.id, {
                name: displayName,
                gameId: gameId,
                playerId: socket.id,
                user: socket.user,
                userId: socket.userId,
                isAuthenticated: socket.isAuthenticated
            });

            // Join socket room for this game
            socket.join(gameId);

            console.log(`${displayName} (${socket.id}) joined game ${gameId} - ${socket.isAuthenticated ? 'Authenticated' : 'Guest'}`);
            socket.emit('success', `Joined game ${gameId}!`);
            
            // Notify all players in the game
            broadcastGameState(gameId);

        } catch (error) {
            console.error('Error joining game:', error);
            socket.emit('error', 'Failed to join game');
        }
    });

    // Handle starting the game
    socket.on('startGame', (data) => {
        try {
            const { gameId, timerSettings } = data;
            const game = Game.findById(gameId);
            
            if (!game) {
            socket.emit('error', 'Game not found');
            return;
            }

            console.log(`Starting game ${gameId} with players:`, game.players.map(p => `${p.name}(${p.id})`));

            const result = game.startGame();
            
            if (result.success) {
            console.log(`Game ${gameId} started successfully`);
            
            // Start the timer if timer settings provided
            if (timerSettings && timerSettings.enableTimer) {
                manageGameTimer(gameId, 'start', timerSettings);
            }
            
            // Notify all players
            broadcastGameState(game.id);
            io.to(gameId).emit('success', 'Game started!');
            } else {
            console.log(`Failed to start game ${gameId}:`, result.error);
            socket.emit('error', result.error);
            }

        } catch (error) {
            console.error('Error starting game:', error);
            socket.emit('error', 'Failed to start game');
        }
        });

    // Handle playing a card
    socket.on('playCard', (data) => {
        try {
            const { gameId, cards, declaredSuit, timerSettings } = data;
            
            if (!gameId) {
            socket.emit('error', 'Game ID is required');
            return;
            }

            if (!cards || (Array.isArray(cards) && cards.length === 0)) {
            socket.emit('error', 'No cards specified');
            return;
            }

            const game = Game.findById(gameId);
            
            if (!game) {
            socket.emit('error', 'Game not found');
            return;
            }

            // Determine which player this socket controls
            const info = connectedPlayers.get(socket.id);
            const playerId = info ? info.playerId : socket.id;
            const player = game.getPlayerById(playerId);
            if (!player) {
            socket.emit('error', 'You are not part of this game');
            return;
            }

            console.log(`${player.name} (${socket.id}) attempting to play cards:`, cards);

            const result = game.playCard(playerId, cards, declaredSuit);
            
            if (result.success) {
            console.log(`Card play successful by ${player.name}`);
            
            // Reset timer for next player's turn
            if (timerSettings && timerSettings.enableTimer) {
                manageGameTimer(gameId, 'reset', timerSettings);
            }
            
            // Check tournament progress for safety notifications
            checkTournamentProgress(gameId);
            
            // Broadcast updated game state to all players in the game
            broadcastGameState(gameId);
            
            // Send success message to the player who played
            socket.emit('success', result.message || 'Card(s) played successfully');
            
            // Broadcast the play to OTHER players in the game (not the one who played)
            socket.to(gameId).emit('cardPlayed', {
                playerName: player.name,
                playerId: player.id,
                message: result.message          // Use the formatted message from backend
            });

            } else {
            console.log(`Card play failed by ${player.name}: ${result.error}`);
            socket.emit('error', result.error);
            }

        } catch (error) {
            console.error('Error playing card:', error);
            socket.emit('error', 'Failed to play card: ' + error.message);
        }
    });
    
    socket.on('updateTimerSettings', (data) => {
        try {
            const { gameId, timerSettings } = data;
            const game = Game.findById(gameId);
            
            if (!game) {
            socket.emit('error', 'Game not found');
            return;
            }
            
            // Store timer settings on the game object
            const oldSettings = game.timerSettings || {};
            game.timerSettings = timerSettings;
            
            // Generate specific success message based on what changed
            let message = 'Timer settings updated';
            if (oldSettings.enableTimer !== timerSettings.enableTimer) {
                message = timerSettings.enableTimer ? 'Turn timer enabled' : 'Turn timer disabled';
            } else if (oldSettings.timerDuration !== timerSettings.timerDuration) {
                const minutes = Math.floor(timerSettings.timerDuration / 60);
                const seconds = timerSettings.timerDuration % 60;
                const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;
                message = `Timer duration set to ${timeStr}`;
            } else if (oldSettings.timerWarningTime !== timerSettings.timerWarningTime) {
                message = `Timer warning set to ${timerSettings.timerWarningTime} seconds`;
            }
            
            // If game is in progress, restart timer with new settings
            if (game.gameState === 'playing' && timerSettings.enableTimer) {
            manageGameTimer(gameId, 'reset', timerSettings);
            } else if (!timerSettings.enableTimer) {
            manageGameTimer(gameId, 'stop');
            }
            
            socket.emit('success', message);
            
        } catch (error) {
            console.error('Error updating timer settings:', error);
            socket.emit('error', 'Failed to update timer settings');
        }
        });

    // Handle drawing cards
    socket.on('drawCard', (data) => {
        try {
            const { gameId, count = 1, timerSettings } = data; // Add timerSettings destructuring
            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            // Determine which player this socket controls
            const info = connectedPlayers.get(socket.id);
            const playerId = info ? info.playerId : socket.id;
            const player = game.getPlayerById(playerId);
            if (!player) {
                socket.emit('error', 'You are not part of this game');
                return;
            }

            console.log(`${player.name} attempting to draw ${count} cards`);

            const result = game.drawCards(playerId, count);
            
            if (result.success) {
                console.log(`${player.name} drew ${result.drawnCards.length} cards`);
                
                // Broadcast updated game state to all players
                broadcastGameState(gameId);
                
                // Send success message with draw details
                socket.emit('drawComplete', {
                    success: true,
                    message: `Drew ${result.drawnCards.length} card(s)`,
                    drawnCards: result.drawnCards,
                    playableDrawnCards: result.playableDrawnCards,
                    canPlayDrawnCard: result.canPlayDrawnCard,
                    fromSpecialCard: result.fromSpecialCard
                });
                
                // Notify other players that this player drew cards
                socket.to(gameId).emit('playerDrewCards', {
                    playerName: player.name,
                    cardCount: result.drawnCards.length,
                    canPlayDrawn: result.canPlayDrawnCard
                });

                // RESET TIMER IF TURN PASSED TO NEXT PLAYER (NEW CODE)
                // If the current player changed after drawing (meaning turn was passed automatically)
                const currentPlayerAfterDraw = game.getCurrentPlayer();
                if (currentPlayerAfterDraw && currentPlayerAfterDraw.id !== playerId && timerSettings && timerSettings.enableTimer) {
                    console.log(`⏰ Turn passed to ${currentPlayerAfterDraw.name} after draw - resetting timer`);
                    manageGameTimer(gameId, 'reset', timerSettings);
                }

            } else {
                console.log(`Draw cards failed for ${player.name}: ${result.error}`);
                socket.emit('error', result.error);
            }

        } catch (error) {
            console.error('Error drawing cards:', error);
            socket.emit('error', 'Failed to draw cards');
        }
    });

    // New event: Play a card that was just drawn
    socket.on('passTurnAfterDraw', (data) => {
        try {
            const { gameId, timerSettings } = data; // Add timerSettings destructuring
            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            const info = connectedPlayers.get(socket.id);
            const playerId = info ? info.playerId : socket.id;
            const player = game.getPlayerById(playerId);
            if (!player) {
                socket.emit('error', 'You are not part of this game');
                return;
            }

            console.log(`${player.name} passing turn after drawing`);

            const result = game.passTurnAfterDraw(playerId);
            
            if (result.success) {
                console.log(`${player.name} passed turn successfully`);
                
                // RESET TIMER FOR NEXT PLAYER 
                if (timerSettings && timerSettings.enableTimer) {
                    console.log(`⏰ ${player.name} passed turn - resetting timer for next player`);
                    manageGameTimer(gameId, 'reset', timerSettings);
                }
                
                // Broadcast updated game state to all players
                broadcastGameState(gameId);
                
                socket.emit('success', 'Turn passed');
                
                // Notify other players
                socket.to(gameId).emit('playerPassedTurn', {
                    playerName: player.name
                });

            } else {
                console.log(`Pass turn failed for ${player.name}: ${result.error}`);
                socket.emit('error', result.error);
            }

        } catch (error) {
            console.error('Error passing turn:', error);
            socket.emit('error', 'Failed to pass turn');
        }
    });

    // Handle chat messages
    socket.on('chat message', (message) => {
        try {
            const player = connectedPlayers.get(socket.id);
            if (player) {
                const formattedMessage = `${player.name}: ${message}`;
                io.to(player.gameId).emit('chat message', formattedMessage);
                console.log(`Chat message in game ${player.gameId}: ${formattedMessage}`);
            }
        } catch (error) {
            console.error('Error handling chat message:', error);
        }
    });

    // Handle disconnection (enhanced with session preservation)
    socket.on('disconnect', (reason) => {
        console.log(`Player disconnected: ${socket.id} - Reason: ${reason}`);
        
        try {
            const player = connectedPlayers.get(socket.id);
            if (player) {
                const game = Game.findById(player.gameId);
                if (game) {
                    // Mark player as disconnected but preserve game state
                    const gamePlayer = game.players.find(p => p.id === player.playerId);
                    if (gamePlayer) {
                        gamePlayer.isConnected = false;
                        console.log(`${gamePlayer.name} disconnected from game ${player.gameId}`);
                        logger.info(`Player ${gamePlayer.name} disconnected from game ${player.gameId} (${socket.id}) - Reason: ${reason}`);
                    }
                    
                    // Update session activity (preserve session for reconnection)
                    const session = sessionStore.getSession(socket.id);
                    if (session) {
                        sessionStore.updateActivity(socket.id);
                        logger.info(`Session preserved for ${session.playerName} in game ${session.gameId} - available for reconnection`);
                    }
                    
                    // If all players disconnect, start cleanup timer (but don't immediately destroy)
                    const connectedPlayersInGame = game.players.filter(p => p.isConnected);
                    if (connectedPlayersInGame.length === 0) {
                        logger.info(`All players disconnected from game ${player.gameId}. Starting extended cleanup timer.`);
                        
                        // Start a longer timer for completely empty games (30 minutes)
                        const cleanupTimer = setTimeout(() => {
                            logger.info(`Cleaning up abandoned game ${player.gameId} after extended timeout`);
                            manageGameTimer(player.gameId, 'stop');
                            Game.removeGame(player.gameId);
                            
                            // Clean up sessions for this game
                            const gameSessions = sessionStore.getGameSessions(player.gameId);
                            gameSessions.forEach(session => {
                                sessionStore.removeSession(session.sessionId);
                            });
                        }, 30 * 60 * 1000); // 30 minutes
                        
                        gameTimers.set(`cleanup_${player.gameId}`, cleanupTimer);
                    } else {
                        // Some players still connected, just manage regular game timer
                        manageGameTimer(player.gameId, 'stop');
                    }
                    
                    // Notify other players about disconnection
                    socket.to(player.gameId).emit('playerDisconnected', {
                        playerName: player.name,
                        playerId: socket.id,
                        disconnectReason: reason,
                        timestamp: Date.now(),
                        sessionPreserved: true
                    });
                    
                    // Broadcast updated game state
                    broadcastGameState(player.gameId);
                }
                
                // Remove from connected players but keep session for reconnection
                connectedPlayers.delete(socket.id);
            }
        } catch (error) {
            console.error('Error handling disconnect:', error);
            logger.error(`Error handling disconnect for ${socket.id}:`, error);
        }
    });

    // Handle reconnection (enhanced with session store)
    socket.on('reconnect', (data) => {
        try {
            const { gameId, playerName } = data;
            
            if (!gameId || !playerName) {
                socket.emit('error', 'Game ID and player name are required for reconnection');
                logger.warn(`Reconnection failed: Missing gameId or playerName from ${socket.id}`);
                return;
            }

            const game = Game.findById(gameId);
            if (!game) {
                socket.emit('error', 'Game not found');
                logger.warn(`Reconnection failed: Game ${gameId} not found for player ${playerName}`);
                return;
            }

            // Find the player by name (since socket ID will be different)
            const gamePlayer = game.players.find(p => p.name === playerName);
            if (!gamePlayer) {
                socket.emit('error', 'Player not found in this game');
                logger.warn(`Reconnection failed: Player ${playerName} not found in game ${gameId}`);
                return;
            }

            // Check if there's a valid session for this player
            let session = sessionStore.findSessionByNameAndGame(playerName, gameId);
            if (!session) {
                // Try to find session by authenticated user if available
                if (socket.isAuthenticated) {
                    session = sessionStore.getSessionByAuthId(socket.userId);
                    if (session && (session.gameId !== gameId || session.playerName !== playerName)) {
                        session = null; // Session doesn't match current reconnection attempt
                    }
                }
            }

            // Update player's socket ID and mark as connected
            const oldPlayerId = gamePlayer.id;
            gamePlayer.id = socket.id;
            gamePlayer.isConnected = true;

            // Update stored player info
            connectedPlayers.set(socket.id, {
                name: playerName,
                gameId: gameId,
                playerId: gamePlayer.id
            });

            // Update or create session
            if (session) {
                sessionStore.updateSessionSocket(session.sessionId || oldPlayerId, socket.id);
                logger.info(`Session updated for reconnection: ${playerName} to game ${gameId} (${socket.id})`);
            } else {
                sessionStore.createSession(
                    socket.id,
                    socket.id,
                    gameId,
                    playerName,
                    socket.userId || null
                );
                logger.info(`New session created for reconnection: ${playerName} to game ${gameId} (${socket.id})`);
            }

            // Join socket room
            socket.join(gameId);

            // Clear any existing timers
            if (gameTimers.has(gameId)) {
                clearTimeout(gameTimers.get(gameId));
                gameTimers.delete(gameId);
                logger.info(`Cleared game timer for ${gameId} due to player reconnection`);
            }

            // Send current game state
            broadcastGameState(gameId);
            
            socket.emit('success', 'Reconnected successfully');
            socket.to(gameId).emit('playerReconnected', { 
                playerName,
                playerId: socket.id,
                timestamp: Date.now(),
                reconnectionCount: session ? (session.reconnectionCount || 0) : 0
            });

            logger.info(`Player ${playerName} successfully reconnected to game ${gameId} (${socket.id})`);

        } catch (error) {
            console.error('Error handling reconnection:', error);
            logger.error(`Reconnection error for ${playerName} to ${gameId}:`, error);
            socket.emit('error', 'Failed to reconnect');
        }
    });

    // Handle play again request
    socket.on('playAgain', (data) => {
        try {
            const { gameId } = data;
            
            if (!gameId) {
                socket.emit('error', 'Game ID is required for play again');
                return;
            }

            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            // Verify the requesting player is part of this game
            const player = connectedPlayers.get(socket.id);
            if (!player || player.gameId !== gameId) {
                socket.emit('error', 'You are not part of this game');
                return;
            }

            console.log(`🔄 Play again requested by ${player.name} for game ${gameId}`);

            // Call the resetForNewGame method
            const result = game.resetForNewGame();
            
            if (result.success) {
                console.log(`🔄 Game ${gameId} successfully reset for new game`);
                
                // Restart timer if timer settings are available and enabled
                if (game.timerSettings && game.timerSettings.enableTimer) {
                    console.log('🔄 Restarting timer for new game');
                    manageGameTimer(gameId, 'start', game.timerSettings);
                }
                
                // Broadcast updated game state to all players in the game
                broadcastGameState(gameId);
                
                // Send success message to all players
                io.to(gameId).emit('success', `🎮 New game started! ${result.message}`);
                
                // Send special notification about the new game
                io.to(gameId).emit('newGameStarted', {
                    message: 'A new game has started!',
                    playerCount: game.players.length,
                    startedBy: player.name
                });

                console.log(`🔄 New game notifications sent to all players in ${gameId}`);
                
            } else {
                console.log(`🔄 Failed to reset game ${gameId}: ${result.error}`);
                socket.emit('error', result.error);
            }

        } catch (error) {
            console.error('🔄 Error handling play again:', error);
            socket.emit('error', 'Failed to start new game: ' + error.message);
        }
    });

    // Handle play again vote
    socket.on('votePlayAgain', (data) => {
        console.log('🗳️ [SERVER] Received votePlayAgain:', data);
        try {
            const { gameId } = data;
            
            if (!gameId) {
                socket.emit('error', 'Game ID is required for play again vote');
                return;
            }

            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            // Verify the requesting player is part of this game
            const player = connectedPlayers.get(socket.id);
            if (!player || player.gameId !== gameId) {
                socket.emit('error', 'You are not part of this game');
                return;
            }

            console.log(`🗳️ Play again vote by ${player.name} for game ${gameId}`);

            // Add the vote
            const voteResult = game.addPlayAgainVote(player.playerId);
            
            if (voteResult.success) {
                // Broadcast vote status to all players
                io.to(gameId).emit('playAgainVoteUpdate', {
                    votedPlayers: voteResult.votedPlayers,
                    totalPlayers: voteResult.totalPlayers,
                    allVoted: voteResult.allVoted,
                    creatorVoted: voteResult.creatorVoted,
                    canStartGame: voteResult.canStartGame,
                    gameCreator: voteResult.gameCreator
                });

                console.log(`🗳️ Vote update sent: ${voteResult.votedPlayers.length}/${voteResult.totalPlayers} voted`);
            } else {
                socket.emit('error', voteResult.error);
            }

        } catch (error) {
            console.error('🗳️ Error handling play again vote:', error);
            socket.emit('error', 'Failed to process vote: ' + error.message);
        }
    });

    // Handle removing play again vote
    socket.on('removePlayAgainVote', (data) => {
        console.log('🗳️ [SERVER] Received removePlayAgainVote:', data);
        try {
            const { gameId } = data;
            const game = Game.findById(gameId);
            const player = connectedPlayers.get(socket.id);
            
            if (!game || !player || player.gameId !== gameId) {
                socket.emit('error', 'Invalid game or player');
                return;
            }

            console.log(`🗳️ Removing play again vote by ${player.name} for game ${gameId}`);

            const voteResult = game.removePlayAgainVote(player.playerId);
            
            if (voteResult.success) {
                io.to(gameId).emit('playAgainVoteUpdate', {
                    votedPlayers: voteResult.votedPlayers,
                    totalPlayers: voteResult.totalPlayers,
                    allVoted: voteResult.allVoted,
                    creatorVoted: voteResult.creatorVoted,
                    canStartGame: voteResult.canStartGame,
                    gameCreator: voteResult.gameCreator
                });
            }

        } catch (error) {
            console.error('🗳️ Error removing play again vote:', error);
            socket.emit('error', 'Failed to remove vote: ' + error.message);
        }
    });

    // Handle actual game start (only by creator when all voted)
    socket.on('startNewGame', (data) => {
        try {
            const { gameId } = data;
            const game = Game.findById(gameId);
            const player = connectedPlayers.get(socket.id);
            
            if (!game || !player || player.gameId !== gameId) {
                socket.emit('error', 'Invalid game or player');
                return;
            }

            // Only game creator can start the new game
            if (player.playerId !== game.gameCreator) {
                socket.emit('error', 'Only the game creator can start the new game');
                return;
            }

            const votingStatus = game.getPlayAgainVotingStatus();
            if (!votingStatus.canStartGame) {
                socket.emit('error', 'Cannot start game - not all players have voted or creator has not voted');
                return;
            }

            console.log(`🚀 Starting new game by creator ${player.name} for game ${gameId}`);

            // Call the resetForNewGame method
            const result = game.resetForNewGame();
            
            if (result.success) {
                console.log(`🔄 Game ${gameId} successfully reset for new game`);
                
                // Restart timer if timer settings are available and enabled
                if (game.timerSettings && game.timerSettings.enableTimer) {
                    console.log('🔄 Restarting timer for new game');
                    manageGameTimer(gameId, 'start', game.timerSettings);
                }
                
                // Broadcast updated game state to all players in the game
                broadcastGameState(gameId);
                
                // Send success message to all players
                io.to(gameId).emit('success', `🎮 New game started! ${result.message}`);
                
                // Send special notification about the new game
                io.to(gameId).emit('newGameStarted', {
                    message: 'A new game has started!',
                    playerCount: game.players.length,
                    startedBy: player.name
                });

                console.log(`🔄 New game notifications sent to all players in ${gameId}`);
                
            } else {
                console.log(`🔄 Failed to reset game ${gameId}: ${result.error}`);
                socket.emit('error', result.error);
            }

        } catch (error) {
            console.error('🚀 Error starting new game:', error);
            socket.emit('error', 'Failed to start new game: ' + error.message);
        }
    });

    // Handle getting tournament status
    socket.on('getTournamentStatus', (data) => {
        try {
            const { gameId } = data;
            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            const tournamentStatus = game.getTournamentStatus();
            socket.emit('tournamentStatus', tournamentStatus);

        } catch (error) {
            console.error('Error getting tournament status:', error);
            socket.emit('error', 'Failed to get tournament status');
        }
    });

    // Handle reconnecting to tournament
    socket.on('reconnectToTournament', (data) => {
        try {
            const { gameId, playerName } = data;
            
            if (!gameId || !playerName) {
                socket.emit('error', 'Game ID and player name are required');
                return;
            }

            const game = Game.findById(gameId);
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            // Find the player by name
            const gamePlayer = game.players.find(p => p.name === playerName);
            if (!gamePlayer) {
                socket.emit('error', 'Player not found in this game');
                return;
            }

            // Update player's socket ID and mark as connected
            gamePlayer.id = socket.id;
            gamePlayer.isConnected = true;

            // Update stored player info
            connectedPlayers.set(socket.id, {
                name: gamePlayer.name,
                gameId: gameId,
                playerId: gamePlayer.id,
                user: socket.user,
                userId: socket.userId,
                isAuthenticated: socket.isAuthenticated
            });

            // Join socket room
            socket.join(gameId);

            // Send current tournament status
            const tournamentStatus = game.getTournamentStatus();
            socket.emit('tournamentStatus', tournamentStatus);
            
            // Send current game state
            broadcastGameState(gameId);
            
            socket.emit('success', 'Reconnected to tournament successfully');
            socket.to(gameId).emit('playerReconnected', { playerName });

            console.log(`Player ${playerName} reconnected to tournament ${gameId}`);

        } catch (error) {
            console.error('Error handling tournament reconnection:', error);
            socket.emit('error', 'Failed to reconnect to tournament');
        }
    });

    // Handle manual start next round (by safe players)
    socket.on('startNextRound', (data) => {
        try {
            const { gameId } = data;
            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            // Verify player is part of the game
            const player = connectedPlayers.get(socket.id);
            if (!player || player.gameId !== gameId) {
                socket.emit('error', 'You are not part of this game');
                return;
            }

            console.log(`🚀 Manual start next round requested by ${player.name} for game ${gameId}`);
            console.log(`🔍 Debug - Socket ID: ${socket.id}, Player ID from mapping: ${player.playerId}`);
            console.log(`🔍 Debug - Game players:`, game.players.map(p => ({ id: p.id, name: p.name, isSafe: p.isSafe })));

            const result = game.manualStartNextRound(player.playerId);
            
            if (result.success) {
                // Check tournament progress
                checkTournamentProgress(gameId);
                
                // Broadcast updated state
                broadcastGameState(gameId);
                
                socket.emit('success', result.message);
                io.to(gameId).emit('roundStarted', {
                    message: result.message,
                    startedBy: result.startedBy,
                    round: game.currentRound
                });
            } else {
                socket.emit('error', result.error);
            }

        } catch (error) {
            console.error('Error starting next round:', error);
            socket.emit('error', 'Failed to start next round');
        }
    });

    // Handle admin force next round (for testing/admin purposes)
    socket.on('forceNextRound', (data) => {
        try {
            const { gameId } = data;
            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            // Verify player is part of the game (basic security)
            const player = connectedPlayers.get(socket.id);
            if (!player || player.gameId !== gameId) {
                socket.emit('error', 'You are not part of this game');
                return;
            }

            // Only the game creator (or in debug mode) may force rounds
            if (!game.debugMode && player.playerId !== game.gameCreator) {
                socket.emit('error', 'Only the game creator can force round progression');
                return;
            }

            console.log(`🔧 Force next round requested by ${player.name} for game ${gameId}`);

            // Force end current round if in progress
            if (game.roundInProgress) {
                game.endCurrentRound();
                
                // Check tournament progress
                checkTournamentProgress(gameId);
                
                // Broadcast updated state
                broadcastGameState(gameId);
                
                socket.emit('success', 'Round forced to end');
                io.to(gameId).emit('adminAction', {
                    action: 'forceNextRound',
                    by: player.name
                });
            } else {
                socket.emit('error', 'No round in progress to force');
            }

        } catch (error) {
            console.error('Error forcing next round:', error);
            socket.emit('error', 'Failed to force next round');
        }
    });

    // Handle authentication token refresh in active connection
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
                socket.isGuest = false;
                socket.userId = user.id;
                
                // Update player info if in a game
                const playerInfo = connectedPlayers.get(socket.id);
                if (playerInfo) {
                    playerInfo.user = user;
                    playerInfo.userId = user.id;
                    playerInfo.isAuthenticated = true;
                    playerInfo.name = user.profile.displayName || user.username;
                }
                
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
    
    // Handle getting user statistics (authenticated users only)
    socket.on('getUserStats', async () => {
        try {
            if (!socket.isAuthenticated) {
                socket.emit('error', 'Authentication required to view statistics');
                return;
            }
            
            socket.emit('userStats', {
                success: true,
                statistics: socket.user.statistics
            });
        } catch (error) {
            console.error('Error getting user stats:', error);
            socket.emit('error', 'Failed to get user statistics');
        }
    });
    
    // Handle updating user settings (authenticated users only)
    socket.on('updateUserSettings', async (settings) => {
        try {
            if (!socket.isAuthenticated) {
                socket.emit('error', 'Authentication required to update settings');
                return;
            }
            
            const settingsValidation = socket.user.constructor.validateSettings(settings);
            if (!settingsValidation.isValid) {
                socket.emit('error', settingsValidation.error);
                return;
            }
            
            socket.user.updateGameSettings(settings);
            await UserStore.update(socket.userId, {
                gameSettings: socket.user.gameSettings
            });
            
            socket.emit('settingsUpdated', {
                success: true,
                settings: socket.user.gameSettings
            });
            
            logger.info(`Settings updated for ${socket.user.username}`);
        } catch (error) {
            console.error('Error updating user settings:', error);
            socket.emit('error', 'Failed to update settings');
        }
    });
});

// Broadcast timer updates to all players in a game
const broadcastTimerUpdate = (gameId, timeLeft, isWarning) => {
  io.to(gameId).emit('timerUpdate', {
    timeLeft,
    isWarning
  });
};

// Start/stop the game timer
const manageGameTimer = (gameId, action, settings = {}) => {
  const { timerDuration = 60, timerWarningTime = 15, enableTimer = true } = settings;
  
  if (action === 'start' && enableTimer) {
    // Clear existing timer if any
    if (gameTimers.has(gameId)) {
      clearInterval(gameTimers.get(gameId).interval);
    }
    
    let timeLeft = timerDuration;
    let isWarning = false;
    
    const interval = setInterval(() => {
      timeLeft--;
      
      if (timeLeft <= timerWarningTime && !isWarning) {
        isWarning = true;
      }
      
      // Broadcast timer update to all players in the game
      broadcastTimerUpdate(gameId, timeLeft, isWarning);
      
      if (timeLeft <= 0) {
        clearInterval(interval);
        gameTimers.delete(gameId);
        
        // Handle timer expiration for the current player
        const game = Game.findById(gameId);
        if (game && game.gameState === 'playing') {
          const currentPlayer = game.getCurrentPlayer();
          if (currentPlayer) {
            console.log(`⏰ Timer expired for ${currentPlayer.name}`);
            
            // Check if player has already drawn this turn
            const hasDrawn = game.playersWhoHaveDrawn.has(currentPlayer.id);
            
            if (!hasDrawn) {
              // Player hasn't drawn yet - auto-draw card
              console.log(`Auto-drawing card for ${currentPlayer.name}`);
              const drawResult = game.drawCards(currentPlayer.id, 1);
              if (drawResult.success) {
                setTimeout(() => {
                  // Check if pendingTurnPass was set (player has playable cards)
                  if (game.pendingTurnPass === currentPlayer.id) {
                    game.passTurnAfterDraw(currentPlayer.id);
                  }
                  // If pendingTurnPass is null, turn was already auto-passed
                  broadcastGameState(gameId);
                  
                  // Start timer for next player
                  manageGameTimer(gameId, 'start', settings);
                }, 500);
              }
            } else {
              // Player has drawn but hasn't passed turn - force pass
              console.log(`Force passing turn for ${currentPlayer.name} who already drew`);
              if (game.pendingTurnPass === currentPlayer.id) {
                game.passTurnAfterDraw(currentPlayer.id);
              } else {
                // Fallback: just advance to next player
                game.nextPlayer();
              }
              broadcastGameState(gameId);
              
              // Start timer for next player
              manageGameTimer(gameId, 'start', settings);
            }
            
            broadcastGameState(gameId);
          }
        }
      }
    }, 1000);
    
    gameTimers.set(gameId, {
      interval,
      timeLeft,
      isWarning,
      settings
    });
    
    // Send initial timer state
    broadcastTimerUpdate(gameId, timeLeft, isWarning);
    
  } else if (action === 'stop') {
    if (gameTimers.has(gameId)) {
      clearInterval(gameTimers.get(gameId).interval);
      gameTimers.delete(gameId);
    }
  } else if (action === 'reset' && enableTimer) {
    manageGameTimer(gameId, 'stop');
    manageGameTimer(gameId, 'start', settings);
  }
};

// Graceful shutdown handling
const gracefulShutdownHandler = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database connections
      await gracefulShutdown();
      
      // Clear all game timers
      for (const [gameId, timer] of gameTimers.entries()) {
        clearInterval(timer.interval);
        logger.info(`Cleared timer for game ${gameId}`);
      }
      gameTimers.clear();
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdownHandler('SIGTERM'));
process.on('SIGINT', () => gracefulShutdownHandler('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdownHandler('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdownHandler('unhandledRejection');
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🗄️  Database type: ${process.env.DB_TYPE || 'mongodb'}`);
});

// Export server for testing
module.exports = server;