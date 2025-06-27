const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const Game = require('./models/game');
const gameTimers = new Map();

const server = http.createServer(app);

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
        allowedHeaders: ["Content-Type"],
        credentials: true
    },
    // Additional configuration for production
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
    pingTimeout: 60000,
    pingInterval: 25000
});

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
// Map of socketId -> { name, gameId, playerId }
const connectedPlayers = new Map();

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

// Set up Socket.IO connections
io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    socket.emit('connect_success', { socketId: socket.id });

    // Handle creating a new game
    socket.on('createGame', (data) => {
        try {
            const { playerName } = data;
            
            if (!playerName) {
                socket.emit('error', 'Player name is required');
                return;
            }

            // Create new game with this player
            const game = new Game([socket.id], [playerName]);
            Game.addGame(game);
            game.onAutoPass = (playerId) => {
                const player = game.getPlayerById(playerId);
                broadcastGameState(game.id);
                io.to(game.id).emit('playerAutoPassed', { playerName: player?.name });
            };
            
            // Store player info
            connectedPlayers.set(socket.id, {
                name: playerName,
                gameId: game.id,
                playerId: socket.id
            });

            // Join socket room for this game
            socket.join(game.id);

            console.log(`Game ${game.id} created by ${playerName} (${socket.id})`);
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

            const game = new Game(playerIds, playerNames);
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
                playerId: playerIds[0]
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
            
            if (!gameId || !playerName) {
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
                    name: playerName,
                    hand: [],
                    isSafe: false,
                    isEliminated: false,
                    isConnected: true
                };

                game.players.push(newPlayer);
                game.activePlayers.push(newPlayer);
            }

            // Store player info
            connectedPlayers.set(socket.id, {
                name: playerName,
                gameId: gameId,
                playerId: socket.id
            });

            // Join socket room for this game
            socket.join(gameId);

            console.log(`${playerName} (${socket.id}) joined game ${gameId}`);
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
            
            // Broadcast updated game state to all players in the game
            broadcastGameState(gameId);
            
            // Send success message to the player who played
            socket.emit('success', result.message || 'Card(s) played successfully');
            
            // Broadcast the play to OTHER players in the game (not the one who played)
            socket.to(gameId).emit('cardPlayed', {
                playerName: player.name,
                playerId: player.id,
                cardsPlayed: result.cardsPlayed,
                message: result.message
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
            game.timerSettings = timerSettings;
            
            // If game is in progress, restart timer with new settings
            if (game.gameState === 'playing' && timerSettings.enableTimer) {
            manageGameTimer(gameId, 'reset', timerSettings);
            } else if (!timerSettings.enableTimer) {
            manageGameTimer(gameId, 'stop');
            }
            
            socket.emit('success', 'Timer settings updated');
            
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

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A player disconnected:', socket.id);
        
        try {
            const player = connectedPlayers.get(socket.id);
            if (player) {
            const game = Game.findById(player.gameId);
            if (game) {
                // Mark player as disconnected
                const gamePlayer = game.players.find(p => p.id === player.playerId);
                if (gamePlayer) {
                gamePlayer.isConnected = false;
                console.log(`${gamePlayer.name} disconnected from game ${player.gameId}`);
                }
                
                // If game becomes empty, clean up timer
                const connectedPlayers = game.players.filter(p => p.isConnected);
                if (connectedPlayers.length === 0) {
                manageGameTimer(player.gameId, 'stop');
                }
                
                // Notify other players
                socket.to(player.gameId).emit('playerDisconnected', {
                playerName: player.name
                });
                
                // Broadcast updated game state
                broadcastGameState(player.gameId);
            }
            
            connectedPlayers.delete(socket.id);
            }
        } catch (error) {
            console.error('Error handling disconnect:', error);
        }
        });

    // Handle reconnection
    socket.on('reconnect', (data) => {
        try {
            const { gameId, playerName } = data;
            
            if (!gameId || !playerName) {
                socket.emit('error', 'Game ID and player name are required for reconnection');
                return;
            }

            const game = Game.findById(gameId);
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            // Find the player by name (since socket ID will be different)
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
                name: playerName,
                gameId: gameId,
                playerId: gamePlayer.id
            });

            // Join socket room
            socket.join(gameId);

            // Send current game state
            broadcastGameState(gameId);
            
            socket.emit('success', 'Reconnected successfully');
            socket.to(gameId).emit('playerReconnected', { playerName });

            console.log(`Player ${playerName} reconnected to game ${gameId}`);

        } catch (error) {
            console.error('Error handling reconnection:', error);
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
        
        // Auto-draw for the current player
        const game = Game.findById(gameId);
        if (game && game.gameState === 'playing') {
          const currentPlayer = game.getCurrentPlayer();
          if (currentPlayer) {
            console.log(`⏰ Timer expired for ${currentPlayer.name} - auto drawing card`);
            
            // Auto-draw and pass turn
            const drawResult = game.drawCards(currentPlayer.id, 1);
            if (drawResult.success) {
              setTimeout(() => {
                game.passTurnAfterDraw(currentPlayer.id);
                broadcastGameState(gameId);
                
                // Start timer for next player
                manageGameTimer(gameId, 'start', settings);
              }, 500);
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

// Start the server
const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid conflict with React
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});