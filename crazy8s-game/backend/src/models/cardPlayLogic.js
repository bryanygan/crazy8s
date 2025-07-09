// src/models/cardPlayLogic.js
// Enhanced card play logic for Crazy 8's game

const Game = require('./game');

class CardPlayValidator {
    constructor(game) {
        this.game = game;
    }

    /**
     * Main method to play a card with full validation
     */
    playCard(playerId, cards, declaredSuit = null) {
        const cardsToPlay = Array.isArray(cards) ? cards : [cards];
        
        const basicValidation = this.validateBasicRequirements(playerId, cardsToPlay);
        if (!basicValidation.isValid) {
            return { success: false, error: basicValidation.error };
        }

        const player = this.game.getPlayerById(playerId);
        
        const ownershipValidation = this.validateCardOwnership(player, cardsToPlay);
        if (!ownershipValidation.isValid) {
            return { success: false, error: ownershipValidation.error };
        }

        if (cardsToPlay.length > 1) {
            const stackingValidation = this.validateCardStacking(cardsToPlay);
            if (!stackingValidation.isValid) {
                return { success: false, error: stackingValidation.error };
            }
        }

        const playValidation = this.validateCardPlay(cardsToPlay, declaredSuit);
        if (!playValidation.isValid) {
            return { success: false, error: playValidation.error };
        }

        return this.executeCardPlay(player, cardsToPlay, declaredSuit);
    }

    validateBasicRequirements(playerId, cards) {
        if (this.game.gameState !== 'playing') {
            return { isValid: false, error: 'Game is not currently active' };
        }

        const player = this.game.getPlayerById(playerId);
        if (!player) {
            return { isValid: false, error: 'Player not found' };
        }

        if (player.isEliminated) {
            return { isValid: false, error: 'You have been eliminated from the game' };
        }

        if (player.isSafe) {
            return { isValid: false, error: 'You are already safe this round' };
        }

        const currentPlayer = this.game.getCurrentPlayer();
        if (!currentPlayer || currentPlayer.id !== playerId) {
            return { isValid: false, error: 'Not your turn' };
        }

        if (!cards || cards.length === 0) {
            return { isValid: false, error: 'No cards specified' };
        }

        return { isValid: true };
    }

    validateCardOwnership(player, cards) {
        for (const card of cards) {
            const cardIndex = this.game.findCardInHand(player.hand, card);
            if (cardIndex === -1) {
                return { 
                    isValid: false, 
                    error: `You do not have the ${card.rank} of ${card.suit}` 
                };
            }
        }
        return { isValid: true };
    }

    validateCardStacking(cards) {
        if (cards.length === 1) {
            return { isValid: true };
        }

        const bottomCard = cards[0];
        const additionalCards = cards.slice(1);

        for (const card of additionalCards) {
            if (card.rank !== bottomCard.rank) {
                return { 
                    isValid: false, 
                    error: 'All stacked cards must have the same rank' 
                };
            }
        }

        if (bottomCard.rank === 'Ace' || bottomCard.rank === '2') {
            for (const card of additionalCards) {
                if (card.suit !== bottomCard.suit) {
                    return { 
                        isValid: false, 
                        error: `${bottomCard.rank}s can only be stacked with the same suit` 
                    };
                }
            }
        }

        return { isValid: true };
    }

    validateCardPlay(cards, declaredSuit) {
        const bottomCard = cards[0];
        const topDiscardCard = this.game.getTopDiscardCard();
        
        if (!topDiscardCard) {
            return { isValid: true };
        }

        if (this.game.drawStack > 0) {
            return this.validateCounterPlay(bottomCard);
        }

        if (bottomCard.rank === '8') {
            return this.validateWildCardPlay(declaredSuit);
        }

        return this.validateStandardPlay(bottomCard, topDiscardCard);
    }

    validateCounterPlay(card) {
        const topCard = this.game.getTopDiscardCard();
        
        if (!this.game.canCounterDraw(card)) {
            return { 
                isValid: false, 
                error: `Cannot counter ${topCard.rank} with ${card.rank} of ${card.suit}. ` +
                       `Must draw ${this.game.drawStack} cards or play a valid counter card.` 
            };
        }

        return { isValid: true };
    }

    validateWildCardPlay(declaredSuit) {
        const validSuits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        
        if (!declaredSuit || !validSuits.includes(declaredSuit)) {
            return { 
                isValid: false, 
                error: 'Must declare a valid suit when playing an 8 (Hearts, Diamonds, Clubs, or Spades)' 
            };
        }

        return { isValid: true };
    }

