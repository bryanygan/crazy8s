// src/models/EnhancedGame.js
const Game = require("./game");
const CardPlayValidator = require("./CardPlayValidator");

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

module.exports = EnhancedGame;
