const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Rate limiting for play-again votes to prevent spamming
const playAgainLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many play again requests from this IP, please try again after a minute'
});

// Middleware to handle validation results
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

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

// Route to add play again vote
router.post(
    '/play-again/vote',
    playAgainLimiter,
    authMiddleware,
    body('gameId').isString().notEmpty().withMessage('Game ID is required'),
    body('playerId').isString().notEmpty().withMessage('Player ID is required'),
    validateRequest,
    gameController.addPlayAgainVote
);

// Route to remove play again vote
router.post(
    '/play-again/remove-vote',
    playAgainLimiter,
    authMiddleware,
    body('gameId').isString().notEmpty().withMessage('Game ID is required'),
    body('playerId').isString().notEmpty().withMessage('Player ID is required'),
    validateRequest,
    gameController.removePlayAgainVote
);

// Route to get play again voting status
router.get(
    '/play-again/status/:gameId',
    authMiddleware,
    param('gameId').isString().notEmpty().withMessage('Game ID is required'),
    validateRequest,
    gameController.getPlayAgainVotingStatus
);

// Preparation phase routes

// Route to vote to skip preparation phase
router.post(
    '/preparation/skip-vote',
    body('gameId').isString().notEmpty().withMessage('Game ID is required'),
    body('playerId').isString().notEmpty().withMessage('Player ID is required'),
    validateRequest,
    gameController.voteSkipPreparation
);

// Route to remove skip preparation vote
router.post(
    '/preparation/remove-skip-vote',
    body('gameId').isString().notEmpty().withMessage('Game ID is required'),
    body('playerId').isString().notEmpty().withMessage('Player ID is required'),
    validateRequest,
    gameController.removeSkipPreparationVote
);

// Route to get preparation phase status
router.get(
    '/preparation/status/:gameId',
    param('gameId').isString().notEmpty().withMessage('Game ID is required'),
    validateRequest,
    gameController.getPreparationStatus
);

module.exports = router;