/**
 * TutorialEngine.js - Main tutorial management class
 * Manages lesson progression, coordinates between systems, and handles tutorial state
 */

import LessonManager from './LessonManager.js';
import ProgressTracker from './ProgressTracker.js';
import ValidationSystem from './ValidationSystem.js';
import HintSystem from './HintSystem.js';
import { FaGamepad, FaLightbulb, FaCheck, FaSync, FaBook, FaTrophy, FaGraduationCap, FaStop, FaSearch } from 'react-icons/fa';

/**
 * Main tutorial engine that orchestrates all tutorial systems
 */
class TutorialEngine {
    /**
     * Initialize the tutorial engine
     * @param {Object} gameState - Current game state from the main application
     * @param {Function} onStateChange - Callback for tutorial state changes
     * @param {Function} onComplete - Callback for tutorial completion
     */
    constructor(gameState, onStateChange, onComplete) {
        this.gameState = gameState;
        this.onStateChange = onStateChange;
        this.onComplete = onComplete;
        
        // Initialize subsystems
        this.progressTracker = new ProgressTracker();
        this.lessonManager = new LessonManager(this.progressTracker);
        this.validationSystem = new ValidationSystem(gameState);
        this.hintSystem = new HintSystem();
        
        // Tutorial state
        this.isActive = false;
        this.currentModule = null;
        this.currentLesson = null;
        this.tutorialState = 'inactive'; // 'inactive', 'active', 'paused', 'completed'
        this.simulatedGameState = null;
        
        // Event listeners
        this.eventListeners = new Map();
        
        this.initialize();
    }

    /**
     * Initialize the tutorial engine
     * @private
     */
    initialize() {
        // Load user progress
        this.progressTracker.loadProgress();
        
        // Set up event handlers
        this.setupEventHandlers();
        
        console.log('Tutorial Engine initialized');
    }

    /**
     * Set up event handlers for tutorial interactions
     * @private
     */
    setupEventHandlers() {
        // Listen for lesson state changes
        this.lessonManager.onStateChange = (lessonState) => {
            this.handleLessonStateChange(lessonState);
        };
        
        // Listen for validation events
        this.validationSystem.onValidation = (validationResult) => {
            this.handleValidationResult(validationResult);
        };
        
        // Listen for hint requests
        this.hintSystem.onHintRequested = (hintData) => {
            this.handleHintRequest(hintData);
        };
    }

