/**
 * TutorialActionInterceptor.js - Intercepts and validates game actions during tutorial
 * Bridges between real game actions and tutorial validation system
 */

/**
 * Creates an action interceptor for tutorial mode
 * Wraps game actions to validate them against tutorial requirements
 */
class TutorialActionInterceptor {
    constructor(tutorialEngine, onFeedback) {
        this.tutorialEngine = tutorialEngine;
        this.onFeedback = onFeedback || (() => {});
        this.isIntercepting = false;
        this.simulatedState = null;
    }

    /**
     * Enable action interception
     */
    enable() {
        this.isIntercepting = true;
    }

    /**
     * Disable action interception
     */
    disable() {
        this.isIntercepting = false;
    }

    /**
     * Check if interception is active
     * @returns {boolean}
     */
    isActive() {
        return this.isIntercepting && this.tutorialEngine?.isActive;
    }

    /**
     * Set simulated game state for tutorial
     * @param {Object} state - Simulated game state
     */
    setSimulatedState(state) {
        this.simulatedState = state;
    }

    /**
     * Get current game state (simulated or real)
     * @param {Object} realGameState - Real game state from the app
     * @returns {Object} State to use
     */
    getActiveState(realGameState) {
        if (this.isActive() && this.simulatedState) {
            return this.simulatedState;
        }
        return realGameState;
    }

    /**
     * Intercept card play action
     * @param {Array} cards - Cards being played
     * @param {Object} gameState - Current game state
     * @param {Function} originalAction - Original play action
     * @returns {Promise<Object>} Result of the action
     */
    async interceptPlayCard(cards, gameState, originalAction) {
        if (!this.isActive()) {
            // Not in tutorial mode, execute original action
            return await originalAction(cards);
        }

        // Validate the action against tutorial requirements
        const validationResult = await this.tutorialEngine.processPlayerAction('playCard', {
            cards: Array.isArray(cards) ? cards : [cards],
            gameState: this.getActiveState(gameState)
        });

        if (validationResult.success) {
            // Action is valid for tutorial
            this.onFeedback({
                type: 'success',
                message: validationResult.message || 'Correct! Well done!',
                details: validationResult
            });

            // In simulation mode, update simulated state
            if (this.simulatedState) {
                this.updateSimulatedStateAfterPlay(cards);
            }

            // Check if lesson objective was completed
            if (validationResult.objectiveCompleted) {
                this.onFeedback({
                    type: 'objective_complete',
                    message: `Objective completed: ${validationResult.objective?.description || 'Great job!'}`,
                    details: validationResult
                });
            }

            // Check if lesson was completed
            if (validationResult.lessonCompleted) {
                this.onFeedback({
                    type: 'lesson_complete',
                    message: 'Lesson completed!',
                    details: validationResult
                });
            }

            return { success: true, tutorialValidated: true, ...validationResult };
        } else {
            // Action is invalid - block and provide feedback
            this.onFeedback({
                type: 'error',
                message: validationResult.error || 'That\'s not quite right. Try again!',
                hints: validationResult.hints || [],
                details: validationResult
            });

            return {
                success: false,
                blocked: true,
                reason: validationResult.error,
                hints: validationResult.hints
            };
        }
    }

    /**
     * Intercept draw card action
     * @param {Object} gameState - Current game state
     * @param {Function} originalAction - Original draw action
     * @returns {Promise<Object>} Result of the action
     */
    async interceptDrawCard(gameState, originalAction) {
        if (!this.isActive()) {
            return await originalAction();
        }

        const validationResult = await this.tutorialEngine.processPlayerAction('drawCard', {
            gameState: this.getActiveState(gameState)
        });

        if (validationResult.success) {
            this.onFeedback({
                type: 'success',
                message: validationResult.message || 'Card drawn!',
                details: validationResult
            });

            if (this.simulatedState) {
                this.updateSimulatedStateAfterDraw();
            }

            if (validationResult.objectiveCompleted) {
                this.onFeedback({
                    type: 'objective_complete',
                    message: `Objective completed: ${validationResult.objective?.description || 'Great job!'}`,
                    details: validationResult
                });
            }

            return { success: true, tutorialValidated: true, ...validationResult };
        } else {
            this.onFeedback({
                type: 'error',
                message: validationResult.error || 'You don\'t need to draw right now.',
                hints: validationResult.hints || [],
                details: validationResult
            });

            return {
                success: false,
                blocked: true,
                reason: validationResult.error
            };
        }
    }

    /**
     * Intercept card selection action
     * @param {Object} card - Card being selected/deselected
     * @param {Array} currentSelection - Current selected cards
     * @param {Object} gameState - Current game state
     * @returns {Object} Selection result
     */
    interceptSelectCard(card, currentSelection, gameState) {
        if (!this.isActive()) {
            // Not in tutorial mode, allow selection
            return { allowed: true };
        }

        // For tutorials, we might want to guide selection
        const currentLesson = this.tutorialEngine.lessonManager?.currentLesson;

        if (currentLesson?.restrictions) {
            // Check if card selection is restricted
            const selectionRestriction = currentLesson.restrictions.find(
                r => r.type === 'cardSelection'
            );

            if (selectionRestriction) {
                const allowedCards = selectionRestriction.allowedCards || [];
                const isAllowed = allowedCards.some(
                    allowed => allowed.suit === card.suit && allowed.rank === card.rank
                );

                if (!isAllowed && allowedCards.length > 0) {
                    this.onFeedback({
                        type: 'hint',
                        message: selectionRestriction.message || 'Try selecting a different card.',
                        details: { restriction: selectionRestriction }
                    });
                    return { allowed: false, reason: selectionRestriction.message };
                }
            }
        }

        // Notify tutorial engine of selection
        this.tutorialEngine.processPlayerAction('selectCard', {
            card,
            currentSelection,
            gameState: this.getActiveState(gameState)
        });

        return { allowed: true };
    }

