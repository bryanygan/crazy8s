/**
 * ValidationSystem.js - Validates player actions against lesson requirements
 * Integrates with existing game logic to ensure tutorial actions are valid
 */

/**
 * Validates player actions within the tutorial context
 */
class ValidationSystem {
    /**
     * Initialize the validation system
     * @param {Object} gameState - Current game state reference
     */
    constructor(gameState) {
        this.gameState = gameState;
        this.lessonRequirements = [];
        this.validationRules = new Map();
        this.onValidation = null; // Callback for validation events
        
        this.initialize();
    }

    /**
     * Initialize the validation system
     * @private
     */
    initialize() {
        this.setupValidationRules();
        console.log('✅ Validation System initialized');
    }

    /**
     * Set up validation rules for different action types
     * @private
     */
    setupValidationRules() {
        // Play card validation rules
        this.validationRules.set('playCard', [
            this.validatePlayerTurn.bind(this),
            this.validateCardOwnership.bind(this),
            this.validateCardPlayability.bind(this),
            this.validateStackingRules.bind(this),
            this.validateLessonRequirements.bind(this)
        ]);
        
        // Draw card validation rules
        this.validationRules.set('drawCard', [
            this.validatePlayerTurn.bind(this),
            this.validateDrawConditions.bind(this),
            this.validateLessonRequirements.bind(this)
        ]);
        
        // Select card validation rules
        this.validationRules.set('selectCard', [
            this.validateCardOwnership.bind(this),
            this.validateSelectionRules.bind(this),
            this.validateLessonRequirements.bind(this)
        ]);
        
        // Declare suit validation rules
        this.validationRules.set('declareSuit', [
            this.validateWildCardContext.bind(this),
            this.validateSuitChoice.bind(this),
            this.validateLessonRequirements.bind(this)
        ]);
    }

    /**
     * Set lesson requirements for validation
     * @param {Array<Object>} requirements - Array of lesson requirements
     */
    setLessonRequirements(requirements) {
        this.lessonRequirements = requirements || [];
        console.log('📋 Set lesson requirements:', this.lessonRequirements.length);
    }

    /**
     * Validate a player action
     * @param {string} actionType - Type of action to validate
     * @param {Object} actionData - Action data and parameters
     * @param {Object} currentGameState - Current game state
     * @returns {Promise<Object>} Validation result
     */
    async validateAction(actionType, actionData, currentGameState) {
        console.log(`🔍 Validating action: ${actionType}`, actionData);
        
        try {
            const validationResult = {
                actionType,
                actionData,
                isValid: true,
                errors: [],
                warnings: [],
                validationDetails: {},
                timestamp: Date.now()
            };
            
            // Get validation rules for this action type
            const rules = this.validationRules.get(actionType);
            
            if (!rules) {
                validationResult.errors.push(`Unknown action type: ${actionType}`);
                validationResult.isValid = false;
                return validationResult;
            }
            
            // Apply validation rules sequentially
            for (const rule of rules) {
                const ruleResult = await rule(actionData, currentGameState, validationResult);
                
                if (!ruleResult.isValid) {
                    validationResult.isValid = false;
                    validationResult.errors.push(...ruleResult.errors);
                }
                
                if (ruleResult.warnings) {
                    validationResult.warnings.push(...ruleResult.warnings);
                }
                
                // Merge validation details
                Object.assign(validationResult.validationDetails, ruleResult.details || {});
                
                // Stop validation on first failure (unless configured otherwise)
                if (!ruleResult.isValid && !ruleResult.continueOnFailure) {
                    break;
                }
            }
            
            // Notify validation event
            if (this.onValidation) {
                this.onValidation(validationResult);
            }
            
            console.log(`${validationResult.isValid ? '✅' : '❌'} Validation result:`, validationResult);
            
            return validationResult;
            
        } catch (error) {
            console.error('❌ Validation error:', error);
            
            return {
                actionType,
                actionData,
                isValid: false,
                errors: [`Validation failed: ${error.message}`],
                warnings: [],
                validationDetails: {},
                timestamp: Date.now()
            };
        }
    }

