/**
 * HintSystem.js - Provides contextual hints and feedback for tutorial
 * Delivers progressive hints based on player progress and context
 */

import { FaLightbulb, FaCheck, FaSync, FaBook, FaBullseye, FaTrash, FaSearch, FaExclamationTriangle, FaExclamationCircle, FaDice, FaBookOpen, FaMagic } from 'react-icons/fa';

/**
 * Provides contextual hints and guidance for tutorial lessons
 */
class HintSystem {
    /**
     * Initialize the hint system
     */
    constructor() {
        this.currentLessonHints = [];
        this.contextualHints = new Map();
        this.hintHistory = [];
        this.onHintRequested = null; // Callback for hint events
        
        this.initialize();
    }

    /**
     * Initialize the hint system
     * @private
     */
    initialize() {
        this.setupContextualHints();
        console.log('Hint System initialized');
    }

    /**
     * Set up contextual hints for different scenarios
     * @private
     */
    setupContextualHints() {
        // General game hints
        this.contextualHints.set('card_selection', [
            'Click on a card to select it for playing',
            'You can select multiple cards of the same rank to stack them',
            'Selected cards are highlighted in blue'
        ]);
        
        this.contextualHints.set('card_playing', [
            'Play cards that match the suit or rank of the top card',
            'Wild cards (8s) can be played on any card',
            'Check if you have any playable cards before drawing'
        ]);
        
        this.contextualHints.set('stacking', [
            'You can stack cards of the same rank together',
            'Same suit cards can be stacked if you maintain turn control',
            'Jacks and even numbers of Queens help maintain turn control'
        ]);
        
        this.contextualHints.set('special_cards', [
            'Jacks skip the next player',
            'Queens reverse the direction of play',
            'Aces make the next player draw 4 cards',
            '2s make the next player draw 2 cards',
            '8s are wild - you can declare any suit'
        ]);
        
        this.contextualHints.set('drawing', [
            'Draw a card when you cannot play',
            'You must draw penalty cards from Aces and 2s',
            'Counter Aces with other Aces or same-suit 2s',
            'Counter 2s with other 2s or same-suit Aces'
        ]);
        
        this.contextualHints.set('validation_errors', [
            'Make sure you own the cards you\'re trying to play',
            'Check that your cards can legally be played',
            'Verify stacking rules for multiple cards',
            'Ensure you\'re following lesson requirements'
        ]);
        
        this.contextualHints.set('lesson_objectives', [
            'Read the lesson objectives carefully',
            'Focus on completing one objective at a time',
            'Use hints if you\'re stuck on an objective',
            'Practice makes perfect - don\'t hesitate to retry'
        ]);
    }

    /**
     * Set lesson-specific hints
     * @param {Array<Object>} hints - Array of lesson hint objects
     */
    setLessonHints(hints) {
        this.currentLessonHints = hints || [];
        console.log('Set lesson hints:', this.currentLessonHints.length);
    }

    /**
     * Get a contextual hint based on current lesson and game state
     * @param {Object} lesson - Current lesson data
     * @param {Object} gameState - Current game state
     * @param {string} contextType - Specific context for hint (optional)
     * @returns {Object} Hint data
     */
    getContextualHint(lesson, gameState, contextType = null) {
        const hintData = {
            id: this.generateHintId(),
            timestamp: Date.now(),
            contextType: contextType || this.detectContext(lesson, gameState),
            hint: null,
            source: 'contextual',
            lesson: lesson ? lesson.id : null
        };
        
        try {
            // Get lesson-specific hint first
            if (lesson && this.currentLessonHints.length > 0) {
                const lessonHint = this.getLessonSpecificHint(lesson, gameState);
                if (lessonHint) {
                    hintData.hint = lessonHint;
                    hintData.source = 'lesson';
                }
            }
            
            // Fall back to contextual hint
            if (!hintData.hint) {
                const contextualHint = this.getContextualHintByType(hintData.contextType, gameState);
                if (contextualHint) {
                    hintData.hint = contextualHint;
                }
            }
            
            // Fall back to general hint
            if (!hintData.hint) {
                hintData.hint = this.getGeneralHint(gameState);
                hintData.source = 'general';
            }
            
            // Record hint in history
            this.hintHistory.push(hintData);
            
            // Notify hint requested
            if (this.onHintRequested) {
                this.onHintRequested(hintData);
            }
            
            console.log('Generated hint:', hintData);
            
            return hintData;
            
        } catch (error) {
            console.error('Error generating hint:', error);
            
            return {
                ...hintData,
                hint: {
                    title: 'Need Help?',
                    content: 'Try reading the lesson objectives again, or check the game rules.',
                    type: 'general',
                    priority: 'low'
                },
                error: error.message
            };
        }
    }

