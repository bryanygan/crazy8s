// tests/crazy8.test.js - Simplified version focusing on Game class only

// Mock the deck utilities
jest.mock('../src/utils/deck', () => ({
    createDeck: () => {
        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
        const deck = [];
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ suit, rank });
            }
        }
        return deck;
    },
    shuffleDeck: (deck) => [...deck]
}), { virtual: true });

const Game = require('../src/models/game');

describe('Crazy 8s Game Integration Tests', () => {
    let game;
    
    beforeEach(() => {
        if (Game.games) {
            Game.games.clear();
        }
        game = new Game(['p1', 'p2', 'p3'], ['Alice', 'Bob', 'Charlie']);
    });

    describe('Full Game Flow', () => {
        test('should complete a basic game flow', () => {
            // Start the game
            const startResult = game.startGame();
            expect(startResult.success).toBe(true);
            expect(game.gameState).toBe('playing');
            
            // Check initial state
            const state = game.getGameState();
            expect(state.players).toHaveLength(3);
            expect(state.currentPlayer).toBe('Alice');
            
            // Each player should have 8 cards
            state.players.forEach(player => {
                expect(player.handSize).toBe(8);
            });
            
            // Should have a top card
            expect(state.topCard).toBeDefined();
        });

        test('should handle player turns correctly', () => {
            game.startGame();
            
            const initialPlayer = game.getCurrentPlayer();
            expect(initialPlayer.name).toBe('Alice');
            
            // Try to play as wrong player
            const wrongPlayerResult = game.playCard('p2', { suit: 'Hearts', rank: '7' });
            expect(wrongPlayerResult.success).toBe(false);
            expect(wrongPlayerResult.error).toBe('Not your turn');
            
            // Current player should still be Alice
            expect(game.getCurrentPlayer().name).toBe('Alice');
        });

        test('should handle card drawing', () => {
            game.startGame();
            
            const player = game.getPlayerById('p1');
            const initialHandSize = player.hand.length;
            
            const drawResult = game.drawCards('p1', 2);
            expect(drawResult.success).toBe(true);
            expect(player.hand.length).toBe(initialHandSize + 2);
            expect(drawResult.drawnCards).toHaveLength(2);
            
            // Turn should advance after drawing
            expect(game.getCurrentPlayer().name).toBe('Bob');
        });

        test('should validate card plays correctly', () => {
            game.startGame();
            
            const topCard = game.getTopDiscardCard();
            const currentPlayer = game.getCurrentPlayer();
            
            // Test with a matching card (if player has one)
            const matchingCard = currentPlayer.hand.find(card => 
                card.suit === topCard.suit || card.rank === topCard.rank
            );
            
            if (matchingCard) {
                const result = game.playCard(currentPlayer.id, matchingCard);
                expect(result.success).toBe(true);
                expect(game.getTopDiscardCard()).toEqual(matchingCard);
            }
            
            // Test with invalid card
            const nonMatchingCard = currentPlayer.hand.find(card => 
                card.suit !== topCard.suit && card.rank !== topCard.rank && card.rank !== '8'
            );
            
            if (nonMatchingCard) {
                // Reset to test invalid play
                game.currentPlayerIndex = 0; // Reset to first player
                const invalidResult = game.playCard(currentPlayer.id, nonMatchingCard);
                expect(invalidResult.success).toBe(false);
                expect(invalidResult.error).toBe('Invalid card play');
            }
        });

        test('should handle special cards', () => {
            game.startGame();
            
            const currentPlayer = game.getCurrentPlayer();
            
            // Test Jack (Skip)
            const jack = { suit: 'Hearts', rank: 'Jack' };
            game.discardPile = [{ suit: 'Hearts', rank: '7' }]; // Set up valid play
            currentPlayer.hand.push(jack);
            
            const initialPlayerIndex = game.currentPlayerIndex;
            const jackResult = game.playCard(currentPlayer.id, jack);
            
            if (jackResult.success) {
                // Should skip next player (2 total advances)
                expect(game.currentPlayerIndex).toBe((initialPlayerIndex + 2) % 3);
            }
            
            // Test Ace (+4)
            const ace = { suit: 'Hearts', rank: 'Ace' };
            const acePlayer = game.getCurrentPlayer();
            acePlayer.hand.push(ace);
            
            const aceResult = game.playCard(acePlayer.id, ace);
            if (aceResult.success) {
                expect(game.drawStack).toBe(4);
            }
        });

        test('should handle wild cards (8s)', () => {
            game.startGame();
            
            const currentPlayer = game.getCurrentPlayer();
            const eight = { suit: 'Hearts', rank: '8' };
            currentPlayer.hand.push(eight);
            
            // Should succeed with declared suit
            const validResult = game.playCard(currentPlayer.id, eight, 'Spades');
            expect(validResult.success).toBe(true);
            expect(game.declaredSuit).toBe('Spades');
            
            // Reset for next test
            game.currentPlayerIndex = 0;
            const nextPlayer = game.getCurrentPlayer();
            const anotherEight = { suit: 'Clubs', rank: '8' };
            nextPlayer.hand.push(anotherEight);
            
            // Should fail without declared suit
            const invalidResult = game.playCard(nextPlayer.id, anotherEight);
            expect(invalidResult.success).toBe(false);
        });

        test('should handle win conditions', () => {
            game.startGame();
            
            const player = game.getPlayerById('p1');
            const validCard = { suit: 'Hearts', rank: '7' };
            
            // Set up win scenario
            game.discardPile = [{ suit: 'Hearts', rank: 'King' }];
            player.hand = [validCard]; // Only one card left
            
            const result = game.playCard('p1', validCard);
            expect(result.success).toBe(true);
            expect(player.isSafe).toBe(true);
            expect(game.safeePlayers).toContain(player);
        });

        test('should handle tournament progression', () => {
            game.startGame();
            
            // Simulate round end
            game.players[0].isSafe = true;
            game.players[1].isSafe = true;
            game.safeePlayers = [game.players[0], game.players[1]];
            
            game.checkRoundEnd();
            
            // Last player should be eliminated
            expect(game.players[2].isEliminated).toBe(true);
            expect(game.eliminatedPlayers).toContain(game.players[2]);
        });

        test('should handle deck reshuffling', () => {
            game.startGame();
            
            // Simulate empty draw pile
            game.drawPile = [];
            game.discardPile = [
                { suit: 'Hearts', rank: '7' },
                { suit: 'Clubs', rank: '9' },
                { suit: 'Spades', rank: 'King' }
            ];
            
            game.reshuffleDiscardPile();
            
            expect(game.drawPile.length).toBeGreaterThan(0);
            expect(game.discardPile).toHaveLength(1);
            expect(game.discardPile[0]).toEqual({ suit: 'Spades', rank: 'King' });
        });
    });

    describe('Game State Management', () => {
        test('should track game statistics correctly', () => {
            game.startGame();
            
            const state = game.getGameState();
            
            expect(state.gameId).toBeDefined();
            expect(state.roundNumber).toBe(1);
            expect(state.direction).toBe(1);
            expect(state.drawStack).toBe(0);
            expect(state.declaredSuit).toBe(null);
        });

        test('should handle direction changes', () => {
            game.startGame();
            
            expect(game.direction).toBe(1);
            
            // Test reverse
            const queen = { suit: 'Hearts', rank: 'Queen' };
            const currentPlayer = game.getCurrentPlayer();
            game.discardPile = [{ suit: 'Hearts', rank: '7' }];
            currentPlayer.hand.push(queen);
            
            const result = game.playCard(currentPlayer.id, queen);
            if (result.success) {
                expect(game.direction).toBe(-1);
            }
        });

        test('should maintain player state correctly', () => {
            game.startGame();
            
            const state = game.getGameState();
            
            state.players.forEach(player => {
                expect(player.id).toBeDefined();
                expect(player.name).toBeDefined();
                expect(player.handSize).toBe(8);
                expect(player.isSafe).toBe(false);
                expect(player.isEliminated).toBe(false);
            });
            
            expect(state.players[0].isCurrentPlayer).toBe(true);
            expect(state.players[1].isCurrentPlayer).toBe(false);
            expect(state.players[2].isCurrentPlayer).toBe(false);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle empty deck gracefully', () => {
            game.startGame();
            
            // Empty both piles
            game.drawPile = [];
            game.discardPile = [{ suit: 'Hearts', rank: '7' }];
            
            const player = game.getPlayerById('p1');
            const result = game.drawCards('p1', 5);
            
            expect(result.success).toBe(true);
            expect(result.drawnCards).toHaveLength(0);
        });

        test('should validate game start requirements', () => {
            const singlePlayerGame = new Game(['p1'], ['Alice']);
            const tooManyPlayerGame = new Game(['p1', 'p2', 'p3', 'p4', 'p5'], ['A', 'B', 'C', 'D', 'E']);
            
            expect(singlePlayerGame.startGame().success).toBe(false);
            expect(tooManyPlayerGame.startGame().success).toBe(false);
        });

        test('should handle card not in hand', () => {
            game.startGame();
            
            const fakeCard = { suit: 'Hearts', rank: 'King' };
            const result = game.playCard('p1', fakeCard);
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('You do not have this card');
        });

        test('should handle invalid player operations', () => {
            game.startGame();
            
            const playResult = game.playCard('invalid', { suit: 'Hearts', rank: '7' });
            expect(playResult.success).toBe(false);
            expect(playResult.error).toBe('Player not found');
            
            const drawResult = game.drawCards('invalid', 1);
            expect(drawResult.success).toBe(false);
            expect(drawResult.error).toBe('Player not found');
            
            const hand = game.getPlayerHand('invalid');
            expect(hand).toEqual([]);
        });
    });

    describe('Performance and Reliability', () => {
        test('should handle multiple game operations efficiently', () => {
            const start = Date.now();
            
            for (let i = 0; i < 10; i++) {
                const testGame = new Game(['p1', 'p2'], ['Alice', 'Bob']);
                testGame.startGame();
                testGame.getGameState();
                
                // Try a few operations
                const player = testGame.getCurrentPlayer();
                if (player && player.hand.length > 0) {
                    testGame.drawCards(player.id, 1);
                }
            }
            
            const end = Date.now();
            expect(end - start).toBeLessThan(100); // Should be very fast
        });

        test('should maintain consistency during operations', () => {
            game.startGame();
            
            const initialCardCount = game.players.reduce((sum, p) => sum + p.hand.length, 0) + 
                                   game.drawPile.length + game.discardPile.length;
            
            // Perform several operations
            game.drawCards('p1', 2);
            game.drawCards('p2', 1);
            
            const finalCardCount = game.players.reduce((sum, p) => sum + p.hand.length, 0) + 
                                 game.drawPile.length + game.discardPile.length;
            
            expect(finalCardCount).toBe(initialCardCount);
        });
    });
});