    /**
     * Validate that it's the player's turn
     * @param {Object} actionData - Action data
     * @param {Object} gameState - Current game state
     * @param {Object} validationResult - Current validation result
     * @returns {Object} Rule validation result
     * @private
     */
    async validatePlayerTurn(actionData, gameState, validationResult) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            details: { checkedPlayerTurn: true }
        };
        
        // In tutorial, assume it's always the tutorial player's turn
        const currentPlayer = gameState.currentPlayer;
        const tutorialPlayer = 'You'; // Tutorial player name
        
        if (currentPlayer !== tutorialPlayer) {
            result.isValid = false;
            result.errors.push('It is not your turn');
        }
        
        return result;
    }

    /**
     * Validate that the player owns the cards they're trying to use
     * @param {Object} actionData - Action data
     * @param {Object} gameState - Current game state
     * @param {Object} validationResult - Current validation result
     * @returns {Object} Rule validation result
     * @private
     */
    async validateCardOwnership(actionData, gameState, validationResult) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            details: { checkedOwnership: true }
        };
        
        const playerHand = gameState.players[0].hand; // Tutorial player is always first
        
        if (actionData.cards) {
            const cardsToCheck = Array.isArray(actionData.cards) ? actionData.cards : [actionData.cards];
            
            for (const card of cardsToCheck) {
                const ownsCard = playerHand.some(handCard => 
                    handCard.suit === card.suit && handCard.rank === card.rank
                );
                
                if (!ownsCard) {
                    result.isValid = false;
                    result.errors.push(`You don't have the ${card.rank} of ${card.suit}`);
                }
            }
        }
        
        if (actionData.card) {
            const card = actionData.card;
            const ownsCard = playerHand.some(handCard => 
                handCard.suit === card.suit && handCard.rank === card.rank
            );
            
            if (!ownsCard) {
                result.isValid = false;
                result.errors.push(`You don't have the ${card.rank} of ${card.suit}`);
            }
        }
        
        return result;
    }

    /**
     * Validate that cards can be played according to game rules
     * @param {Object} actionData - Action data
     * @param {Object} gameState - Current game state
     * @param {Object} validationResult - Current validation result
     * @returns {Object} Rule validation result
     * @private
     */
    async validateCardPlayability(actionData, gameState, validationResult) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            details: { checkedPlayability: true }
        };
        
        if (!actionData.cards || actionData.cards.length === 0) {
            result.isValid = false;
            result.errors.push('No cards specified to play');
            return result;
        }
        
        const cards = Array.isArray(actionData.cards) ? actionData.cards : [actionData.cards];
        const topCard = this.getTopDiscardCard(gameState);
        const declaredSuit = gameState.declaredSuit;
        const drawStack = gameState.drawStack || 0;
        
        // Check if player must draw penalty cards
        if (drawStack > 0) {
            const canCounter = this.canCounterDrawCards(cards[0], topCard);
            
            if (!canCounter) {
                result.isValid = false;
                result.errors.push(`You must draw ${drawStack} cards or play a counter card`);
                return result;
            }
        }
        
        // Validate first card can be played
        const firstCard = cards[0];
        const canPlayFirst = this.canPlayCard(firstCard, topCard, declaredSuit);
        
        if (!canPlayFirst.isValid) {
            result.isValid = false;
            result.errors.push(...canPlayFirst.errors);
            return result;
        }
        
        // For multiple cards, validate stacking rules
        if (cards.length > 1) {
            const stackingResult = this.validateCardStacking(cards, gameState);
            
            if (!stackingResult.isValid) {
                result.isValid = false;
                result.errors.push(...stackingResult.errors);
            }
        }
        
        return result;
    }

    /**
     * Validate card stacking rules (simplified for tutorial)
     * @param {Array<Object>} cards - Cards to stack
     * @param {Object} gameState - Current game state
     * @returns {Object} Stacking validation result
     * @private
     */
    validateCardStacking(cards, gameState) {
        const result = {
            isValid: true,
            errors: [],
            warnings: []
        };
        
        // Basic stacking rules for tutorial
        for (let i = 1; i < cards.length; i++) {
            const prevCard = cards[i - 1];
            const currentCard = cards[i];
            
            const matchesSuit = prevCard.suit === currentCard.suit;
            const matchesRank = prevCard.rank === currentCard.rank;
            
            if (!matchesSuit && !matchesRank) {
                result.isValid = false;
                result.errors.push(
                    `Cannot stack ${currentCard.rank} of ${currentCard.suit} after ${prevCard.rank} of ${prevCard.suit}`
                );
            }
        }
        
        return result;
    }

    /**
     * Validate advanced stacking rules
     * @param {Object} actionData - Action data
     * @param {Object} gameState - Current game state
     * @param {Object} validationResult - Current validation result
     * @returns {Object} Rule validation result
     * @private
     */
    async validateStackingRules(actionData, gameState, validationResult) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            details: { checkedStacking: true }
        };
        
        if (!actionData.cards || actionData.cards.length <= 1) {
            return result; // No stacking to validate
        }
        
        const cards = actionData.cards;
        
        // Use simplified stacking validation for tutorial
        const stackingResult = this.validateCardStacking(cards, gameState);
        
        if (!stackingResult.isValid) {
            result.isValid = false;
            result.errors.push(...stackingResult.errors);
        }
        
        return result;
    }

    /**
     * Validate draw card conditions
     * @param {Object} actionData - Action data
     * @param {Object} gameState - Current game state
     * @param {Object} validationResult - Current validation result
     * @returns {Object} Rule validation result
     * @private
     */
    async validateDrawConditions(actionData, gameState, validationResult) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            details: { checkedDrawConditions: true }
        };
        
        const drawStack = gameState.drawStack || 0;
        const requestedCount = actionData.count || 1;
        
        // Check if player has playable cards (simplified for tutorial)
        const playerHand = gameState.players[0].hand;
        const topCard = this.getTopDiscardCard(gameState);
        const hasPlayableCards = this.hasPlayableCards(playerHand, topCard, gameState.declaredSuit);
        
        if (hasPlayableCards && drawStack === 0) {
            result.warnings.push('You have playable cards. Consider playing instead of drawing.');
        }
        
        // Validate draw count
        if (drawStack > 0 && requestedCount !== drawStack) {
            result.isValid = false;
            result.errors.push(`You must draw exactly ${drawStack} cards`);
        }
        
        return result;
    }

    /**
     * Validate card selection rules
     * @param {Object} actionData - Action data
     * @param {Object} gameState - Current game state
     * @param {Object} validationResult - Current validation result
     * @returns {Object} Rule validation result
     * @private
     */
    async validateSelectionRules(actionData, gameState, validationResult) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            details: { checkedSelection: true }
        };
        
        // Basic selection validation - ensure card exists and is selectable
        const selectedCards = gameState.tutorial.selectedCards || [];
        const maxSelectable = 8; // Reasonable limit for tutorial
        
        if (actionData.selected && selectedCards.length >= maxSelectable) {
            result.isValid = false;
            result.errors.push(`Cannot select more than ${maxSelectable} cards`);
        }
        
        return result;
    }

    /**
     * Validate wild card context
     * @param {Object} actionData - Action data
     * @param {Object} gameState - Current game state
     * @param {Object} validationResult - Current validation result
     * @returns {Object} Rule validation result
     * @private
     */
    async validateWildCardContext(actionData, gameState, validationResult) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            details: { checkedWildCardContext: true }
        };
        
        // Check if there's a wild card (8) that needs suit declaration
        const selectedCards = gameState.tutorial.selectedCards || [];
        const hasWildCard = selectedCards.some(card => card.rank === '8');
        
        if (!hasWildCard) {
            result.isValid = false;
            result.errors.push('No wild card played that requires suit declaration');
        }
        
        return result;
    }

    /**
     * Validate suit choice
     * @param {Object} actionData - Action data
     * @param {Object} gameState - Current game state
     * @param {Object} validationResult - Current validation result
     * @returns {Object} Rule validation result
     * @private
     */
    async validateSuitChoice(actionData, gameState, validationResult) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            details: { checkedSuitChoice: true }
        };
        
        const validSuits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        
        if (!actionData.suit) {
            result.isValid = false;
            result.errors.push('No suit specified');
            return result;
        }
        
        if (!validSuits.includes(actionData.suit)) {
            result.isValid = false;
            result.errors.push(`Invalid suit: ${actionData.suit}`);
        }
        
        return result;
    }

    /**
     * Validate lesson-specific requirements
     * @param {Object} actionData - Action data
     * @param {Object} gameState - Current game state
     * @param {Object} validationResult - Current validation result
     * @returns {Object} Rule validation result
     * @private
     */
    async validateLessonRequirements(actionData, gameState, validationResult) {
        const result = {
            isValid: true,
            errors: [],
            warnings: [],
            details: { checkedLessonRequirements: true },
            continueOnFailure: true // Continue validation even if lesson requirements fail
        };
        
        for (const requirement of this.lessonRequirements) {
            const requirementResult = this.validateSingleRequirement(requirement, actionData, gameState);
            
            if (!requirementResult.isValid) {
                result.errors.push(...requirementResult.errors);
                
                // For lesson requirements, we might want to show as warnings instead of blocking
                if (requirement.severity === 'warning') {
                    result.warnings.push(...requirementResult.errors);
                    result.errors = result.errors.filter(error => 
                        !requirementResult.errors.includes(error)
                    );
                } else {
                    result.isValid = false;
                }
            }
        }
        
        return result;
    }

    /**
     * Validate a single lesson requirement
     * @param {Object} requirement - Lesson requirement
     * @param {Object} actionData - Action data
     * @param {Object} gameState - Current game state
     * @returns {Object} Requirement validation result
     * @private
     */
    validateSingleRequirement(requirement, actionData, gameState) {
        const result = {
            isValid: true,
            errors: []
        };
        
        switch (requirement.type) {
            case 'mustPlayCard':
                if (actionData.cards) {
                    const requiredCard = requirement.card;
                    const playedCards = Array.isArray(actionData.cards) ? actionData.cards : [actionData.cards];
                    const hasRequiredCard = playedCards.some(card =>
                        card.suit === requiredCard.suit && card.rank === requiredCard.rank
                    );
                    
                    if (!hasRequiredCard) {
                        result.isValid = false;
                        result.errors.push(`You must play the ${requiredCard.rank} of ${requiredCard.suit}`);
                    }
                }
                break;
                
            case 'mustNotPlayCard':
                if (actionData.cards) {
                    const forbiddenCard = requirement.card;
                    const playedCards = Array.isArray(actionData.cards) ? actionData.cards : [actionData.cards];
                    const hasForbiddenCard = playedCards.some(card =>
                        card.suit === forbiddenCard.suit && card.rank === forbiddenCard.rank
                    );
                    
                    if (hasForbiddenCard) {
                        result.isValid = false;
                        result.errors.push(`You cannot play the ${forbiddenCard.rank} of ${forbiddenCard.suit} in this lesson`);
                    }
                }
                break;
                
            case 'mustPlayRank':
                if (actionData.cards) {
                    const requiredRank = requirement.rank;
                    const playedCards = Array.isArray(actionData.cards) ? actionData.cards : [actionData.cards];
                    const hasRequiredRank = playedCards.some(card => card.rank === requiredRank);
                    
                    if (!hasRequiredRank) {
                        result.isValid = false;
                        result.errors.push(`You must play a ${requiredRank} for this lesson`);
                    }
                }
                break;
                
            case 'mustPlaySuit':
                if (actionData.cards) {
                    const requiredSuit = requirement.suit;
                    const playedCards = Array.isArray(actionData.cards) ? actionData.cards : [actionData.cards];
                    const hasRequiredSuit = playedCards.some(card => card.suit === requiredSuit);
                    
                    if (!hasRequiredSuit) {
                        result.isValid = false;
                        result.errors.push(`You must play a ${requiredSuit} card for this lesson`);
                    }
                }
                break;
                
            case 'mustSelectCount':
                if (validationResult.actionType === 'selectCard') {
                    const selectedCards = gameState.tutorial.selectedCards || [];
                    const requiredCount = requirement.count;
                    
                    if (selectedCards.length !== requiredCount) {
                        result.isValid = false;
                        result.errors.push(`You must select exactly ${requiredCount} cards`);
                    }
                }
                break;
                
            default:
                console.warn('Unknown requirement type:', requirement.type);
        }
        
        return result;
    }

    /**
     * Check if a card can be played
     * @param {Object} card - Card to check
     * @param {Object} topCard - Top card of discard pile
     * @param {string} declaredSuit - Declared suit (for wild cards)
     * @returns {Object} Playability result
     * @private
     */
    canPlayCard(card, topCard, declaredSuit) {
        const result = {
            isValid: false,
            errors: []
        };
        
        if (!topCard) {
            result.isValid = true;
            return result;
        }
        
        // Wild cards (8s) can always be played
        if (card.rank === '8') {
            result.isValid = true;
            return result;
        }
        
        // Check suit match (considering declared suit)
        const suitToMatch = declaredSuit || topCard.suit;
        if (card.suit === suitToMatch) {
            result.isValid = true;
            return result;
        }
        
        // Check rank match
        if (card.rank === topCard.rank) {
            result.isValid = true;
            return result;
        }
        
        result.errors.push(`${card.rank} of ${card.suit} cannot be played on ${topCard.rank} of ${topCard.suit}`);
        return result;
    }

    /**
     * Check if cards can counter draw penalty
     * @param {Object} card - Card to check
     * @param {Object} topCard - Top card causing penalty
     * @returns {boolean} Whether card can counter
     * @private
     */
    canCounterDrawCards(card, topCard) {
        if (!topCard) return false;
        
        // Aces can be countered by other Aces or same-suit 2s
        if (topCard.rank === 'Ace') {
            return card.rank === 'Ace' || (card.rank === '2' && card.suit === topCard.suit);
        }
        
        // 2s can be countered by other 2s or same-suit Aces
        if (topCard.rank === '2') {
            return card.rank === '2' || (card.rank === 'Ace' && card.suit === topCard.suit);
        }
        
        return false;
    }

    /**
     * Check if player has playable cards
     * @param {Array<Object>} hand - Player's hand
     * @param {Object} topCard - Top card of discard pile
     * @param {string} declaredSuit - Declared suit
     * @returns {boolean} Whether player has playable cards
     * @private
     */
    hasPlayableCards(hand, topCard, declaredSuit) {
        return hand.some(card => {
            const result = this.canPlayCard(card, topCard, declaredSuit);
            return result.isValid;
        });
    }

    /**
     * Get the top card of the discard pile
     * @param {Object} gameState - Current game state
     * @returns {Object|null} Top discard card
     * @private
     */
    getTopDiscardCard(gameState) {
        const discardPile = gameState.discardPile || [];
        return discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
    }

    /**
     * Reset validation system
     */
    reset() {
        console.log('🔄 Resetting validation system');
        this.lessonRequirements = [];
    }

    /**
     * Get validation statistics
     * @returns {Object} Validation statistics
     */
    getValidationStats() {
        return {
            rulesCount: this.validationRules.size,
            requirementsCount: this.lessonRequirements.length,
            supportedActions: Array.from(this.validationRules.keys())
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        console.log('🗑️ Destroying validation system');
        this.reset();
        this.validationRules.clear();
        this.onValidation = null;
    }
}

export default ValidationSystem;