    /**
     * Get feedback for invalid actions
     * @param {string} actionType - Type of action that failed
     * @param {Array<string>} errors - Validation errors
     * @returns {Object} Action feedback hint
     */
    getActionFeedback(actionType, errors) {
        const feedbackData = {
            id: this.generateHintId(),
            timestamp: Date.now(),
            actionType,
            errors,
            source: 'validation_feedback'
        };
        
        const feedback = this.generateActionFeedback(actionType, errors);
        feedbackData.hint = feedback;
        
        // Record in history
        this.hintHistory.push(feedbackData);
        
        console.log('Generated action feedback:', feedbackData);
        
        return feedbackData;
    }

    /**
     * Get validation-specific hint
     * @param {Object} validationResult - Validation result with errors
     * @returns {Object} Validation hint
     */
    getValidationHint(validationResult) {
        const hintData = {
            id: this.generateHintId(),
            timestamp: Date.now(),
            validationResult,
            source: 'validation'
        };
        
        const hint = this.generateValidationHint(validationResult);
        hintData.hint = hint;
        
        // Record in history
        this.hintHistory.push(hintData);
        
        console.log('Generated validation hint:', hintData);
        
        return hintData;
    }

    /**
     * Update context based on current game state
     * @param {Object} gameState - Current game state
     * @param {Object} lesson - Current lesson
     */
    updateContext(gameState, lesson) {
        // This method can be used to preemptively update hint context
        // based on game state changes, preparing for future hint requests
        
        const context = this.detectContext(lesson, gameState);
        console.log('Updated hint context:', context);
    }

    /**
     * Get available hints for current context
     * @returns {Array<Object>} Available hint types
     */
    getAvailableHints() {
        return [
            { type: 'card_selection', title: 'Card Selection Help', icon: 'FaSearch' },
            { type: 'card_playing', title: 'How to Play Cards', icon: 'FaBullseye' },
            { type: 'stacking', title: 'Card Stacking Rules', icon: 'FaBook' },
            { type: 'special_cards', title: 'Special Card Effects', icon: 'FaMagic' },
            { type: 'drawing', title: 'Drawing Cards', icon: 'FaDice' },
            { type: 'lesson_objectives', title: 'Lesson Help', icon: 'FaBookOpen' }
        ];
    }

    /**
     * Detect context from lesson and game state
     * @param {Object} lesson - Current lesson
     * @param {Object} gameState - Current game state
     * @returns {string} Detected context type
     * @private
     */
    detectContext(lesson, gameState) {
        if (!lesson || !gameState) {
            return 'general';
        }
        
        // Check current lesson objectives
        if (lesson.objectives) {
            const currentObjective = lesson.objectives.find(obj => 
                !lesson.state?.completedObjectives?.includes(obj.id)
            );
            
            if (currentObjective) {
                switch (currentObjective.type) {
                    case 'playCard':
                        return 'card_playing';
                    case 'selectCards':
                        return 'card_selection';
                    case 'drawCard':
                        return 'drawing';
                    default:
                        return 'lesson_objectives';
                }
            }
        }
        
        // Check game state context
        const selectedCards = gameState.tutorial?.selectedCards || [];
        const drawStack = gameState.drawStack || 0;
        const playerHand = gameState.players?.[0]?.hand || [];
        
        if (selectedCards.length > 1) {
            return 'stacking';
        }
        
        if (drawStack > 0) {
            return 'drawing';
        }
        
        if (selectedCards.length === 1) {
            return 'card_playing';
        }
        
        if (playerHand.some(card => ['Jack', 'Queen', 'Ace', '2', '8'].includes(card.rank))) {
            return 'special_cards';
        }
        
        return 'card_selection';
    }

    /**
     * Get lesson-specific hint
     * @param {Object} lesson - Current lesson
     * @param {Object} gameState - Current game state
     * @returns {Object|null} Lesson hint
     * @private
     */
    getLessonSpecificHint(lesson, gameState) {
        if (!this.currentLessonHints.length) {
            return null;
        }
        
        // Find hint matching current context
        const context = this.detectContext(lesson, gameState);
        let matchingHint = this.currentLessonHints.find(hint => hint.context === context);
        
        // Fall back to progressive hints based on objectives
        if (!matchingHint && lesson.state) {
            const completedCount = lesson.state.completedObjectives?.length || 0;
            const progressiveHint = this.currentLessonHints.find(hint => 
                hint.trigger === 'objective' && hint.objectiveIndex === completedCount
            );
            
            if (progressiveHint) {
                matchingHint = progressiveHint;
            }
        }
        
        // Fall back to first hint if none match
        if (!matchingHint) {
            matchingHint = this.currentLessonHints[0];
        }
        
        return matchingHint ? this.formatHint(matchingHint) : null;
    }

