// Enhanced gameController.js with new draw mechanics

const Game = require('../models/game');

// Start a new game
exports.startGame = (req, res) => {
    try {
        const { playerIds, playerNames, requesterId } = req.body;
        
        if (!playerIds || !playerNames || playerIds.length < 2) {
            return res.status(400).json({ 
                success: false, 
                error: 'At least 2 players required' 
            });
        }

        if (!requesterId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Requester ID is required' 
            });
        }

        const newGame = new Game(playerIds, playerNames, requesterId);
        
        // Check if the requester is the game creator
        if (newGame.gameCreator !== requesterId) {
            return res.status(403).json({
                success: false,
                error: 'Only the lobby creator can start the game'
            });
        }
        
        Game.addGame(newGame);
        
        const startResult = newGame.startGame();
        
        if (startResult.success) {
            // Get updated game state which now includes preparation phase
            const gameState = newGame.getGameState();
            
            res.status(200).json({ 
                success: true,
                message: 'Game started in preparation phase', 
                gameId: newGame.id,
                gameState: gameState
            });
            
            // Emit preparation phase started event to all players
            const io = require('../socket').getIO();
            if (io) {
                io.to(newGame.id).emit('preparationPhaseStarted', {
                    gameId: newGame.id,
                    gameState: gameState,
                    preparation: gameState.preparation,
                    message: 'Game has started! Preparation phase is active for 30 seconds.'
                });
            }
        } else {
            res.status(400).json({
                success: false,
                error: startResult.error
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to start game: ' + error.message 
        });
    }
};

// Make a move in the game
exports.makeMove = (req, res) => {
    try {
        const { gameId, playerId, cards, declaredSuit } = req.body;
        const game = Game.findById(gameId);
        
        if (!game) {
            return res.status(404).json({ 
                success: false, 
                error: 'Game not found' 
            });
        }

        const result = game.playCard(playerId, cards, declaredSuit);
        
        if (result.success) {
            res.status(200).json({ 
                success: true,
                message: 'Move made', 
                gameState: game.getGameState() 
            });
        } else {
            res.status(400).json({ 
                success: false,
                error: result.error 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to make move: ' + error.message 
        });
    }
};

// Get the current game state
exports.getGameState = (req, res) => {
    try {
        const { gameId } = req.params;
        const game = Game.findById(gameId);
        
        if (!game) {
            return res.status(404).json({ 
                success: false, 
                error: 'Game not found' 
            });
        }

        res.status(200).json({ 
            success: true,
            gameState: game.getGameState() 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get game state: ' + error.message 
        });
    }
};

// Join a game
exports.joinGame = (req, res) => {
    try {
        const { gameId, playerId, playerName } = req.body;
        
        if (!gameId || !playerId || !playerName) {
            return res.status(400).json({
                success: false,
                error: 'Game ID, player ID, and player name are required'
            });
        }

        const game = Game.findById(gameId);
        
        if (!game) {
            return res.status(404).json({ 
                success: false, 
                error: 'Game not found' 
            });
        }

        if (game.gameState === 'playing') {
            return res.status(400).json({
                success: false,
                error: 'Game has already started'
            });
        }

        if (game.players.length >= 4) {
            return res.status(400).json({
                success: false,
                error: 'Game is full (maximum 4 players)'
            });
        }

        // Check if player is already in the game
        const existingPlayer = game.players.find(p => p.id === playerId);
        if (existingPlayer) {
            return res.status(200).json({
                success: true,
                message: 'Already in game',
                gameState: game.getGameState()
            });
        }

        // Add player to game
        const newPlayer = {
            id: playerId,
            name: playerName,
            hand: [],
            isSafe: false,
            isEliminated: false,
            isConnected: true
        };

        game.players.push(newPlayer);
        game.activePlayers.push(newPlayer);

        res.status(200).json({
            success: true,
            message: 'Joined game successfully',
            gameState: game.getGameState()
        });

    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to join game: ' + error.message 
        });
    }
};

