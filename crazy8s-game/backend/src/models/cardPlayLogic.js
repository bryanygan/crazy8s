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
                this.game.nextPlayer();
                break;
            case 'Queen':
                if (this.game.activePlayers.length === 2) {
                    this.game.nextPlayer();
                } else {
                    this.game.direction *= -1;
                }
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
            const rank = cards[0].rank;
            const suits = cards.map(card => card.suit).join(', ');
            return `Played ${cards.length} ${rank}s: ${suits}`;
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
}

module.exports = { CardPlayValidator, EnhancedGame };