    /**
     * Get contextual hint by type
     * @param {string} contextType - Context type
     * @param {Object} gameState - Current game state
     * @returns {Object|null} Contextual hint
     * @private
     */
    getContextualHintByType(contextType, gameState) {
        const hints = this.contextualHints.get(contextType);
        if (!hints || hints.length === 0) {
            return null;
        }
        
        // Get a relevant hint based on game state
        let selectedHint = hints[0]; // Default to first hint
        
        // Customize hint selection based on context and game state
        if (contextType === 'card_playing' && gameState) {
            const topCard = this.getTopDiscardCard(gameState);
            if (topCard && topCard.rank === '8') {
                selectedHint = 'The last card played was a wild card (8). You can play any card now.';
            } else if (gameState.drawStack > 0) {
                selectedHint = `You need to draw ${gameState.drawStack} cards or play a counter card.`;
            }
        }
        
        if (contextType === 'stacking' && gameState) {
            const selectedCards = gameState.tutorial?.selectedCards || [];
            if (selectedCards.length > 0) {
                selectedHint = `You have ${selectedCards.length} cards selected. Make sure they follow stacking rules.`;
            }
        }
        
        return this.formatHint({
            title: this.getContextTitle(contextType),
            content: selectedHint,
            type: contextType,
            priority: 'medium'
        });
    }

    /**
     * Get general hint
     * @param {Object} gameState - Current game state
     * @returns {Object} General hint
     * @private
     */
    getGeneralHint(gameState) {
        const generalHints = [
            'Take your time to understand each lesson objective',
            'Use the card selection to practice different strategies',
            'Don\'t hesitate to ask for hints when you need help',
            'Each lesson builds on the previous ones',
            'Practice the basics before moving to advanced techniques'
        ];
        
        const randomHint = generalHints[Math.floor(Math.random() * generalHints.length)];
        
        return this.formatHint({
            title: 'General Tip',
            content: randomHint,
            type: 'general',
            priority: 'low'
        });
    }

    /**
     * Generate action feedback for failed validation
     * @param {string} actionType - Action type
     * @param {Array<string>} errors - Validation errors
     * @returns {Object} Action feedback
     * @private
     */
    generateActionFeedback(actionType, errors) {
        const feedbackMap = {
            playCard: {
                title: 'Card Play Issue',
                suggestions: [
                    'Check if you own the selected cards',
                    'Verify the cards can be played on the current top card',
                    'Make sure stacking rules are followed for multiple cards'
                ]
            },
            drawCard: {
                title: 'Drawing Issue',
                suggestions: [
                    'You might have playable cards in your hand',
                    'Check if you need to draw penalty cards first',
                    'Make sure it\'s your turn to draw'
                ]
            },
            selectCard: {
                title: 'Selection Issue',
                suggestions: [
                    'Make sure you own the card you\'re trying to select',
                    'Check selection limits for the current lesson',
                    'Verify you\'re selecting valid cards for stacking'
                ]
            }
        };
        
        const feedback = feedbackMap[actionType] || {
            title: 'Action Issue',
            suggestions: ['Please check the lesson requirements and try again']
        };
        
        return {
            title: feedback.title,
            content: this.formatErrorsWithSuggestions(errors, feedback.suggestions),
            type: 'error_feedback',
            priority: 'high',
            errors
        };
    }

    /**
     * Generate validation hint
     * @param {Object} validationResult - Validation result
     * @returns {Object} Validation hint
     * @private
     */
    generateValidationHint(validationResult) {
        const { errors, actionType } = validationResult;
        
        let specificHint = 'Please check your action and try again.';
        
        // Provide specific hints based on common validation errors
        if (errors.some(error => error.includes('don\'t have'))) {
            specificHint = 'Make sure you select cards from your own hand.';
        } else if (errors.some(error => error.includes('cannot be played'))) {
            specificHint = 'Choose a card that matches the suit or rank of the top card, or play a wild card (8).';
        } else if (errors.some(error => error.includes('stack'))) {
            specificHint = 'Review the stacking rules: same rank is always allowed, same suit requires turn control.';
        } else if (errors.some(error => error.includes('turn'))) {
            specificHint = 'Wait for your turn before making a move.';
        } else if (errors.some(error => error.includes('must'))) {
            specificHint = 'This lesson has specific requirements. Check the lesson objectives.';
        }
        
        return {
            title: 'Validation Help',
            content: specificHint,
            type: 'validation',
            priority: 'high',
            errors
        };
    }