// Enhanced draw cards with optional play
exports.drawCards = (req, res) => {
    try {
        const { gameId, playerId, count } = req.body;
        const game = Game.findById(gameId);
        
        if (!game) {
            return res.status(404).json({ 
                success: false, 
                error: 'Game not found' 
            });
        }

        const result = game.drawCards(playerId, count);
        
        if (result.success) {
            res.status(200).json({ 
                success: true,
                message: `Drew ${result.drawnCards.length} cards`, 
                gameState: game.getGameState(),
                drawnCards: result.drawnCards,
                playableDrawnCards: result.playableDrawnCards,
                canPlayDrawnCard: result.canPlayDrawnCard,
                fromSpecialCard: result.fromSpecialCard
            });
        } else {
            res.status(400).json({ 
                success: false,
                error: result.error 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to draw cards: ' + error.message 
        });
    }
};

// Play a card that was just drawn
exports.playDrawnCard = (req, res) => {
    try {
        const { gameId, playerId, card, declaredSuit } = req.body;
        const game = Game.findById(gameId);
        
        if (!game) {
            return res.status(404).json({ 
                success: false, 
                error: 'Game not found' 
            });
        }

        const result = game.playDrawnCard(playerId, card, declaredSuit);
        
        if (result.success) {
            res.status(200).json({ 
                success: true,
                message: result.message, 
                gameState: game.getGameState(),
                cardsPlayed: result.cardsPlayed
            });
        } else {
            res.status(400).json({ 
                success: false,
                error: result.error 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to play drawn card: ' + error.message 
        });
    }
};

// Pass turn after drawing
exports.passTurnAfterDraw = (req, res) => {
    try {
        const { gameId, playerId } = req.body;
        const game = Game.findById(gameId);
        
        if (!game) {
            return res.status(404).json({ 
                success: false, 
                error: 'Game not found' 
            });
        }

        const result = game.passTurnAfterDraw(playerId);
        
        if (result.success) {
            res.status(200).json({ 
                success: true,
                message: result.message, 
                gameState: game.getGameState()
            });
        } else {
            res.status(400).json({ 
                success: false,
                error: result.error 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to pass turn: ' + error.message 
        });
    }
};

// Add play again vote
exports.addPlayAgainVote = (req, res) => {
    try {
        const { gameId, playerId } = req.body;
        
        if (!gameId || !playerId) {
            return res.status(400).json({
                success: false,
                error: 'Game ID and player ID are required'
            });
        }

        const game = Game.findById(gameId);
        
        if (!game) {
            return res.status(404).json({ 
                success: false, 
                error: 'Game not found' 
            });
        }

        const result = game.addPlayAgainVote(playerId);
        
        if (result.success) {
            res.status(200).json({ 
                success: true,
                message: 'Vote added successfully', 
                votingStatus: result
            });
        } else {
            res.status(400).json({ 
                success: false,
                error: result.error 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to add play again vote: ' + error.message 
        });
    }
};

// Remove play again vote
exports.removePlayAgainVote = (req, res) => {
    try {
        const { gameId, playerId } = req.body;
        
        if (!gameId || !playerId) {
            return res.status(400).json({
                success: false,
                error: 'Game ID and player ID are required'
            });
        }

        const game = Game.findById(gameId);
        
        if (!game) {
            return res.status(404).json({ 
                success: false, 
                error: 'Game not found' 
            });
        }

        const result = game.removePlayAgainVote(playerId);
        
        if (result.success) {
            res.status(200).json({ 
                success: true,
                message: 'Vote removed successfully', 
                votingStatus: result
            });
        } else {
            res.status(400).json({ 
                success: false,
                error: result.error 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to remove play again vote: ' + error.message 
        });
    }
};

// Get play again voting status
exports.getPlayAgainVotingStatus = (req, res) => {
    try {
        const { gameId } = req.params;
        
        if (!gameId) {
            return res.status(400).json({
                success: false,
                error: 'Game ID is required'
            });
        }

        const game = Game.findById(gameId);
        
        if (!game) {
            return res.status(404).json({ 
                success: false, 
                error: 'Game not found' 
            });
        }

        const status = game.getPlayAgainVotingStatus();
        
        res.status(200).json({ 
            success: true,
            votingStatus: status
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get voting status: ' + error.message 
        });
    }
};

// Vote to skip preparation phase
exports.voteSkipPreparation = (req, res) => {
    try {
        const { gameId, playerId } = req.body;
        
        if (!gameId || !playerId) {
            return res.status(400).json({
                success: false,
                error: 'Game ID and player ID are required'
            });
        }

        const game = Game.findById(gameId);
        
        if (!game) {
            return res.status(404).json({ 
                success: false, 
                error: 'Game not found' 
            });
        }

        const result = game.voteSkipPreparation(playerId);
        
        if (result.success) {
            // Emit preparation phase update to all players
            const io = require('../socket').getIO();
            if (io) {
                const gameState = game.getGameState();
                
                if (result.transitioned) {
                    // Emit preparation phase ended if transition occurred
                    io.to(gameId).emit('preparationPhaseEnded', {
                        gameId: gameId,
                        gameState: gameState,
                        message: 'All players voted to skip preparation. Game is starting!',
                        reason: 'vote_skip'
                    });
                } else {
                    // Emit preparation phase update with current vote status
                    io.to(gameId).emit('preparationPhaseUpdated', {
                        gameId: gameId,
                        preparation: gameState.preparation,
                        votes: result.votes || gameState.preparation?.votes,
                        totalPlayers: result.totalPlayers || gameState.preparation?.totalPlayers,
                        votesNeeded: result.votesNeeded,
                        message: `${result.votes || 0} of ${result.totalPlayers || 0} players voted to skip preparation`
                    });
                }
            }
            
            res.status(200).json({ 
                success: true,
                message: result.message,
                voteResult: {
                    votes: result.votes,
                    totalPlayers: result.totalPlayers,
                    votesNeeded: result.votesNeeded,
                    transitioned: result.transitioned
                },
                gameState: result.transitioned ? result.gameState : undefined
            });
        } else {
            res.status(400).json({ 
                success: false,
                error: result.message 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to vote skip preparation: ' + error.message 
        });
    }
};

// Remove skip preparation vote
exports.removeSkipPreparationVote = (req, res) => {
    try {
        const { gameId, playerId } = req.body;
        
        if (!gameId || !playerId) {
            return res.status(400).json({
                success: false,
                error: 'Game ID and player ID are required'
            });
        }

        const game = Game.findById(gameId);
        
        if (!game) {
            return res.status(404).json({ 
                success: false, 
                error: 'Game not found' 
            });
        }

        const result = game.removeSkipPreparationVote(playerId);
        
        if (result.success) {
            // Emit preparation phase update to all players
            const io = require('../socket').getIO();
            if (io) {
                const gameState = game.getGameState();
                io.to(gameId).emit('preparationPhaseUpdated', {
                    gameId: gameId,
                    preparation: gameState.preparation,
                    votes: result.votes || gameState.preparation?.votes,
                    totalPlayers: result.totalPlayers || gameState.preparation?.totalPlayers,
                    message: `${result.votes || 0} of ${result.totalPlayers || 0} players voted to skip preparation`
                });
            }
            
            res.status(200).json({ 
                success: true,
                message: result.message,
                voteResult: {
                    votes: result.votes,
                    totalPlayers: result.totalPlayers
                }
            });
        } else {
            res.status(400).json({ 
                success: false,
                error: result.message 
            });
        }
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to remove skip vote: ' + error.message 
        });
    }
};

// Get preparation phase status
exports.getPreparationStatus = (req, res) => {
    try {
        const { gameId } = req.params;
        
        if (!gameId) {
            return res.status(400).json({
                success: false,
                error: 'Game ID is required'
            });
        }

        const game = Game.findById(gameId);
        
        if (!game) {
            return res.status(404).json({ 
                success: false, 
                error: 'Game not found' 
            });
        }

        const status = game.getPreparationStatus();
        
        res.status(200).json({ 
            success: true,
            preparationStatus: status
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get preparation status: ' + error.message 
        });
    }
};