    validateStandardPlay(card, topCard) {
        const suitToMatch = this.game.declaredSuit || topCard.suit;
        
        const matchesSuit = card.suit === suitToMatch;
        const matchesRank = card.rank === topCard.rank;
        
        if (!matchesSuit && !matchesRank) {
            return { 
                isValid: false, 
                error: `Card must match suit (${suitToMatch}) or rank (${topCard.rank})` 
            };
        }

        return { isValid: true };
    }

    executeCardPlay(player, cards, declaredSuit) {
        try {
            for (const card of cards) {
                const cardIndex = this.game.findCardInHand(player.hand, card);
                if (cardIndex !== -1) {
                    player.hand.splice(cardIndex, 1);
                }
            }

            this.game.discardPile.push(...cards);

            let totalDrawEffect = 0;
            for (const card of cards) {
                const effect = this.processSpecialCardEffect(card, declaredSuit);
                if (effect.drawAmount) {
                    totalDrawEffect += effect.drawAmount;
                }
            }

            if (totalDrawEffect > 0) {
                this.game.drawStack += totalDrawEffect;
            }

            if (player.hand.length === 0) {
                player.isSafe = true;
                this.game.safeePlayers.push(player);
                this.game.checkRoundEnd();
            } else {
                this.game.nextPlayer();
            }

            return {
                success: true,
                message: this.generatePlayMessage(cards, declaredSuit),
                gameState: this.game.getGameState(),
                cardsPlayed: cards.map(card => this.game.cardToString(card))
            };

        } catch (error) {
            return {
                success: false,
                error: `Failed to execute card play: ${error.message}`
            };
        }
    }

    processSpecialCardEffect(card, declaredSuit) {
        const effect = { drawAmount: 0 };

        switch (card.rank) {
            case 'Jack':
                // In tournament with 2 players left, Jack should keep turn (like 2-player game)
                if (this.game.activePlayers.length === 2) {
                    // In 2-player scenario, Jack keeps turn - don't advance
                } else {
                    // In 3+ player games, Jack skips the next player
                    this.game.nextPlayer();
                }
                break;
            case 'Queen':
                // Queens always reverse direction (consistent with game.js)
                this.game.direction *= -1;
                break;
            case 'Ace':
                effect.drawAmount = 4;
                break;
            case '2':
                effect.drawAmount = 2;
                break;
            case '8':
                this.game.declaredSuit = declaredSuit;
                break;
            default:
                this.game.declaredSuit = null;
                break;
        }

        return effect;
    }

    generatePlayMessage(cards, declaredSuit) {
        if (cards.length === 1) {
            const card = cards[0];
            let message = `Played ${card.rank} of ${card.suit}`;
            
            if (card.rank === '8' && declaredSuit) {
                message += ` and declared ${declaredSuit}`;
            }
            
            return message;
        } else {
            // Multiple cards - check if they're all the same rank
            const allSameRank = cards.every(card => card.rank === cards[0].rank);
            
            if (allSameRank) {
                // All same rank - use the old format
                const rank = cards[0].rank;
                const suits = cards.map(card => card.suit).join(', ');
                return `Played ${cards.length} ${rank}s: ${suits}`;
            } else {
                // Mixed ranks - show individual cards with symbols
                const cardStrings = cards.map(card => {
                    const suitSymbol = {
                        'Hearts': '♥',
                        'Diamonds': '♦', 
                        'Clubs': '♣',
                        'Spades': '♠'
                    }[card.suit] || card.suit;
                    
                    // Use short rank notation
                    const shortRank = {
                        'Jack': 'J',
                        'Queen': 'Q', 
                        'King': 'K',
                        'Ace': 'A'
                    }[card.rank] || card.rank;
                    
                    return `${shortRank}${suitSymbol}`;
                });
                
                let message = `Played ${cardStrings.join(', ')}`;
                
                // Check if any card is an 8 (wild) and add suit declaration
                const hasWild = cards.some(card => card.rank === '8');
                if (hasWild && declaredSuit) {
                    message += ` and declared ${declaredSuit}`;
                }
                
                return message;
            }
        }
    }
}

class EnhancedGame extends Game {
    constructor(playerIds, playerNames) {
        super(playerIds, playerNames);
        this.playValidator = new CardPlayValidator(this);
    }

    playCard(playerId, cards, declaredSuit = null) {
        return this.playValidator.playCard(playerId, cards, declaredSuit);
    }

    getValidCardsForPlayer(playerId) {
        const player = this.getPlayerById(playerId);
        if (!player) return [];

        const topCard = this.getTopDiscardCard();
        if (!topCard) return player.hand;

        const suitToMatch = this.declaredSuit || topCard.suit;
        const validCards = [];

        for (const card of player.hand) {
            if (card.rank === '8') {
                validCards.push(card);
                continue;
            }

            if (this.drawStack > 0) {
                if (this.canCounterDraw(card)) {
                    validCards.push(card);
                }
                continue;
            }

            if (card.suit === suitToMatch || card.rank === topCard.rank) {
                validCards.push(card);
            }
        }

        return validCards;
    }

