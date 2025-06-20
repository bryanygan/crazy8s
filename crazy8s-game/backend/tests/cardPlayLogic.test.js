// Test cases for Card Play Logic with Validation
// tests/cardPlayLogic.test.js

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

const { CardPlayValidator, EnhancedGame } = require('../src/models/cardPlayLogic');

describe('Card Play Logic Tests', () => {
    let game;
    let validator;
    
    beforeEach(() => {
        game = new EnhancedGame(['p1', 'p2', 'p3'], ['Alice', 'Bob', 'Charlie']);
        validator = new CardPlayValidator(game);
        game.startGame();
    });

    describe('Basic Requirement Validations', () => {
        test('should reject play when game is not active', () => {
            game.gameState = 'waiting';
            
            const result = validator.validateBasicRequirements('p1', [{ suit: 'Hearts', rank: '7' }]);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Game is not currently active');
        });

        test('should reject play for non-existent player', () => {
            const result = validator.validateBasicRequirements('invalid_player', [{ suit: 'Hearts', rank: '7' }]);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Player not found');
        });

        test('should reject play for eliminated player', () => {
            const player = game.getPlayerById('p1');
            player.isEliminated = true;
            
            const result = validator.validateBasicRequirements('p1', [{ suit: 'Hearts', rank: '7' }]);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('You have been eliminated from the game');
        });

        test('should reject play for safe player', () => {
            const player = game.getPlayerById('p1');
            player.isSafe = true;
            
            const result = validator.validateBasicRequirements('p1', [{ suit: 'Hearts', rank: '7' }]);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('You are already safe this round');
        });

        test('should reject play when not player turn', () => {
            // p1 is current player, so p2 should be rejected
            const result = validator.validateBasicRequirements('p2', [{ suit: 'Hearts', rank: '7' }]);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Not your turn');
        });

        test('should reject play with no cards', () => {
            const result = validator.validateBasicRequirements('p1', []);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('No cards specified');
        });

        test('should accept valid basic requirements', () => {
            const result = validator.validateBasicRequirements('p1', [{ suit: 'Hearts', rank: '7' }]);
            
            expect(result.isValid).toBe(true);
        });
    });

    describe('Card Ownership Validations', () => {
        test('should reject play when player does not have the card', () => {
            const player = game.getPlayerById('p1');
            const cardNotInHand = { suit: 'Hearts', rank: 'King' };
            
            // Ensure card is not in hand
            player.hand = player.hand.filter(card => 
                !(card.suit === cardNotInHand.suit && card.rank === cardNotInHand.rank)
            );
            
            const result = validator.validateCardOwnership(player, [cardNotInHand]);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('You do not have the King of Hearts');
        });

        test('should accept play when player has all cards', () => {
            const player = game.getPlayerById('p1');
            const cardInHand = player.hand[0];
            
            const result = validator.validateCardOwnership(player, [cardInHand]);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate multiple cards ownership', () => {
            const player = game.getPlayerById('p1');
            const validCard = player.hand[0];
            const invalidCard = { suit: 'Hearts', rank: 'King' };
            
            // Ensure invalid card is not in hand
            player.hand = player.hand.filter(card => 
                !(card.suit === invalidCard.suit && card.rank === invalidCard.rank)
            );
            
            const result = validator.validateCardOwnership(player, [validCard, invalidCard]);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('You do not have the King of Hearts');
        });
    });

    describe('Card Stacking Validations', () => {
        test('should accept single card', () => {
            const result = validator.validateCardStacking([{ suit: 'Hearts', rank: '7' }]);
            
            expect(result.isValid).toBe(true);
        });

        test('should accept multiple cards of same rank', () => {
            const cards = [
                { suit: 'Hearts', rank: '7' },
                { suit: 'Clubs', rank: '7' },
                { suit: 'Spades', rank: '7' }
            ];
            
            const result = validator.validateCardStacking(cards);
            
            expect(result.isValid).toBe(true);
        });

        test('should reject cards with different ranks', () => {
            const cards = [
                { suit: 'Hearts', rank: '7' },
                { suit: 'Clubs', rank: 'King' }
            ];
            
            const result = validator.validateCardStacking(cards);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('All stacked cards must have the same rank');
        });

        test('should require same suit for stacked Aces', () => {
            const cards = [
                { suit: 'Hearts', rank: 'Ace' },
                { suit: 'Clubs', rank: 'Ace' }
            ];
            
            const result = validator.validateCardStacking(cards);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Aces can only be stacked with the same suit');
        });

        test('should require same suit for stacked 2s', () => {
            const cards = [
                { suit: 'Hearts', rank: '2' },
                { suit: 'Clubs', rank: '2' }
            ];
            
            const result = validator.validateCardStacking(cards);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('2s can only be stacked with the same suit');
        });

        test('should accept same-suit stacked Aces', () => {
            const cards = [
                { suit: 'Hearts', rank: 'Ace' },
                { suit: 'Hearts', rank: 'Ace' }
            ];
            
            const result = validator.validateCardStacking(cards);
            
            expect(result.isValid).toBe(true);
        });
    });

    describe('Standard Card Play Validations', () => {
        test('should accept matching suit', () => {
            game.discardPile = [{ suit: 'Hearts', rank: 'King' }];
            game.declaredSuit = null;
            game.drawStack = 0;
            
            const card = { suit: 'Hearts', rank: '7' };
            const result = validator.validateStandardPlay(card, game.getTopDiscardCard());
            
            expect(result.isValid).toBe(true);
        });

        test('should accept matching rank', () => {
            game.discardPile = [{ suit: 'Hearts', rank: 'King' }];
            game.declaredSuit = null;
            game.drawStack = 0;
            
            const card = { suit: 'Clubs', rank: 'King' };
            const result = validator.validateStandardPlay(card, game.getTopDiscardCard());
            
            expect(result.isValid).toBe(true);
        });

        test('should reject non-matching card', () => {
            game.discardPile = [{ suit: 'Hearts', rank: 'King' }];
            game.declaredSuit = null;
            game.drawStack = 0;
            
            const card = { suit: 'Clubs', rank: '7' };
            const result = validator.validateStandardPlay(card, game.getTopDiscardCard());
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Card must match suit (Hearts) or rank (King)');
        });

        test('should respect declared suit from wild card', () => {
            game.discardPile = [{ suit: 'Hearts', rank: '8' }];
            game.declaredSuit = 'Spades';
            game.drawStack = 0;
            
            const validCard = { suit: 'Spades', rank: '7' };
            const invalidCard = { suit: 'Hearts', rank: '7' };
            
            expect(validator.validateStandardPlay(validCard, game.getTopDiscardCard()).isValid).toBe(true);
            expect(validator.validateStandardPlay(invalidCard, game.getTopDiscardCard()).isValid).toBe(false);
        });
    });

    describe('Wild Card (8) Validations', () => {
        test('should require suit declaration for 8s', () => {
            const result = validator.validateWildCardPlay(null);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Must declare a valid suit when playing an 8 (Hearts, Diamonds, Clubs, or Spades)');
        });

        test('should reject invalid suit declaration', () => {
            const result = validator.validateWildCardPlay('InvalidSuit');
            
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Must declare a valid suit when playing an 8 (Hearts, Diamonds, Clubs, or Spades)');
        });

        test('should accept valid suit declaration', () => {
            const result = validator.validateWildCardPlay('Spades');
            
            expect(result.isValid).toBe(true);
        });
    });

    describe('Draw Stack Counter Validations', () => {
        test('should allow Ace to counter Ace', () => {
            game.discardPile = [{ suit: 'Hearts', rank: 'Ace' }];
            game.drawStack = 4;
            
            const counterCard = { suit: 'Spades', rank: 'Ace' };
            const result = validator.validateCounterPlay(counterCard);
            
            expect(result.isValid).toBe(true);
        });

        test('should allow same-suit 2 to counter Ace', () => {
            game.discardPile = [{ suit: 'Hearts', rank: 'Ace' }];
            game.drawStack = 4;
            
            const counterCard = { suit: 'Hearts', rank: '2' };
            const result = validator.validateCounterPlay(counterCard);
            
            expect(result.isValid).toBe(true);
        });

        test('should reject different-suit 2 countering Ace', () => {
            game.discardPile = [{ suit: 'Hearts', rank: 'Ace' }];
            game.drawStack = 4;
            
            const invalidCounter = { suit: 'Clubs', rank: '2' };
            const result = validator.validateCounterPlay(invalidCounter);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Cannot counter Ace with 2 of Clubs');
        });

        test('should reject invalid counter card', () => {
            game.discardPile = [{ suit: 'Hearts', rank: 'Ace' }];
            game.drawStack = 4;
            
            const invalidCounter = { suit: 'Hearts', rank: '7' };
            const result = validator.validateCounterPlay(invalidCounter);
            
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('Must draw 4 cards');
        });
    });

    describe('Full Card Play Integration Tests', () => {
        test('should successfully play a valid matching card', () => {
            const player = game.getCurrentPlayer();
            const topCard = game.getTopDiscardCard();
            
            // Find or add a matching card
            const matchingCard = { suit: topCard.suit, rank: '7' };
            player.hand.push(matchingCard);
            
            const result = game.playCard(player.id, matchingCard);
            
            expect(result.success).toBe(true);
            expect(result.cardsPlayed).toContain('7 of ' + topCard.suit);
            expect(game.getTopDiscardCard()).toEqual(matchingCard);
        });

        test('should successfully play multiple stacked cards', () => {
            const player = game.getCurrentPlayer();
            const topCard = game.getTopDiscardCard();
            
            const stackedCards = [
                { suit: topCard.suit, rank: 'King' },
                { suit: 'Clubs', rank: 'King' },
                { suit: 'Spades', rank: 'King' }
            ];
            
            player.hand.push(...stackedCards);
            
            const result = game.playCard(player.id, stackedCards);
            
            expect(result.success).toBe(true);
            expect(result.message).toContain('Played 3 Kings');
        });

        test('should successfully play wild card with suit declaration', () => {
            const player = game.getCurrentPlayer();
            const wildCard = { suit: 'Hearts', rank: '8' };
            
            player.hand.push(wildCard);
            
            const result = game.playCard(player.id, wildCard, 'Spades');
            
            expect(result.success).toBe(true);
            expect(result.message).toBe('Played 8 of Hearts and declared Spades');
            expect(game.declaredSuit).toBe('Spades');
        });

        test('should handle draw effects correctly', () => {
            const player = game.getCurrentPlayer();
            const topCard = game.getTopDiscardCard();
            
            const aceCard = { suit: topCard.suit, rank: 'Ace' };
            player.hand.push(aceCard);
            
            const result = game.playCard(player.id, aceCard);
            
            expect(result.success).toBe(true);
            expect(game.drawStack).toBe(4);
        });

        test('should handle win condition', () => {
            const player = game.getCurrentPlayer();
            const topCard = game.getTopDiscardCard();
            
            // Set player to have only one card
            const lastCard = { suit: topCard.suit, rank: '7' };
            player.hand = [lastCard];
            
            const result = game.playCard(player.id, lastCard);
            
            expect(result.success).toBe(true);
            expect(player.isSafe).toBe(true);
            expect(game.safeePlayers).toContain(player);
        });
    });

    describe('Helper Method Tests', () => {
        test('should get valid cards for player', () => {
            const player = game.getCurrentPlayer();
            const topCard = game.getTopDiscardCard();
            
            // Add some known cards - make sure invalid card truly does not match
            const validCard = { suit: topCard.suit, rank: '9' };
            const invalidCard = { suit: 'Clubs', rank: 'King' }; // Different suit AND rank
            const wildCard = { suit: 'Diamonds', rank: '8' };
            
            // Ensure invalid card does not match top card
            if (topCard.suit === 'Clubs' || topCard.rank === 'King') {
                invalidCard.suit = 'Spades';
                invalidCard.rank = 'Queen';
            }
            
            player.hand = [validCard, invalidCard, wildCard];
            
            const validCards = game.getValidCardsForPlayer(player.id);
            
            expect(validCards).toContain(validCard);
            expect(validCards).toContain(wildCard);
            expect(validCards).not.toContain(invalidCard);
        });

        test('should check if player can make valid play', () => {
            const player = game.getCurrentPlayer();
            const topCard = game.getTopDiscardCard();
            
            // Give player only cards that do not match suit or rank
            const invalidCard1 = { suit: 'Clubs', rank: 'Queen' };
            const invalidCard2 = { suit: 'Spades', rank: 'Jack' };
            
            // Ensure these cards do not match the top card
            if (topCard.suit === 'Clubs' || topCard.rank === 'Queen') {
                invalidCard1.suit = 'Diamonds';
                invalidCard1.rank = 'King';
            }
            if (topCard.suit === 'Spades' || topCard.rank === 'Jack') {
                invalidCard2.suit = 'Hearts';
                invalidCard2.rank = '10';
            }
            
            player.hand = [invalidCard1, invalidCard2];
            
            expect(game.canPlayerMakeValidPlay(player.id)).toBe(false);
            
            // Add a valid card
            const validCard = { suit: topCard.suit, rank: '7' };
            player.hand.push(validCard);
            
            expect(game.canPlayerMakeValidPlay(player.id)).toBe(true);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle execution errors gracefully', () => {
            const player = game.getCurrentPlayer();
            const topCard = game.getTopDiscardCard();
            
            // Create a valid card that matches the top card
            const validCard = { suit: topCard.suit, rank: '7' };
            player.hand.push(validCard);
            
            // Simulate error by breaking the discardPile push operation
            const originalPush = game.discardPile.push;
            game.discardPile.push = () => {
                throw new Error('Simulated execution error');
            };
            
            const result = game.playCard(player.id, validCard);
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to execute card play');
            
            // Restore state
            game.discardPile.push = originalPush;
        });

        test('should handle empty discard pile', () => {
            game.discardPile = [];
            const player = game.getCurrentPlayer();
            const card = player.hand[0];
            
            const result = validator.validateCardPlay([card]);
            
            expect(result.isValid).toBe(true);
        });

        test('should validate with draw stack and no counter available', () => {
            game.drawStack = 4;
            game.discardPile = [{ suit: 'Hearts', rank: 'Ace' }];
            
            const nonCounterCard = { suit: 'Clubs', rank: '7' };
            const result = validator.validateCardPlay([nonCounterCard]);
            
            expect(result.isValid).toBe(false);
        });
    });

    describe('Special Card Effect Processing', () => {
        test('should process Jack (Skip) effect', () => {
            const player = game.getCurrentPlayer();
            const jack = { suit: 'Hearts', rank: 'Jack' };
            
            const initialPlayerIndex = game.currentPlayerIndex;
            validator.processSpecialCardEffect(jack);
            
            // Should advance one additional time (skip next player)
            expect(game.currentPlayerIndex).toBe((initialPlayerIndex + 1) % game.activePlayers.length);
        });

        test('should process Queen (Reverse) effect', () => {
            const queen = { suit: 'Hearts', rank: 'Queen' };
            
            expect(game.direction).toBe(1);
            validator.processSpecialCardEffect(queen);
            expect(game.direction).toBe(-1);
        });

        test('should process Ace draw effect', () => {
            const ace = { suit: 'Hearts', rank: 'Ace' };
            
            const effect = validator.processSpecialCardEffect(ace);
            
            expect(effect.drawAmount).toBe(4);
        });

        test('should process 2 draw effect', () => {
            const two = { suit: 'Hearts', rank: '2' };
            
            const effect = validator.processSpecialCardEffect(two);
            
            expect(effect.drawAmount).toBe(2);
        });

        test('should process 8 (Wild) effect', () => {
            const eight = { suit: 'Hearts', rank: '8' };
            
            validator.processSpecialCardEffect(eight, 'Spades');
            
            expect(game.declaredSuit).toBe('Spades');
        });
    });

    describe('Message Generation Tests', () => {
        test('should generate message for single card', () => {
            const card = { suit: 'Hearts', rank: 'King' };
            const message = validator.generatePlayMessage([card]);
            
            expect(message).toBe('Played King of Hearts');
        });

        test('should generate message for wild card with suit', () => {
            const card = { suit: 'Hearts', rank: '8' };
            const message = validator.generatePlayMessage([card], 'Spades');
            
            expect(message).toBe('Played 8 of Hearts and declared Spades');
        });

        test('should generate message for multiple cards', () => {
            const cards = [
                { suit: 'Hearts', rank: 'King' },
                { suit: 'Clubs', rank: 'King' }
            ];
            const message = validator.generatePlayMessage(cards);
            
            expect(message).toBe('Played 2 Kings: Hearts, Clubs');
        });
    });
});