    /**
     * Format hint object
     * @param {Object} hintData - Raw hint data
     * @returns {Object} Formatted hint
     * @private
     */
    formatHint(hintData) {
        return {
            title: hintData.title || 'Hint',
            content: hintData.content || '',
            type: hintData.type || 'general',
            priority: hintData.priority || 'medium',
            icon: this.getHintIcon(hintData.type),
            timestamp: Date.now()
        };
    }

    /**
     * Format errors with suggestions
     * @param {Array<string>} errors - Validation errors
     * @param {Array<string>} suggestions - Helpful suggestions
     * @returns {string} Formatted content
     * @private
     */
    formatErrorsWithSuggestions(errors, suggestions) {
        let content = '';
        
        if (errors.length > 0) {
            content += 'Issues found:\n';
            errors.forEach(error => {
                content += `• ${error}\n`;
            });
            content += '\n';
        }
        
        if (suggestions.length > 0) {
            content += 'Suggestions:\n';
            suggestions.forEach(suggestion => {
                content += `• ${suggestion}\n`;
            });
        }
        
        return content;
    }

    /**
     * Get context title
     * @param {string} contextType - Context type
     * @returns {string} Context title
     * @private
     */
    getContextTitle(contextType) {
        const titles = {
            card_selection: 'Card Selection',
            card_playing: 'Playing Cards',
            stacking: 'Card Stacking',
            special_cards: 'Special Cards',
            drawing: 'Drawing Cards',
            validation_errors: 'Fixing Errors',
            lesson_objectives: 'Lesson Help'
        };
        
        return titles[contextType] || 'Help';
    }

    /**
     * Get hint icon
     * @param {string} hintType - Hint type
     * @returns {string} Icon for hint type
     * @private
     */
    getHintIcon(hintType) {
        const icons = {
            card_selection: 'FaSearch',
            card_playing: 'FaBullseye',
            stacking: 'FaBook',
            special_cards: 'FaMagic',
            drawing: 'FaDice',
            validation: 'FaExclamationTriangle',
            error_feedback: 'FaExclamationCircle',
            lesson: 'FaBookOpen',
            general: 'FaLightbulb'
        };
        
        return icons[hintType] || 'FaLightbulb';
    }

    /**
     * Get top discard card
     * @param {Object} gameState - Game state
     * @returns {Object|null} Top discard card
     * @private
     */
    getTopDiscardCard(gameState) {
        const discardPile = gameState.discardPile || [];
        return discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;
    }

    /**
     * Generate unique hint ID
     * @returns {string} Unique hint ID
     * @private
     */
    generateHintId() {
        return `hint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get hint history
     * @param {number} limit - Maximum number of hints to return
     * @returns {Array<Object>} Recent hints
     */
    getHintHistory(limit = 10) {
        return this.hintHistory
            .slice(-limit)
            .sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Clear hint history
     */
    clearHintHistory() {
        console.log('Clearing hint history');
        this.hintHistory = [];
    }

    /**
     * Get hint statistics
     * @returns {Object} Hint usage statistics
     */
    getHintStatistics() {
        const typeStats = {};
        const sourceStats = {};
        
        this.hintHistory.forEach(hint => {
            const type = hint.hint?.type || 'unknown';
            const source = hint.source || 'unknown';
            
            typeStats[type] = (typeStats[type] || 0) + 1;
            sourceStats[source] = (sourceStats[source] || 0) + 1;
        });
        
        return {
            totalHints: this.hintHistory.length,
            typeDistribution: typeStats,
            sourceDistribution: sourceStats,
            lastHintTime: this.hintHistory.length > 0 ? 
                Math.max(...this.hintHistory.map(h => h.timestamp)) : null
        };
    }

    /**
     * Reset hint system
     */
    reset() {
        console.log('Resetting hint system');
        this.currentLessonHints = [];
        this.clearHintHistory();
    }

    /**
     * Clean up resources
     */
    destroy() {
        console.log('Destroying hint system');
        this.reset();
        this.contextualHints.clear();
        this.onHintRequested = null;
    }
}

export default HintSystem;