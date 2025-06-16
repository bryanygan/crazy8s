// backend/src/controllers/gameController.js

const Game = require('../models/game');

// Start a new game
exports.startGame = (req, res) => {
    const newGame = new Game();
    newGame.start();
    res.status(200).json({ message: 'Game started', gameId: newGame.id });
};

// Make a move in the game
exports.makeMove = (req, res) => {
    const { gameId, playerId, card } = req.body;
    const game = Game.findById(gameId);
    
    if (!game) {
        return res.status(404).json({ message: 'Game not found' });
    }

    const result = game.playCard(playerId, card);
    if (result.error) {
        return res.status(400).json({ message: result.error });
    }

    res.status(200).json({ message: 'Move made', gameState: game.getState() });
};

// Get the current game state
exports.getGameState = (req, res) => {
    const { gameId } = req.params;
    const game = Game.findById(gameId);
    
    if (!game) {
        return res.status(404).json({ message: 'Game not found' });
    }

    res.status(200).json({ gameState: game.getState() });
};