describe('Performance and Stress Tests', () => {
    test('should handle large number of validations efficiently', () => {
        const game = new EnhancedGame(['p1', 'p2'], ['Alice', 'Bob']);
        game.startGame();
        
        const start = Date.now();
        
        for (let i = 0; i < 1000; i++) {
            const player = game.getCurrentPlayer();
            const card = player.hand[0];
            game.playCard(player.id, card);
        }
        
        const end = Date.now();
        // Allow a bit more time in slower environments
        expect(end - start).toBeLessThan(1200);
    });

    test('should maintain consistency during rapid plays', () => {
        const game = new EnhancedGame(['p1', 'p2'], ['Alice', 'Bob']);
        game.startGame();
        
        const initialCards = game.players.reduce((sum, p) => sum + p.hand.length, 0) + 
                           game.drawPile.length + game.discardPile.length;
        
        // Perform several plays
        for (let i = 0; i < 5; i++) {
            const player = game.getCurrentPlayer();
            if (player && player.hand.length > 0) {
                const validCards = game.getValidCardsForPlayer(player.id);
                if (validCards.length > 0) {
                    game.playCard(player.id, validCards[0]);
                }
            }
        }
        
        const finalCards = game.players.reduce((sum, p) => sum + p.hand.length, 0) + 
                         game.drawPile.length + game.discardPile.length;
        
        expect(finalCards).toBe(initialCards);
    });
});