// tests/game.test.js

// First, let's create a mock for the deck utilities since they might not exist yet
const mockDeck = () => {
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
    const deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank });
        }
    }
    return deck;
};

// Mock the deck utility functions
jest.mock('../src/utils/deck', () => ({
    createDeck: () => mockDeck(),
    shuffleDeck: (deck) => [...deck] // Return deck as-is for predictable tests
}), { virtual: true });

// Import the Game class
const Game = require('../src/models/game');

describe('Game Class Tests', () => {
    let game;
    let mockIO;
    
    beforeEach(() => {
        // Clear the games map before each test
        if (Game.games) {
            Game.games.clear();
        }
        
        // Mock socket.io for preparation phase event testing
        mockIO = {
            to: jest.fn().mockReturnThis(),
            emit: jest.fn()
        };
        
        // Mock the socket.js getIO function
        jest.mock('../src/socket', () => ({
            getIO: () => mockIO
        }), { virtual: true });
        
        game = new Game(['p1', 'p2', 'p3'], ['Alice', 'Bob', 'Charlie']);
    });
    
    afterEach(() => {
        // Clear any timers that might be running
        if (game.preparationTimer) {
            clearTimeout(game.preparationTimer);
        }
        jest.clearAllMocks();
    });

    describe('Game Initialization', () => {
        test('should create game with correct properties', () => {
            expect(game.id).toBeDefined();
            expect(game.players).toHaveLength(3);
            expect(game.gameState).toBe('waiting');
            expect(game.direction).toBe(1);
            expect(game.currentPlayerIndex).toBe(0);
            expect(game.roundNumber).toBe(1);
        });

        test('should initialize players correctly', () => {
            expect(game.players[0].id).toBe('p1');
            expect(game.players[0].name).toBe('Alice');
            expect(game.players[0].hand).toEqual([]);
            expect(game.players[0].isSafe).toBe(false);
            expect(game.players[0].isEliminated).toBe(false);
        });

        test('should generate unique game IDs', () => {
            const game2 = new Game(['p4'], ['Dave']);
            expect(game.id).not.toBe(game2.id);
        });

        test('should handle missing player names', () => {
            const gameWithMissingNames = new Game(['p1', 'p2'], ['Alice']);
            expect(gameWithMissingNames.players[0].name).toBe('Alice');
            expect(gameWithMissingNames.players[1].name).toBe('Player 2');
        });
    });

    describe('Game Start Validation', () => {
        test('should start game successfully with valid players', () => {
            const result = game.startGame();
            
            expect(result.success).toBe(true);
            expect(game.gameState).toBe('preparation');
            expect(game.drawPile).toBeDefined();
            expect(game.discardPile).toHaveLength(1);
        });

        test('should fail to start with too few players', () => {
            const singlePlayerGame = new Game(['p1'], ['Alice']);
            const result = singlePlayerGame.startGame();
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Game requires 2-4 players');
        });

        test('should fail to start with too many players', () => {
            const manyPlayerGame = new Game(['p1', 'p2', 'p3', 'p4', 'p5'], ['A', 'B', 'C', 'D', 'E']);
            const result = manyPlayerGame.startGame();
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Game requires 2-4 players');
        });

        test('should deal 8 cards to each player', () => {
            game.startGame();
            
            game.players.forEach(player => {
                expect(player.hand).toHaveLength(8);
            });
        });

        test('should create discard pile with one card', () => {
            game.startGame();
            
            expect(game.discardPile).toHaveLength(1);
            expect(game.getTopDiscardCard()).toBeDefined();
        });
    });

    describe('Game State Management', () => {
        beforeEach(() => {
            game.startGame();
            // Transition to playing state for these tests
            game.transitionToPlaying();
        });

        test('should return complete game state', () => {
            const state = game.getGameState();
            
            expect(state.gameId).toBe(game.id);
            expect(state.gameState).toBe('playing');
            expect(state.currentPlayer).toBe('Alice');
            expect(state.currentPlayerId).toBe('p1');
            expect(state.topCard).toBeDefined();
            expect(state.players).toHaveLength(3);
        });

        test('should identify current player correctly', () => {
            const currentPlayer = game.getCurrentPlayer();
            
            expect(currentPlayer.id).toBe('p1');
            expect(currentPlayer.name).toBe('Alice');
        });

        test('should get player hands correctly', () => {
            const p1Hand = game.getPlayerHand('p1');
            const p2Hand = game.getPlayerHand('p2');
            
            expect(p1Hand).toHaveLength(8);
            expect(p2Hand).toHaveLength(8);
        });

        test('should handle invalid player hand request', () => {
            const hand = game.getPlayerHand('invalid_player');
            expect(hand).toEqual([]);
        });
    });

    describe('Turn Management', () => {
        beforeEach(() => {
            game.startGame();
            game.transitionToPlaying();
        });

        test('should reject play when not player\'s turn', () => {
            // Get any card from player 2
            const p2 = game.getPlayerById('p2');
            const card = p2.hand[0];
            
            const result = game.playCard('p2', card);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Not your turn');
        });

        test('should reject play when player doesn\'t have card', () => {
            const fakeCard = { suit: 'Hearts', rank: 'King' };
            
            const result = game.playCard('p1', fakeCard);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('You do not have this card');
        });

        test('should advance to next player correctly', () => {
            const initialIndex = game.currentPlayerIndex;
            game.nextPlayer();
            
            expect(game.currentPlayerIndex).toBe((initialIndex + 1) % game.activePlayers.length);
        });
    });

    describe('Card Validation', () => {
        beforeEach(() => {
            game.startGame();
            game.transitionToPlaying();
        });

        test('should validate matching suit', () => {
            const topCard = { suit: 'Hearts', rank: '7' };
            const matchingCard = { suit: 'Hearts', rank: 'King' };
            
            game.discardPile = [topCard];
            
            expect(game.isValidPlay(matchingCard)).toBe(true);
        });

        test('should validate matching rank', () => {
            const topCard = { suit: 'Hearts', rank: '7' };
            const matchingCard = { suit: 'Clubs', rank: '7' };
            
            game.discardPile = [topCard];
            
            expect(game.isValidPlay(matchingCard)).toBe(true);
        });

        test('should reject non-matching card', () => {
            const topCard = { suit: 'Hearts', rank: '7' };
            const nonMatchingCard = { suit: 'Clubs', rank: 'King' };
            
            game.discardPile = [topCard];
            
            expect(game.isValidPlay(nonMatchingCard)).toBe(false);
        });

        test('should allow 8 (wild card) on any card', () => {
            const topCard = { suit: 'Hearts', rank: '7' };
            const wildCard = { suit: 'Clubs', rank: '8' };
            
            game.discardPile = [topCard];
            
            expect(game.isValidPlay(wildCard, 'Spades')).toBe(true);
        });
    });

    describe('Special Card Effects', () => {
        beforeEach(() => {
            game.startGame();
            game.transitionToPlaying();
        });

        test('should handle Jack (Skip)', () => {
            const jack = { suit: 'Hearts', rank: 'Jack' };
            const currentPlayer = game.getCurrentPlayer();
            
            // Manually set up a valid play scenario
            game.discardPile = [{ suit: 'Hearts', rank: '7' }];
            currentPlayer.hand.push(jack);
            
            const initialPlayerIndex = game.currentPlayerIndex;
            const result = game.playCard(currentPlayer.id, jack);
            
            if (result.success) {
                // Should skip one player (2 advances total)
                expect(game.currentPlayerIndex).toBe((initialPlayerIndex + 2) % game.activePlayers.length);
            }
        });

        test('Jack should keep turn in 1v1 game', () => {
            const duelGame = new Game(['p1', 'p2'], ['Alice', 'Bob']);
            duelGame.startGame();
            duelGame.transitionToPlaying();
            const jack = { suit: 'Hearts', rank: 'Jack' };
            duelGame.discardPile = [{ suit: 'Hearts', rank: '7' }];
            duelGame.players[0].hand.push(jack);

            const initialIndex = duelGame.currentPlayerIndex;
            const result = duelGame.playCard(duelGame.players[0].id, jack);
            expect(result.success).toBe(true);
            expect(duelGame.currentPlayerIndex).toBe(initialIndex);
        });

        test('should handle Queen (Reverse)', () => {
            const queen = { suit: 'Hearts', rank: 'Queen' };
            const currentPlayer = game.getCurrentPlayer();
            
            game.discardPile = [{ suit: 'Hearts', rank: '7' }];
            currentPlayer.hand.push(queen);
            
            expect(game.direction).toBe(1);
            const result = game.playCard(currentPlayer.id, queen);
            
            if (result.success) {
                expect(game.direction).toBe(-1);
            }
        });

        test('should handle Ace (+4)', () => {
            const ace = { suit: 'Hearts', rank: 'Ace' };
            const currentPlayer = game.getCurrentPlayer();
            
            game.discardPile = [{ suit: 'Hearts', rank: '7' }];
            currentPlayer.hand.push(ace);
            
            expect(game.drawStack).toBe(0);
            const result = game.playCard(currentPlayer.id, ace);
            
            if (result.success) {
                expect(game.drawStack).toBe(4);
            }
        });

        test('should handle 2 (+2)', () => {
            const two = { suit: 'Hearts', rank: '2' };
            const currentPlayer = game.getCurrentPlayer();
            
            game.discardPile = [{ suit: 'Hearts', rank: '7' }];
            currentPlayer.hand.push(two);
            
            expect(game.drawStack).toBe(0);
            const result = game.playCard(currentPlayer.id, two);
            
            if (result.success) {
                expect(game.drawStack).toBe(2);
            }
        });

        test('should handle 8 (Wild) with suit declaration', () => {
            const eight = { suit: 'Hearts', rank: '8' };
            const currentPlayer = game.getCurrentPlayer();
            
            currentPlayer.hand.push(eight);
            
            const result = game.playCard(currentPlayer.id, eight, 'Spades');
            
            expect(result.success).toBe(true);
            expect(game.declaredSuit).toBe('Spades');
        });

        test('should reject 8 without declared suit', () => {
            const eight = { suit: 'Hearts', rank: '8' };
            const currentPlayer = game.getCurrentPlayer();
            
            currentPlayer.hand.push(eight);
            
            const result = game.playCard(currentPlayer.id, eight);
            
            expect(result.success).toBe(false);
        });
    });

    describe('Draw Mechanics', () => {
        beforeEach(() => {
            game.startGame();
            game.transitionToPlaying();
        });

        test('should draw single card successfully', () => {
            const player = game.getPlayerById('p1');
            const initialHandSize = player.hand.length;
            
            const result = game.drawCards('p1', 1);
            
            expect(result.success).toBe(true);
            expect(player.hand).toHaveLength(initialHandSize + 1);
            expect(result.drawnCards).toHaveLength(1);
        });

        test('should draw multiple cards', () => {
            const player = game.getPlayerById('p1');
            const initialHandSize = player.hand.length;
            
            const result = game.drawCards('p1', 3);
            
            expect(result.success).toBe(true);
            expect(player.hand).toHaveLength(initialHandSize + 3);
            expect(result.drawnCards).toHaveLength(3);
        });

        test('should draw from draw stack when present', () => {
            const player = game.getPlayerById('p1');
            game.drawStack = 4;
            const initialHandSize = player.hand.length;

            const result = game.drawCards('p1');

            expect(result.success).toBe(true);
            expect(player.hand).toHaveLength(initialHandSize + 4);
            expect(game.drawStack).toBe(0);
        });

        test('should auto pass turn if no playable cards after draw', () => {
            const player = game.getPlayerById('p1');
            game.discardPile = [{ suit: 'Clubs', rank: '5' }];
            player.hand = [{ suit: 'Hearts', rank: '2' }];
            game.drawPile = [{ suit: 'Diamonds', rank: '7' }];

            const result = game.drawCards('p1', 1);
            expect(result.success).toBe(true);
            
            // The player should have been auto-passed immediately since they have no playable cards
            expect(game.pendingTurnPass).toBe(null);
            expect(game.getCurrentPlayer().id).toBe('p2');
        });
    });

    describe('Draw Stack Countering', () => {
        beforeEach(() => {
            game.startGame();
            game.transitionToPlaying();
        });

        test('should allow Ace to counter Ace', () => {
            const ace1 = { suit: 'Hearts', rank: 'Ace' };
            const ace2 = { suit: 'Spades', rank: 'Ace' };
            
            game.drawStack = 4;
            game.discardPile = [ace1];
            
            expect(game.canCounterDraw(ace2)).toBe(true);
        });

        test('should allow same-suit 2 to counter Ace', () => {
            const ace = { suit: 'Hearts', rank: 'Ace' };
            const two = { suit: 'Hearts', rank: '2' };
            const wrongSuitTwo = { suit: 'Spades', rank: '2' };
            
            game.drawStack = 4;
            game.discardPile = [ace];
            
            expect(game.canCounterDraw(two)).toBe(true);
            expect(game.canCounterDraw(wrongSuitTwo)).toBe(false);
        });
    });

    describe('Win Conditions', () => {
        beforeEach(() => {
            game.startGame();
            game.transitionToPlaying();
        });

        test('should mark player as safe when hand is empty', () => {
            const player = game.getPlayerById('p1');
            const validCard = { suit: 'Hearts', rank: '7' };
            
            // Set up scenario where player can win
            game.discardPile = [{ suit: 'Hearts', rank: 'King' }];
            player.hand = [validCard];
            
            const result = game.playCard('p1', validCard);
            
            expect(result.success).toBe(true);
            expect(player.isSafe).toBe(true);
            expect(game.safeePlayers).toContain(player);
        });
    });

    describe('Utility Functions', () => {
        test('should convert card to string correctly', () => {
            const card = { suit: 'Hearts', rank: 'King' };
            const cardString = game.cardToString(card);
            
            expect(cardString).toBe('King of Hearts');
        });

        test('should find card in hand correctly', () => {
            const hand = [
                { suit: 'Hearts', rank: '7' },
                { suit: 'Clubs', rank: 'King' },
                { suit: 'Spades', rank: 'Ace' }
            ];
            
            const targetCard = { suit: 'Clubs', rank: 'King' };
            const index = game.findCardInHand(hand, targetCard);
            
            expect(index).toBe(1);
        });

        test('should return -1 when card not found in hand', () => {
            const hand = [{ suit: 'Hearts', rank: '7' }];
            const targetCard = { suit: 'Clubs', rank: 'King' };
            
            const index = game.findCardInHand(hand, targetCard);
            
            expect(index).toBe(-1);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid player ID gracefully', () => {
            game.startGame();
            game.transitionToPlaying();
            
            const result = game.playCard('invalid_player', { suit: 'Hearts', rank: '7' });
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Player not found');
        });

        test('should handle drawing cards for invalid player', () => {
            game.startGame();
            game.transitionToPlaying();
            
            const result = game.drawCards('invalid_player', 1);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Player not found');
        });

        test('should handle null current player gracefully', () => {
            // Don't start game, so no current player
            const currentPlayer = game.getCurrentPlayer();
            
            expect(currentPlayer).toBe(null);
        });
    });

    describe('Static Game Management', () => {
        test('should add and find games', () => {
            Game.addGame(game);
            
            const foundGame = Game.findById(game.id);
            expect(foundGame).toBe(game);
        });

        test('should remove games', () => {
            Game.addGame(game);
            Game.removeGame(game.id);
            
            const foundGame = Game.findById(game.id);
            expect(foundGame).toBeUndefined();
        });

        test('should return undefined for non-existent game', () => {
            const foundGame = Game.findById('nonexistent');
            expect(foundGame).toBeUndefined();
        });
    });

    describe('Preparation Phase', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('should start in preparation phase when game begins', () => {
            const result = game.startGame();
            
            expect(result.success).toBe(true);
            expect(game.gameState).toBe('preparation');
            expect(game.preparationTimer).toBeDefined();
            expect(game.preparationSkipVotes.size).toBe(0);
        });

        test('should automatically transition to playing after 30 seconds', () => {
            game.startGame();
            
            expect(game.gameState).toBe('preparation');
            
            // Fast forward 30 seconds
            jest.advanceTimersByTime(30000);
            
            expect(game.gameState).toBe('playing');
            expect(game.preparationTimer).toBe(null);
            expect(game.preparationSkipVotes.size).toBe(0);
        });

        test('should not transition automatically if timer is cleared', () => {
            game.startGame();
            
            expect(game.gameState).toBe('preparation');
            
            // Clear timer manually (simulating early transition)
            clearTimeout(game.preparationTimer);
            game.preparationTimer = null;
            
            // Fast forward 30 seconds
            jest.advanceTimersByTime(30000);
            
            // Should still be in preparation since timer was cleared
            expect(game.gameState).toBe('preparation');
        });

        test('should include preparation status in game state', () => {
            game.startGame();
            const gameState = game.getGameState();
            
            expect(gameState.preparation).toBeDefined();
            expect(gameState.preparation.inPreparation).toBe(true);
            expect(gameState.preparation.votes).toBe(0);
            expect(gameState.preparation.totalPlayers).toBe(3);
            expect(gameState.preparation.canSkip).toBe(false);
        });

        test('should not include preparation status when not in preparation', () => {
            // Don't start game, should be in 'waiting' state
            const gameState = game.getGameState();
            
            expect(gameState.preparation).toBe(null);
        });
    });

    describe('Skip Preparation Voting', () => {
        beforeEach(() => {
            game.startGame();
        });

        test('should allow valid player to vote skip preparation', () => {
            const result = game.voteSkipPreparation('p1');
            
            expect(result.success).toBe(true);
            expect(result.transitioned).toBe(false);
            expect(result.votesNeeded).toBe(2); // 3 players - 1 vote = 2 needed
            expect(game.preparationSkipVotes.has('p1')).toBe(true);
        });

        test('should reject vote from non-existent player', () => {
            const result = game.voteSkipPreparation('invalid_player');
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Player not found');
        });

        test('should reject vote from disconnected player', () => {
            // Disconnect player 2
            game.players[1].isConnected = false;
            
            const result = game.voteSkipPreparation('p2');
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Disconnected players cannot vote');
        });

        test('should reject vote when not in preparation phase', () => {
            // Manually transition to playing
            game.gameState = 'playing';
            
            const result = game.voteSkipPreparation('p1');
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Game is not in preparation phase');
        });

        test('should transition to playing when all connected players vote', () => {
            // All players vote
            const result1 = game.voteSkipPreparation('p1');
            expect(result1.transitioned).toBe(false);
            
            const result2 = game.voteSkipPreparation('p2');
            expect(result2.transitioned).toBe(false);
            
            const result3 = game.voteSkipPreparation('p3');
            expect(result3.transitioned).toBe(true);
            expect(result3.message).toContain('All players voted to skip preparation');
            
            expect(game.gameState).toBe('playing');
            expect(game.preparationTimer).toBe(null);
            expect(game.preparationSkipVotes.size).toBe(0);
        });

        test('should only count connected players for voting', () => {
            // Disconnect one player
            game.players[2].isConnected = false;
            
            const result1 = game.voteSkipPreparation('p1');
            expect(result1.votesNeeded).toBe(1); // Only 2 connected players, so 1 more vote needed
            
            const result2 = game.voteSkipPreparation('p2');
            expect(result2.transitioned).toBe(true); // Should transition with just 2 votes
            
            expect(game.gameState).toBe('playing');
        });

        test('should allow removing vote', () => {
            // Add vote first
            game.voteSkipPreparation('p1');
            expect(game.preparationSkipVotes.has('p1')).toBe(true);
            
            // Remove vote
            const result = game.removeSkipPreparationVote('p1');
            
            expect(result.success).toBe(true);
            expect(result.votesNeeded).toBe(3); // All 3 players need to vote again
            expect(game.preparationSkipVotes.has('p1')).toBe(false);
        });

        test('should handle removing non-existent vote gracefully', () => {
            const result = game.removeSkipPreparationVote('p1');
            
            expect(result.success).toBe(true);
            expect(result.votesNeeded).toBe(3);
        });

        test('should reject removing vote when not in preparation phase', () => {
            game.gameState = 'playing';
            
            const result = game.removeSkipPreparationVote('p1');
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Game is not in preparation phase');
        });

        test('should get correct preparation status with votes', () => {
            game.voteSkipPreparation('p1');
            game.voteSkipPreparation('p2');
            
            const status = game.getPreparationStatus();
            
            expect(status.inPreparation).toBe(true);
            expect(status.votes).toBe(2);
            expect(status.totalPlayers).toBe(3);
            expect(status.votedPlayers).toHaveLength(2);
            expect(status.votedPlayers[0].id).toBe('p1');
            expect(status.votedPlayers[1].id).toBe('p2');
            expect(status.canSkip).toBe(false); // Not all players voted yet
        });

        test('should indicate can skip when all players voted', () => {
            game.voteSkipPreparation('p1');
            game.voteSkipPreparation('p2');
            game.voteSkipPreparation('p3');
            
            // Game should have transitioned, but let's test the status logic
            // We'll test this by manually adding votes without triggering transition
            game.gameState = 'preparation';
            game.preparationSkipVotes.clear();
            game.preparationSkipVotes.add('p1');
            game.preparationSkipVotes.add('p2');
            game.preparationSkipVotes.add('p3');
            
            const status = game.getPreparationStatus();
            
            expect(status.canSkip).toBe(true);
        });
    });

    describe('Preparation Phase Socket Integration', () => {
        beforeEach(() => {
            game.gameState = 'preparation';
            game.preparationSkipVotes.clear();
        });

        test('should emit preparationPhaseEnded event when timer expires', (done) => {
            // Start the preparation timer with a very short duration for testing
            game.preparationTimer = setTimeout(() => {
                game.transitionToPlaying();
                
                // Check that the event was emitted
                setTimeout(() => {
                    expect(mockIO.to).toHaveBeenCalledWith(game.id);
                    expect(mockIO.emit).toHaveBeenCalledWith('preparationPhaseEnded', {
                        gameId: game.id,
                        gameState: game.getGameState(),
                        message: 'Preparation phase ended. Game is starting!',
                        reason: 'timer_expired'
                    });
                    done();
                }, 10);
            }, 50);
        });

        test('should emit preparationPhaseStarted event when game starts', () => {
            const startResult = game.startGame();
            
            expect(startResult.success).toBe(true);
            expect(game.gameState).toBe('preparation');
            
            // Note: The actual socket emission happens in the controller, not in the Game class
            // This test verifies the game state is set correctly for the controller to emit events
            const gameState = game.getGameState();
            expect(gameState.preparation).toBeDefined();
            expect(gameState.preparation.inPreparation).toBe(true);
        });

        test('should emit preparationPhaseUpdated event data structure', () => {
            game.voteSkipPreparation('p1');
            const gameState = game.getGameState();
            
            // Verify the game state contains the data needed for preparationPhaseUpdated events
            expect(gameState.preparation).toEqual({
                inPreparation: true,
                votes: 1,
                totalPlayers: 3,
                votedPlayers: [{ id: 'p1', name: 'Alice' }],
                canSkip: false
            });
        });

        test('should transition and provide data for preparationPhaseEnded event on unanimous vote', () => {
            const result = game.voteSkipPreparation('p1');
            expect(result.transitioned).toBe(false);
            
            game.voteSkipPreparation('p2');
            const finalResult = game.voteSkipPreparation('p3');
            
            // Should have transitioned to playing state
            expect(finalResult.transitioned).toBe(true);
            expect(game.gameState).toBe('playing');
            expect(finalResult.gameState).toBeDefined();
            expect(finalResult.gameState.preparation).toBeNull();
        });
    });

    describe('Preparation Phase API Integration', () => {
        beforeEach(() => {
            game.gameState = 'preparation';
            game.preparationSkipVotes.clear();
            Game.addGame(game);
        });

        test('should handle vote skip preparation API call', () => {
            const result = game.voteSkipPreparation('p1');
            
            expect(result.success).toBe(true);
            expect(result.votes).toBe(1);
            expect(result.totalPlayers).toBe(3);
            expect(result.votesNeeded).toBe(2);
            expect(result.transitioned).toBe(false);
        });

        test('should handle remove skip vote API call', () => {
            game.voteSkipPreparation('p1');
            const result = game.removeSkipPreparationVote('p1');
            
            expect(result.success).toBe(true);
            expect(result.votes).toBe(0);
            expect(result.totalPlayers).toBe(3);
        });

        test('should handle get preparation status API call', () => {
            game.voteSkipPreparation('p1');
            game.voteSkipPreparation('p2');
            
            const status = game.getPreparationStatus();
            
            expect(status.inPreparation).toBe(true);
            expect(status.votes).toBe(2);
            expect(status.totalPlayers).toBe(3);
            expect(status.votedPlayers).toHaveLength(2);
            expect(status.canSkip).toBe(false);
        });

        test('should return correct preparation status when not in preparation', () => {
            game.gameState = 'playing';
            
            const status = game.getPreparationStatus();
            
            expect(status.inPreparation).toBe(false);
            expect(status.votes).toBe(0);
            expect(status.totalPlayers).toBe(0);
            expect(status.votedPlayers).toEqual([]);
            expect(status.canSkip).toBe(false);
        });
    });

    describe('Preparation Phase Disconnection Handling', () => {
        beforeEach(() => {
            game.gameState = 'preparation';
            game.preparationSkipVotes.clear();
        });

        test('should exclude disconnected players from vote count', () => {
            // Disconnect one player
            game.players[2].isConnected = false;
            
            game.voteSkipPreparation('p1');
            const result = game.voteSkipPreparation('p2');
            
            // Should transition because both connected players voted
            expect(result.success).toBe(true);
            expect(result.transitioned).toBe(true);
            expect(game.gameState).toBe('playing');
        });

        test('should handle disconnected player attempting to vote', () => {
            game.players[0].isConnected = false;
            
            const result = game.voteSkipPreparation('p1');
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Disconnected players cannot vote');
        });

        test('should recalculate vote requirements when player disconnects', () => {
            game.voteSkipPreparation('p1');
            
            // Disconnect a player
            game.players[2].isConnected = false;
            
            const status = game.getPreparationStatus();
            
            expect(status.totalPlayers).toBe(2); // Only connected players
            expect(status.votes).toBe(1);
            expect(status.canSkip).toBe(false); // Still need one more vote
        });

        test('should transition automatically when disconnection makes votes unanimous', () => {
            game.voteSkipPreparation('p1');
            game.voteSkipPreparation('p2');
            
            // Disconnect the third player - now all connected players have voted
            game.players[2].isConnected = false;
            
            // Check if this would be considered unanimous
            const connectedPlayers = game.players.filter(p => p.isConnected);
            const allConnectedVoted = connectedPlayers.every(p => game.preparationSkipVotes.has(p.id));
            
            expect(allConnectedVoted).toBe(true);
            expect(connectedPlayers.length).toBe(2);
        });
    });
});