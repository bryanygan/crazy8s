const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const Game = require('./models/game');

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"], // Allow React app
        methods: ["GET", "POST"]
    }
});

// Store connected players
const connectedPlayers = new Map();

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
            io.to(player.id).emit('handUpdate', hand);
        });
    }
};

// Set up Socket.IO connections
io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

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
            
            // Store player info
            connectedPlayers.set(socket.id, {
                name: playerName,
                gameId: game.id
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
                gameId: gameId
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
            const { gameId } = data;
            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            console.log(`Starting game ${gameId} with players:`, game.players.map(p => `${p.name}(${p.id})`));

            const result = game.startGame();
            
            if (result.success) {
                console.log(`Game ${gameId} started successfully`);
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
            const { gameId, cards, declaredSuit } = data;
            
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

            // Ensure the player is part of this game
            const player = game.getPlayerById(socket.id);
            if (!player) {
                socket.emit('error', 'You are not part of this game');
                return;
            }

            console.log(`${player.name} (${socket.id}) attempting to play cards:`, cards);
            
            const result = game.playCard(socket.id, cards, declaredSuit);
            
            if (result.success) {
                console.log(`Card play successful by ${player.name}`);
                
                // Broadcast updated game state to all players in the game
                broadcastGameState(gameId);
                
                // Send success message to the player who played
                socket.emit('success', result.message || 'Card(s) played successfully');
                
                // Broadcast the play to all players in the game
                io.to(gameId).emit('cardPlayed', {
                    playerName: player.name,
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

    // Handle drawing cards
    socket.on('drawCard', (data) => {
        try {
            const { gameId, count = 1 } = data;
            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            // Ensure the player is part of this game
            const player = game.getPlayerById(socket.id);
            if (!player) {
                socket.emit('error', 'You are not part of this game');
                return;
            }

            console.log(`${player.name} attempting to draw ${count} cards`);

            const result = game.drawCards(socket.id, count);
            
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
    socket.on('playDrawnCard', (data) => {
        try {
            const { gameId, card, declaredSuit } = data;
            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            const player = game.getPlayerById(socket.id);
            if (!player) {
                socket.emit('error', 'You are not part of this game');
                return;
            }

            console.log(`${player.name} attempting to play drawn card:`, card);

            const result = game.playDrawnCard(socket.id, card, declaredSuit);
            
            if (result.success) {
                console.log(`${player.name} played drawn card successfully`);
                
                // Broadcast updated game state to all players
                broadcastGameState(gameId);
                
                socket.emit('success', result.message || 'Drawn card played successfully');
                
                // Broadcast the play to all players
                io.to(gameId).emit('cardPlayed', {
                    playerName: player.name,
                    cardsPlayed: result.cardsPlayed,
                    message: result.message,
                    wasDrawnCard: true
                });

            } else {
                console.log(`Play drawn card failed for ${player.name}: ${result.error}`);
                socket.emit('error', result.error);
            }

        } catch (error) {
            console.error('Error playing drawn card:', error);
            socket.emit('error', 'Failed to play drawn card');
        }
    });

    // New event: Pass turn after drawing
    socket.on('passTurnAfterDraw', (data) => {
        try {
            const { gameId } = data;
            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            const player = game.getPlayerById(socket.id);
            if (!player) {
                socket.emit('error', 'You are not part of this game');
                return;
            }

            console.log(`${player.name} passing turn after drawing`);

            const result = game.passTurnAfterDraw(socket.id);
            
            if (result.success) {
                console.log(`${player.name} passed turn successfully`);
                
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
                    const gamePlayer = game.players.find(p => p.id === socket.id);
                    if (gamePlayer) {
                        gamePlayer.isConnected = false;
                        console.log(`${gamePlayer.name} disconnected from game ${player.gameId}`);
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
                gameId: gameId
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
});

// Start the server
const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid conflict with React
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});