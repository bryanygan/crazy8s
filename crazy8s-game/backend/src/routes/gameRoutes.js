// This file sets up the routes for game-related API endpoints, linking them to the appropriate controller functions.

const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Route to start a new game
router.post('/start', gameController.startGame);

// Route to make a move
router.post('/move', gameController.makeMove);

// Route to get the current game state
router.get('/state/:gameId', gameController.getGameState);

// Route to join a game
router.post('/join', gameController.joinGame);

// Route to draw cards
router.post('/draw', gameController.drawCards);

module.exports = router;