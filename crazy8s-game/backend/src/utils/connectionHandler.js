const sessionStore = require('../stores/SessionStore');
const Game = require('../models/game');
const logger = require('./logger');

class ConnectionHandler {
    constructor() {
        this.reconnectionTimeouts = new Map(); // Track reconnection timeouts
        this.heartbeatIntervals = new Map(); // Track heartbeat intervals
    }

    /**
     * Handle edge case: Network blip (quick disconnect/reconnect)
     */
    handleNetworkBlip(socket, gameId, playerName) {
        const blipKey = `${gameId}_${playerName}`;
        
        // If there's an existing timeout for this player, clear it
        if (this.reconnectionTimeouts.has(blipKey)) {
            clearTimeout(this.reconnectionTimeouts.get(blipKey));
            this.reconnectionTimeouts.delete(blipKey);
            logger.info(`Cleared previous reconnection timeout for ${playerName} in game ${gameId}`);
        }

        // Set a short grace period for network blips (5 seconds)
        const timeout = setTimeout(() => {
            this.handleGracefulDisconnect(gameId, playerName);
            this.reconnectionTimeouts.delete(blipKey);
        }, 5000);

        this.reconnectionTimeouts.set(blipKey, timeout);
        logger.info(`Network blip detected for ${playerName} in game ${gameId}, grace period started`);
    }

    /**
     * Handle graceful disconnection after grace period
     */
    handleGracefulDisconnect(gameId, playerName) {
        const game = Game.findById(gameId);
        if (!game) return;

        const gamePlayer = game.players.find(p => p.name === playerName);
        if (gamePlayer && gamePlayer.isConnected) {
            logger.info(`Grace period expired for ${playerName} in game ${gameId}, marking as disconnected`);
            // This will be handled by the main disconnect logic
        }
    }

    /**
     * Handle reconnection during round transitions
     */
    handleRoundTransitionReconnect(socket, gameId, playerName) {
        const game = Game.findById(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }

        // Check if the game is in a round transition state
        const isRoundTransition = !game.roundInProgress && game.tournamentActive;
        const isGameEnded = game.gameState === 'finished';
        
        if (isRoundTransition) {
            logger.info(`Player ${playerName} reconnecting during round transition in game ${gameId}`);
            
            // Special handling for round transitions
            const gamePlayer = game.players.find(p => p.name === playerName);
            if (gamePlayer) {
                gamePlayer.id = socket.id;
                gamePlayer.isConnected = true;
                
                // Send appropriate state based on player's tournament status
                if (gamePlayer.isSafe) {
                    socket.emit('round_transition_reconnect', {
                        status: 'safe',
                        message: 'You are safe and waiting for the next round',
                        canStartNextRound: true,
                        gameState: game.getGameState()
                    });
                } else if (gamePlayer.isEliminated) {
                    socket.emit('round_transition_reconnect', {
                        status: 'eliminated',
                        message: 'You have been eliminated from the tournament',
                        gameState: game.getGameState()
                    });
                } else {
                    socket.emit('round_transition_reconnect', {
                        status: 'waiting',
                        message: 'Waiting for the next round to start',
                        gameState: game.getGameState()
                    });
                }
                
                return { success: true, specialState: 'round_transition' };
            }
        } else if (isGameEnded) {
            logger.info(`Player ${playerName} reconnecting to finished game ${gameId}`);
            
            // Handle reconnection to finished game
            const gamePlayer = game.players.find(p => p.name === playerName);
            if (gamePlayer) {
                gamePlayer.id = socket.id;
                gamePlayer.isConnected = true;
                
                socket.emit('game_ended_reconnect', {
                    status: 'game_ended',
                    message: 'Game has ended, you can vote to play again',
                    gameState: game.getGameState(),
                    playAgainVoting: game.getPlayAgainVotingStatus()
                });
                
                return { success: true, specialState: 'game_ended' };
            }
        }

        return { success: false, error: 'Normal reconnection required' };
    }

