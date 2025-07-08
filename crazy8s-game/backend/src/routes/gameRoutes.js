// Enhanced gameRoutes.js with new draw mechanics endpoints

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

// Route to draw cards (enhanced with optional play)
router.post('/draw', gameController.drawCards);

// Route to play a card that was just drawn
router.post('/play-drawn', gameController.playDrawnCard);

// Route to pass turn after drawing
router.post('/pass-turn', gameController.passTurnAfterDraw);

module.exports = router;