    canPlayerMakeValidPlay(playerId) {
        const validCards = this.getValidCardsForPlayer(playerId);
        return validCards.length > 0;
    }

    // Override the simulateTurnControl method to match the updated Game class logic
    simulateTurnControl(cardStack) {
        if (cardStack.length === 0) return true;

        const playerCount = this.activePlayers.length;
        
        // Check if this is a pure Jack stack in a 2-player game
        const isPureJackStack = cardStack.every(card => card.rank === 'Jack');
        const is2PlayerGame = playerCount === 2;
        
        if (isPureJackStack && is2PlayerGame) {
            console.log('🎯 Pure Jack stack in 2-player game - original player keeps turn');
            return true; // Original player always keeps turn
        }
        
        // Original turn simulation logic for other cases
        let currentIndex = 0; // Start relative to the current player
        let direction = this.direction;
        let pendingSkips = 0;

        for (const card of cardStack) {
            if (card.rank === 'Jack') {
                // Accumulate skip effects; actual move applied when a non-Jack is processed
                if (playerCount !== 2) {
                    pendingSkips += 1;
                }
                continue;
            }

            if (pendingSkips > 0) {
                if (playerCount !== 2) {
                    currentIndex = (currentIndex + pendingSkips + 1) % playerCount;
                }
                pendingSkips = 0;
            }

            switch (card.rank) {
                case 'Queen':
                    direction *= -1;
                    currentIndex = (currentIndex + direction + playerCount) % playerCount;
                    break;
                case 'Ace':
                case '2':
                case '8':
                    currentIndex = (currentIndex + direction + playerCount) % playerCount;
                    break;
                default:
                    currentIndex = (currentIndex + direction + playerCount) % playerCount;
                    break;
            }
        }

        if (pendingSkips > 0) {
            if (playerCount !== 2) {
                currentIndex = (currentIndex + pendingSkips + 1) % playerCount;
            }
        }

        // Player keeps the turn only if we end back at index 0
        return currentIndex === 0;
    }

    // Override validateCardStacking to use the updated logic
    validateCardStacking(cards) {
        if (cards.length <= 1) {
            return { isValid: true };
        }

        console.log('🔍 Validating card stack:', cards.map(c => `${c.rank} of ${c.suit}`));

        // Check each card-to-card transition in the stack
        for (let i = 1; i < cards.length; i++) {
            const prevCard = cards[i - 1];
            const currentCard = cards[i];
            
            console.log(`  Checking transition: ${prevCard.rank} of ${prevCard.suit} → ${currentCard.rank} of ${currentCard.suit}`);
            
            // Cards must match by suit or rank
            const matchesSuit = prevCard.suit === currentCard.suit;
            const matchesRank = prevCard.rank === currentCard.rank;
            
            // Special case: Aces and 2s can stack with each other if same suit
            const isAce2Cross = (
                (prevCard.rank === 'Ace' && currentCard.rank === '2') ||
                (prevCard.rank === '2' && currentCard.rank === 'Ace')
            ) && prevCard.suit === currentCard.suit;
            
            console.log(`    Matches suit: ${matchesSuit}, Matches rank: ${matchesRank}, Ace/2 cross: ${isAce2Cross}`);
            
            // Basic matching requirement
            if (!matchesSuit && !matchesRank && !isAce2Cross) {
                console.log(`    ❌ Invalid transition - no suit/rank match!`);
                return {
                    isValid: false,
                    error: `Cannot stack ${currentCard.rank} of ${currentCard.suit} after ${prevCard.rank} of ${prevCard.suit}. Cards must match suit or rank.`
                };
            }
            
            // If different rank but same suit, validate turn chain logic
            if (matchesSuit && !matchesRank && !isAce2Cross) {
                const stackUpToHere = cards.slice(0, i);
                const wouldHaveTurnControl = this.simulateTurnControl(stackUpToHere);
                
                if (!wouldHaveTurnControl) {
                    console.log(`    ❌ Invalid transition - no turn control after previous cards!`);
                    return {
                        isValid: false,
                        error: `Cannot stack ${currentCard.rank} of ${currentCard.suit} after ${prevCard.rank} of ${prevCard.suit}. Previous cards don't maintain turn control.`
                    };
                }
            }
            
            console.log(`    ✅ Valid transition`);
        }
        
        console.log('✅ Stack validation passed');
        return { isValid: true };
    }
}

module.exports = { CardPlayValidator, EnhancedGame };