    /**
     * Intercept suit declaration action
     * @param {string} suit - Declared suit
     * @param {Object} gameState - Current game state
     * @param {Function} originalAction - Original action
     * @returns {Promise<Object>} Result
     */
    async interceptDeclareSuit(suit, gameState, originalAction) {
        if (!this.isActive()) {
            return await originalAction(suit);
        }

        const validationResult = await this.tutorialEngine.processPlayerAction('declareSuit', {
            suit,
            gameState: this.getActiveState(gameState)
        });

        if (validationResult.success) {
            this.onFeedback({
                type: 'success',
                message: validationResult.message || `Declared ${suit}!`,
                details: validationResult
            });

            if (this.simulatedState) {
                this.simulatedState.declaredSuit = suit;
            }

            if (validationResult.objectiveCompleted) {
                this.onFeedback({
                    type: 'objective_complete',
                    message: `Objective completed!`,
                    details: validationResult
                });
            }

            return { success: true, tutorialValidated: true, ...validationResult };
        } else {
            this.onFeedback({
                type: 'error',
                message: validationResult.error || `Try declaring a different suit.`,
                hints: validationResult.hints || [],
                details: validationResult
            });

            return {
                success: false,
                blocked: true,
                reason: validationResult.error
            };
        }
    }

    /**
     * Update simulated state after playing cards
     * @param {Array} cards - Cards that were played
     */
    updateSimulatedStateAfterPlay(cards) {
        if (!this.simulatedState) return;

        const cardsArray = Array.isArray(cards) ? cards : [cards];

        // Remove played cards from hand
        this.simulatedState.playerHand = this.simulatedState.playerHand.filter(
            handCard => !cardsArray.some(
                playedCard => playedCard.id === handCard.id
            )
        );

        // Add to discard pile (last card on top)
        const topCard = cardsArray[cardsArray.length - 1];
        this.simulatedState.discardPile = [
            topCard,
            ...(this.simulatedState.discardPile || [])
        ];
        this.simulatedState.topCard = topCard;
    }

    /**
     * Update simulated state after drawing a card
     */
    updateSimulatedStateAfterDraw() {
        if (!this.simulatedState) return;

        // Simulate drawing a card
        if (this.simulatedState.drawPile && this.simulatedState.drawPile.length > 0) {
            const drawnCard = this.simulatedState.drawPile.shift();
            this.simulatedState.playerHand.push(drawnCard);
            this.simulatedState.drawPileSize = this.simulatedState.drawPile.length;
        }
    }

    /**
     * Initialize simulated state from lesson data
     * @param {Object} lesson - Lesson data with initial state
     * @returns {Object} Initialized simulated state
     */
    initializeSimulatedState(lesson) {
        if (!lesson) return null;

        this.simulatedState = {
            // Player's hand from lesson
            playerHand: lesson.initialHand ? [...lesson.initialHand] : [],

            // Discard pile from lesson
            discardPile: lesson.initialDiscardPile ? [...lesson.initialDiscardPile] : [],
            topCard: lesson.initialDiscardPile?.[0] || null,

            // Draw pile (generate dummy cards if not specified)
            drawPile: this.generateDrawPile(lesson.drawPileSize || 30),
            drawPileSize: lesson.drawPileSize || 30,

            // Game state modifiers from lesson
            declaredSuit: lesson.declaredSuit || null,
            drawStack: lesson.drawStack || 0,
            direction: lesson.direction || 1,

            // Tutorial-specific state
            tutorial: {
                isActive: true,
                currentLesson: lesson,
                ...(lesson.gameStateModifiers?.tutorial || {})
            },

            // Simulated opponent
            opponents: [{
                id: 'tutorial_opponent',
                name: 'Tutorial Bot',
                handSize: lesson.opponentHandSize || 5
            }],

            // It's always player's turn in tutorial
            currentPlayer: 'player',
            isPlayerTurn: true,

            // Game is always in playing state during lesson
            gameState: 'playing'
        };

        return this.simulatedState;
    }

    /**
     * Generate a draw pile with dummy cards
     * @param {number} size - Number of cards
     * @returns {Array} Draw pile cards
     */
    generateDrawPile(size) {
        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
        const pile = [];

        for (let i = 0; i < size; i++) {
            pile.push({
                suit: suits[Math.floor(Math.random() * suits.length)],
                rank: ranks[Math.floor(Math.random() * ranks.length)],
                id: `draw_pile_${i}`
            });
        }

        return pile;
    }

    /**
     * Reset the interceptor state
     */
    reset() {
        this.simulatedState = null;
        this.isIntercepting = false;
    }
}

export default TutorialActionInterceptor;