    /**
     * Handle mid-turn reconnection
     */
    handleMidTurnReconnect(socket, gameId, playerName) {
        const game = Game.findById(gameId);
        if (!game) {
            return { success: false, error: 'Game not found' };
        }

        const gamePlayer = game.players.find(p => p.name === playerName);
        if (!gamePlayer) {
            return { success: false, error: 'Player not found in game' };
        }

        // Check if it's the player's turn
        const currentPlayer = game.getCurrentPlayer();
        const isPlayerTurn = currentPlayer && currentPlayer.name === playerName;
        
        if (isPlayerTurn) {
            logger.info(`Player ${playerName} reconnecting during their turn in game ${gameId}`);
            
            // Restore player state
            gamePlayer.id = socket.id;
            gamePlayer.isConnected = true;
            
            // Send turn-specific information
            socket.emit('mid_turn_reconnect', {
                isYourTurn: true,
                message: 'It\'s your turn! You can make a move.',
                gameState: game.getGameState(),
                playerHand: gamePlayer.hand,
                availableActions: this.getAvailableActions(game, gamePlayer),
                turnTimer: game.pendingTurnPass === gamePlayer.id ? true : false
            });
            
            return { success: true, specialState: 'mid_turn' };
        }

        return { success: false, error: 'Normal reconnection required' };
    }

    /**
     * Get available actions for a player
     */
    getAvailableActions(game, player) {
        const actions = [];
        
        if (game.gameState !== 'playing') {
            return actions;
        }

        const currentPlayer = game.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.id !== player.id) {
            return actions;
        }

        // Check if player can play cards
        if (game.playerHasPlayableCard(player.id)) {
            actions.push('play_card');
        }

        // Check if player can draw
        if (!game.playersWhoHaveDrawn.has(player.id) || game.drawStack > 0) {
            actions.push('draw_card');
        }

        // Check if player can pass (after drawing)
        if (game.pendingTurnPass === player.id) {
            actions.push('pass_turn');
        }

        return actions;
    }

    /**
     * Start heartbeat for a connected player
     */
    startHeartbeat(socket, gameId, playerName) {
        const heartbeatKey = `${socket.id}`;
        
        // Clear existing heartbeat if any
        this.stopHeartbeat(socket.id);
        
        const interval = setInterval(() => {
            if (socket.connected) {
                socket.emit('heartbeat', { timestamp: Date.now() });
                
                // Update session activity
                sessionStore.updateActivity(socket.id);
            } else {
                this.stopHeartbeat(socket.id);
            }
        }, 30000); // Every 30 seconds

        this.heartbeatIntervals.set(heartbeatKey, interval);
        logger.debug(`Heartbeat started for ${playerName} (${socket.id})`);
    }

    /**
     * Stop heartbeat for a player
     */
    stopHeartbeat(socketId) {
        const heartbeatKey = `${socketId}`;
        const interval = this.heartbeatIntervals.get(heartbeatKey);
        
        if (interval) {
            clearInterval(interval);
            this.heartbeatIntervals.delete(heartbeatKey);
            logger.debug(`Heartbeat stopped for ${socketId}`);
        }
    }

    /**
     * Clear all timeouts and intervals for a game
     */
    clearGameConnections(gameId) {
        // Clear reconnection timeouts
        for (const [key, timeout] of this.reconnectionTimeouts.entries()) {
            if (key.startsWith(`${gameId}_`)) {
                clearTimeout(timeout);
                this.reconnectionTimeouts.delete(key);
            }
        }
        
        logger.info(`Cleared all connection handlers for game ${gameId}`);
    }

    /**
     * Get connection statistics
     */
    getStats() {
        return {
            activeReconnectionTimeouts: this.reconnectionTimeouts.size,
            activeHeartbeats: this.heartbeatIntervals.size,
            timeouts: Array.from(this.reconnectionTimeouts.keys()),
            heartbeats: Array.from(this.heartbeatIntervals.keys())
        };
    }

    /**
     * Cleanup method for graceful shutdown
     */
    cleanup() {
        // Clear all timeouts
        for (const timeout of this.reconnectionTimeouts.values()) {
            clearTimeout(timeout);
        }
        this.reconnectionTimeouts.clear();

        // Clear all intervals
        for (const interval of this.heartbeatIntervals.values()) {
            clearInterval(interval);
        }
        this.heartbeatIntervals.clear();

        logger.info('Connection handler cleanup completed');
    }
}

// Create singleton instance
const connectionHandler = new ConnectionHandler();

module.exports = connectionHandler;