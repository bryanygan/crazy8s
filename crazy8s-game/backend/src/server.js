const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const Game = require('./models/game');

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000", // Allow React app
        methods: ["GET", "POST"]
    }
});

// Store connected players
const connectedPlayers = new Map();

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

            socket.emit('success', `Game created! Game ID: ${game.id}`);
            socket.emit('gameUpdate', game.getGameState());
            socket.emit('handUpdate', game.getPlayerHand(socket.id));

            console.log(`Game ${game.id} created by ${playerName}`);

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

            socket.emit('success', `Joined game ${gameId}!`);
            
            // Notify all players in the game
            io.to(gameId).emit('gameUpdate', game.getGameState());
            socket.emit('handUpdate', game.getPlayerHand(socket.id));

            console.log(`${playerName} joined game ${gameId}`);

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

            const result = game.startGame();
            
            if (result.success) {
                // Notify all players
                io.to(gameId).emit('gameUpdate', game.getGameState());
                
                // Send each player their hand
                game.players.forEach(player => {
                    io.to(player.id).emit('handUpdate', game.getPlayerHand(player.id));
                });

                io.to(gameId).emit('success', 'Game started!');
                console.log(`Game ${gameId} started`);
            } else {
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
            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            const result = game.playCard(socket.id, cards, declaredSuit);
            
            if (result.success) {
                // Notify all players of game state update
                io.to(gameId).emit('gameUpdate', game.getGameState());
                
                // Send updated hands to all players
                game.players.forEach(player => {
                    io.to(player.id).emit('handUpdate', game.getPlayerHand(player.id));
                });

                io.to(gameId).emit('success', result.message || 'Card played successfully');
                console.log(`Card played in game ${gameId}`);
            } else {
                socket.emit('error', result.error);
            }

        } catch (error) {
            console.error('Error playing card:', error);
            socket.emit('error', 'Failed to play card');
        }
    });

    // Handle drawing cards
    socket.on('drawCard', (data) => {
        try {
            const { gameId } = data;
            const game = Game.findById(gameId);
            
            if (!game) {
                socket.emit('error', 'Game not found');
                return;
            }

            const result = game.drawCards(socket.id);
            
            if (result.success) {
                // Notify all players of game state update
                io.to(gameId).emit('gameUpdate', game.getGameState());
                
                // Send updated hand to the player who drew
                socket.emit('handUpdate', game.getPlayerHand(socket.id));

                socket.emit('success', `Drew ${result.drawnCards.length} card(s)`);
                console.log(`Cards drawn in game ${gameId}`);
            } else {
                socket.emit('error', result.error);
            }

        } catch (error) {
            console.error('Error drawing cards:', error);
            socket.emit('error', 'Failed to draw cards');
        }
    });

    // Handle chat messages
    socket.on('chat message', (message) => {
        const player = connectedPlayers.get(socket.id);
        if (player) {
            const formattedMessage = `${player.name}: ${message}`;
            io.to(player.gameId).emit('chat message', formattedMessage);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A player disconnected:', socket.id);
        
        const player = connectedPlayers.get(socket.id);
        if (player) {
            const game = Game.findById(player.gameId);
            if (game) {
                // Mark player as disconnected
                const gamePlayer = game.players.find(p => p.id === socket.id);
                if (gamePlayer) {
                    gamePlayer.isConnected = false;
                }
                
                // Notify other players
                io.to(player.gameId).emit('gameUpdate', game.getGameState());
            }
            
            connectedPlayers.delete(socket.id);
        }
    });
});

// Start the server
const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid conflict with React
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});