    /**
     * Start the tutorial from a specific module and lesson
     * @param {string} moduleId - Module identifier
     * @param {string} lessonId - Lesson identifier (optional, starts from first lesson)
     * @returns {Promise<Object>} Tutorial start result
     */
    async startTutorial(moduleId, lessonId = null) {
        try {
            console.log(`Starting tutorial: Module ${moduleId}, Lesson ${lessonId || 'first'}`);
            
            this.isActive = true;
            this.tutorialState = 'active';
            this.currentModule = moduleId;
            
            // Load the lesson
            const lessonResult = await this.lessonManager.loadLesson(moduleId, lessonId);
            if (!lessonResult.success) {
                throw new Error(lessonResult.error);
            }
            
            this.currentLesson = lessonResult.lesson;
            
            // Create simulated game state for this lesson
            this.simulatedGameState = this.createSimulatedGameState(this.currentLesson);
            
            // Initialize validation system with lesson requirements
            this.validationSystem.setLessonRequirements(this.currentLesson.requirements);
            
            // Set up hints for this lesson
            this.hintSystem.setLessonHints(this.currentLesson.hints);
            
            // Mark lesson as started
            this.progressTracker.markLessonStarted(moduleId, this.currentLesson.id);
            
            // Notify state change
            this.notifyStateChange();
            
            return {
                success: true,
                lesson: this.currentLesson,
                gameState: this.simulatedGameState
            };
            
        } catch (error) {
            console.error('Failed to start tutorial:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Pause the current tutorial
     * @returns {Object} Pause result
     */
    pauseTutorial() {
        if (!this.isActive) {
            return { success: false, error: 'No active tutorial to pause' };
        }
        
        this.tutorialState = 'paused';
        console.log('Tutorial paused');
        
        this.notifyStateChange();
        
        return { success: true };
    }

    /**
     * Resume a paused tutorial
     * @returns {Object} Resume result
     */
    resumeTutorial() {
        if (this.tutorialState !== 'paused') {
            return { success: false, error: 'No paused tutorial to resume' };
        }
        
        this.tutorialState = 'active';
        console.log('Tutorial resumed');
        
        this.notifyStateChange();
        
        return { success: true };
    }

    /**
     * Stop the current tutorial
     * @returns {Object} Stop result
     */
    stopTutorial() {
        console.log('Tutorial stopped');
        
        this.isActive = false;
        this.tutorialState = 'inactive';
        this.currentModule = null;
        this.currentLesson = null;
        this.simulatedGameState = null;
        
        // Reset subsystems
        this.validationSystem.reset();
        this.hintSystem.reset();
        
        this.notifyStateChange();
        
        return { success: true };
    }

    /**
     * Process a player action within the tutorial
     * @param {string} actionType - Type of action (e.g., 'playCard', 'drawCard')
     * @param {Object} actionData - Action data and parameters
     * @returns {Promise<Object>} Action processing result
     */
    async processPlayerAction(actionType, actionData) {
        if (!this.isActive || this.tutorialState !== 'active') {
            return { success: false, error: 'Tutorial not active' };
        }
        
        console.log(`Processing tutorial action: ${actionType}`, actionData);
        
        try {
            // Validate the action against lesson requirements
            const validationResult = await this.validationSystem.validateAction(
                actionType, 
                actionData, 
                this.simulatedGameState
            );
            
            if (validationResult.isValid) {
                // Apply the action to simulated game state
                this.applyActionToSimulatedState(actionType, actionData);
                
                // Check if lesson objectives are completed
                const completionResult = this.checkLessonCompletion();
                
                if (completionResult.completed) {
                    await this.handleLessonCompletion();
                }
                
                // Update hint system based on current state
                this.hintSystem.updateContext(this.simulatedGameState, this.currentLesson);
                
                this.notifyStateChange();
                
                return {
                    success: true,
                    validationResult,
                    gameState: this.simulatedGameState,
                    lessonCompleted: completionResult.completed
                };
            } else {
                // Provide feedback for invalid action
                const hint = this.hintSystem.getActionFeedback(actionType, validationResult.errors);
                
                return {
                    success: false,
                    validationResult,
                    hint,
                    gameState: this.simulatedGameState
                };
            }
            
        } catch (error) {
            console.error('Error processing tutorial action:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Request a hint for the current lesson state
     * @param {string} contextType - Type of hint needed (optional)
     * @returns {Object} Hint data
     */
    requestHint(contextType = null) {
        if (!this.isActive || !this.currentLesson) {
            return { success: false, error: 'No active lesson for hints' };
        }
        
        const hint = this.hintSystem.getContextualHint(
            this.currentLesson,
            this.simulatedGameState,
            contextType
        );
        
        console.log('Hint requested:', hint);
        
        return {
            success: true,
            hint
        };
    }

    /**
     * Get the current tutorial state
     * @returns {Object} Current tutorial state
     */
    getTutorialState() {
        return {
            isActive: this.isActive,
            tutorialState: this.tutorialState,
            currentModule: this.currentModule,
            currentLesson: this.currentLesson,
            simulatedGameState: this.simulatedGameState,
            progress: this.progressTracker.getProgress(),
            availableHints: this.hintSystem.getAvailableHints()
        };
    }

    /**
     * Create a simulated game state for the given lesson
     * @param {Object} lesson - Lesson configuration
     * @returns {Object} Simulated game state
     * @private
     */
    createSimulatedGameState(lesson) {
        const baseState = {
            gameId: 'tutorial_' + Date.now(),
            gameState: 'playing',
            currentPlayer: 'tutorial_player',
            currentPlayerId: 'tutorial_player_id',
            players: [
                {
                    id: 'tutorial_player_id',
                    name: 'You',
                    hand: lesson.initialHand || [],
                    isCurrentPlayer: true,
                    isSafe: false,
                    isEliminated: false
                },
                {
                    id: 'tutorial_opponent_id',
                    name: 'AI Opponent',
                    hand: lesson.opponentHand || [],
                    isCurrentPlayer: false,
                    isSafe: false,
                    isEliminated: false
                }
            ],
            discardPile: lesson.initialDiscardPile || [],
            drawPileSize: lesson.drawPileSize || 35,
            direction: 1,
            declaredSuit: lesson.declaredSuit || null,
            drawStack: lesson.drawStack || 0,
            tutorial: {
                moduleId: this.currentModule,
                lessonId: lesson.id,
                objectives: lesson.objectives,
                restrictions: lesson.restrictions || []
            }
        };
        
        // Apply lesson-specific modifications
        if (lesson.gameStateModifiers) {
            Object.assign(baseState, lesson.gameStateModifiers);
        }
        
        console.log('Created simulated game state for lesson:', lesson.id);
        
        return baseState;
    }

    /**
     * Apply a player action to the simulated game state
     * @param {string} actionType - Type of action
     * @param {Object} actionData - Action data
     * @private
     */
    applyActionToSimulatedState(actionType, actionData) {
        switch (actionType) {
            case 'playCard':
                this.applyPlayCardAction(actionData);
                break;
            case 'drawCard':
                this.applyDrawCardAction(actionData);
                break;
            case 'selectCard':
                this.applySelectCardAction(actionData);
                break;
            case 'declareSuit':
                this.applyDeclareSuitAction(actionData);
                break;
            default:
                console.warn('Unknown action type in tutorial:', actionType);
        }
        
        console.log('Applied action to simulated state:', actionType);
    }

    /**
     * Apply a play card action to simulated state
     * @param {Object} actionData - Play card action data
     * @private
     */
    applyPlayCardAction(actionData) {
        const { cards, declaredSuit } = actionData;
        const player = this.simulatedGameState.players[0]; // Tutorial player
        
        // Remove cards from player hand
        cards.forEach(card => {
            const cardIndex = player.hand.findIndex(h => 
                h.suit === card.suit && h.rank === card.rank
            );
            if (cardIndex !== -1) {
                player.hand.splice(cardIndex, 1);
            }
        });
        
        // Add cards to discard pile
        this.simulatedGameState.discardPile.push(...cards);
        
        // Handle declared suit for wild cards
        if (declaredSuit) {
            this.simulatedGameState.declaredSuit = declaredSuit;
        }
        
        // Handle special card effects (simplified for tutorial)
        const lastCard = cards[cards.length - 1];
        if (lastCard.rank === 'Ace') {
            this.simulatedGameState.drawStack += 4;
        } else if (lastCard.rank === '2') {
            this.simulatedGameState.drawStack += 2;
        }
    }

    /**
     * Apply a draw card action to simulated state
     * @param {Object} actionData - Draw card action data
     * @private
     */
    applyDrawCardAction(actionData) {
        const { count = 1 } = actionData;
        const player = this.simulatedGameState.players[0];
        
        // Generate cards for tutorial (simplified)
        for (let i = 0; i < count; i++) {
            const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
            const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
            
            const newCard = {
                suit: suits[Math.floor(Math.random() * suits.length)],
                rank: ranks[Math.floor(Math.random() * ranks.length)],
                id: 'tutorial_card_' + Date.now() + '_' + i
            };
            
            player.hand.push(newCard);
        }
        
        this.simulatedGameState.drawPileSize -= count;
        
        // Clear draw stack if drawing penalty cards
        if (this.simulatedGameState.drawStack > 0) {
            this.simulatedGameState.drawStack = 0;
        }
    }

    /**
     * Apply a select card action to simulated state
     * @param {Object} actionData - Select card action data
     * @private
     */
    applySelectCardAction(actionData) {
        // Store selected cards in tutorial state
        if (!this.simulatedGameState.tutorial.selectedCards) {
            this.simulatedGameState.tutorial.selectedCards = [];
        }
        
        const { card, selected } = actionData;
        
        if (selected) {
            this.simulatedGameState.tutorial.selectedCards.push(card);
        } else {
            const index = this.simulatedGameState.tutorial.selectedCards.findIndex(c =>
                c.suit === card.suit && c.rank === card.rank
            );
            if (index !== -1) {
                this.simulatedGameState.tutorial.selectedCards.splice(index, 1);
            }
        }
    }

    /**
     * Apply a declare suit action to simulated state
     * @param {Object} actionData - Declare suit action data
     * @private
     */
    applyDeclareSuitAction(actionData) {
        const { suit } = actionData;
        this.simulatedGameState.declaredSuit = suit;
    }

    /**
     * Check if the current lesson objectives are completed
     * @returns {Object} Completion status
     * @private
     */
    checkLessonCompletion() {
        if (!this.currentLesson || !this.currentLesson.objectives) {
            return { completed: false };
        }
        
        const objectives = this.currentLesson.objectives;
        const completedObjectives = [];
        
        for (const objective of objectives) {
            const isCompleted = this.evaluateObjective(objective);
            if (isCompleted) {
                completedObjectives.push(objective.id);
            }
        }
        
        const allCompleted = completedObjectives.length === objectives.length;
        
        return {
            completed: allCompleted,
            completedObjectives,
            totalObjectives: objectives.length
        };
    }

    /**
     * Evaluate a specific objective
     * @param {Object} objective - Objective to evaluate
     * @returns {boolean} Whether objective is completed
     * @private
     */
    evaluateObjective(objective) {
        switch (objective.type) {
            case 'playCard':
                return this.evaluatePlayCardObjective(objective);
            case 'drawCard':
                return this.evaluateDrawCardObjective(objective);
            case 'selectCards':
                return this.evaluateSelectCardsObjective(objective);
            case 'gameState':
                return this.evaluateGameStateObjective(objective);
            default:
                console.warn('Unknown objective type:', objective.type);
                return false;
        }
    }

    /**
     * Handle lesson completion
     * @private
     */
    async handleLessonCompletion() {
        console.log('Lesson completed:', this.currentLesson.id);
        
        // Mark lesson as completed
        this.progressTracker.markLessonCompleted(this.currentModule, this.currentLesson.id);
        
        // Check if module is completed
        const moduleCompleted = this.progressTracker.isModuleCompleted(this.currentModule);
        
        if (moduleCompleted) {
            console.log('Module completed:', this.currentModule);
        }
        
        // Check if entire tutorial is completed
        const tutorialCompleted = this.progressTracker.isTutorialCompleted();
        
        if (tutorialCompleted) {
            console.log('Tutorial completed!');
            this.tutorialState = 'completed';
            
            if (this.onComplete) {
                this.onComplete({
                    type: 'tutorial',
                    moduleId: this.currentModule,
                    lessonId: this.currentLesson.id
                });
            }
        } else if (moduleCompleted) {
            if (this.onComplete) {
                this.onComplete({
                    type: 'module',
                    moduleId: this.currentModule,
                    lessonId: this.currentLesson.id
                });
            }
        } else {
            if (this.onComplete) {
                this.onComplete({
                    type: 'lesson',
                    moduleId: this.currentModule,
                    lessonId: this.currentLesson.id
                });
            }
        }
    }

    /**
     * Handle lesson state changes
     * @param {Object} lessonState - New lesson state
     * @private
     */
    handleLessonStateChange(lessonState) {
        console.log('Lesson state changed:', lessonState);
        this.notifyStateChange();
    }

    /**
     * Handle validation results
     * @param {Object} validationResult - Validation result
     * @private
     */
    handleValidationResult(validationResult) {
        console.log('Validation result:', validationResult);
        
        if (!validationResult.isValid) {
            // Provide contextual hints for failed validation
            const hint = this.hintSystem.getValidationHint(validationResult);
            console.log('Validation hint:', hint);
        }
    }

    /**
     * Handle hint requests
     * @param {Object} hintData - Hint request data
     * @private
     */
    handleHintRequest(hintData) {
        console.log('Hint requested:', hintData);
    }

    /**
     * Notify state change to parent component
     * @private
     */
    notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.getTutorialState());
        }
    }

    /**
     * Evaluate play card objective
     * @param {Object} objective - Play card objective
     * @returns {boolean} Whether objective is met
     * @private
     */
    evaluatePlayCardObjective(objective) {
        const discardPile = this.simulatedGameState.discardPile;
        
        if (objective.requiredCard) {
            const lastCard = discardPile[discardPile.length - 1];
            return lastCard && 
                   lastCard.suit === objective.requiredCard.suit &&
                   lastCard.rank === objective.requiredCard.rank;
        }
        
        if (objective.cardCount) {
            return discardPile.length >= objective.cardCount;
        }
        
        return false;
    }

    /**
     * Evaluate draw card objective
     * @param {Object} objective - Draw card objective
     * @returns {boolean} Whether objective is met
     * @private
     */
    evaluateDrawCardObjective(objective) {
        const player = this.simulatedGameState.players[0];
        
        if (objective.handSize) {
            return player.hand.length >= objective.handSize;
        }
        
        return false;
    }

    /**
     * Evaluate select cards objective
     * @param {Object} objective - Select cards objective
     * @returns {boolean} Whether objective is met
     * @private
     */
    evaluateSelectCardsObjective(objective) {
        const selectedCards = this.simulatedGameState.tutorial.selectedCards || [];
        
        if (objective.count) {
            return selectedCards.length >= objective.count;
        }
        
        if (objective.specificCards) {
            return objective.specificCards.every(reqCard =>
                selectedCards.some(selCard =>
                    selCard.suit === reqCard.suit && selCard.rank === reqCard.rank
                )
            );
        }
        
        return false;
    }

    /**
     * Evaluate game state objective
     * @param {Object} objective - Game state objective
     * @returns {boolean} Whether objective is met
     * @private
     */
    evaluateGameStateObjective(objective) {
        const state = this.simulatedGameState;
        
        if (objective.property) {
            const value = this.getNestedProperty(state, objective.property);
            return this.compareValues(value, objective.value, objective.operator || 'equals');
        }
        
        return false;
    }

    /**
     * Get nested property from object
     * @param {Object} obj - Object to traverse
     * @param {string} path - Property path (e.g., 'player.hand.length')
     * @returns {*} Property value
     * @private
     */
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, prop) => current && current[prop], obj);
    }

    /**
     * Compare values using different operators
     * @param {*} actual - Actual value
     * @param {*} expected - Expected value
     * @param {string} operator - Comparison operator
     * @returns {boolean} Comparison result
     * @private
     */
    compareValues(actual, expected, operator) {
        switch (operator) {
            case 'equals':
                return actual === expected;
            case 'greaterThan':
                return actual > expected;
            case 'lessThan':
                return actual < expected;
            case 'greaterOrEqual':
                return actual >= expected;
            case 'lessOrEqual':
                return actual <= expected;
            default:
                return actual === expected;
        }
    }

    /**
     * Clean up resources when tutorial engine is destroyed
     */
    destroy() {
        console.log('Destroying tutorial engine');
        
        this.stopTutorial();
        this.eventListeners.clear();
        
        // Save progress before destroying
        this.progressTracker.saveProgress();
    }
}

export default TutorialEngine;