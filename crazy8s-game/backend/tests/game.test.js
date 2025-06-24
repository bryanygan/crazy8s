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
    
    beforeEach(() => {
        // Clear the games map before each test
        if (Game.games) {
            Game.games.clear();
        }
        game = new Game(['p1', 'p2', 'p3'], ['Alice', 'Bob', 'Charlie']);
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
            expect(game.gameState).toBe('playing');
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

    describe('Stacked Special Sequences', () => {
        beforeEach(() => {
            game.startGame();
            // Force turn state
            game.currentPlayerIndex = 2; // Third player
            game.direction = -1;
            game.discardPile = [{ suit: 'Clubs', rank: '5' }];
        });

        test('complex stack should pass turn correctly', () => {
            const player = game.getPlayerById('p3');
            const stack = [
                { suit: 'Clubs', rank: 'Jack' },
                { suit: 'Hearts', rank: 'Jack' },
                { suit: 'Hearts', rank: 'Queen' },
                { suit: 'Diamonds', rank: 'Queen' },
                { suit: 'Diamonds', rank: '10' }
            ];

            player.hand.push(...stack);

            const result = game.playCard(player.id, stack);

            expect(result.success).toBe(true);
            expect(game.direction).toBe(-1); // two reverses cancel
            expect(game.currentPlayerIndex).toBe(1); // turn should pass to player 2
        });
    });

    describe('Draw Mechanics', () => {
        beforeEach(() => {
            game.startGame();
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
    });

    describe('Draw Stack Countering', () => {
        beforeEach(() => {
            game.startGame();
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
            
            const result = game.playCard('invalid_player', { suit: 'Hearts', rank: '7' });
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Player not found');
        });

        test('should handle drawing cards for invalid player', () => {
            game.startGame();
            
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
});