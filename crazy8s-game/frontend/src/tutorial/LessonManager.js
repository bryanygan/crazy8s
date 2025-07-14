/**
 * LessonManager.js - Handles individual lesson state and management
 * Manages lesson loading, state transitions, and lesson configuration
 */

import { tutorialLessons } from './lessons/index.js';
import { FaBook, FaCheck, FaSync, FaTrash } from 'react-icons/fa';

/**
 * Manages individual lesson state and progression
 */
class LessonManager {
    /**
     * Initialize the lesson manager
     * @param {Object} progressTracker - Progress tracking instance
     */
    constructor(progressTracker) {
        this.progressTracker = progressTracker;
        this.currentLesson = null;
        this.lessonState = 'inactive'; // 'inactive', 'loading', 'active', 'completed', 'failed'
        this.lessonData = new Map();
        this.onStateChange = null; // Callback for state changes
        
        this.initialize();
    }

    /**
     * Initialize the lesson manager
     * @private
     */
    initialize() {
        this.loadLessonDefinitions();
        console.log('Lesson Manager initialized');
    }

    /**
     * Load lesson definitions from the lessons directory
     * @private
     */
    loadLessonDefinitions() {
        try {
            // Store lesson definitions in memory
            for (const [moduleId, module] of Object.entries(tutorialLessons)) {
                if (!this.lessonData.has(moduleId)) {
                    this.lessonData.set(moduleId, new Map());
                }
                
                const moduleData = this.lessonData.get(moduleId);
                
                for (const [lessonId, lesson] of Object.entries(module.lessons)) {
                    moduleData.set(lessonId, {
                        ...lesson,
                        moduleId,
                        id: lessonId,
                        moduleMeta: module.meta
                    });
                }
            }
            
            console.log('Loaded lesson definitions:', this.lessonData.size, 'modules');
            
        } catch (error) {
            console.error('Failed to load lesson definitions:', error);
        }
    }

    /**
     * Load a specific lesson
     * @param {string} moduleId - Module identifier
     * @param {string} lessonId - Lesson identifier (optional, loads first lesson if not provided)
     * @returns {Promise<Object>} Load result with lesson data
     */
    async loadLesson(moduleId, lessonId = null) {
        try {
            this.lessonState = 'loading';
            this.notifyStateChange();
            
            console.log(`Loading lesson: ${moduleId}/${lessonId || 'first'}`);
            
            // Get module data
            const moduleData = this.lessonData.get(moduleId);
            if (!moduleData) {
                throw new Error(`Module not found: ${moduleId}`);
            }
            
            // Get lesson ID (first lesson if not specified)
            if (!lessonId) {
                const moduleKeys = Array.from(moduleData.keys());
                lessonId = moduleKeys[0];
                
                if (!lessonId) {
                    throw new Error(`No lessons found in module: ${moduleId}`);
                }
            }
            
            // Get lesson data
            const lessonData = moduleData.get(lessonId);
            if (!lessonData) {
                throw new Error(`Lesson not found: ${moduleId}/${lessonId}`);
            }
            
            // Validate lesson structure
            const validationResult = this.validateLessonStructure(lessonData);
            if (!validationResult.isValid) {
                throw new Error(`Invalid lesson structure: ${validationResult.errors.join(', ')}`);
            }
            
            // Set current lesson
            this.currentLesson = this.prepareLesson(lessonData);
            this.lessonState = 'active';
            
            console.log('Lesson loaded successfully:', this.currentLesson.title);
            
            this.notifyStateChange();
            
            return {
                success: true,
                lesson: this.currentLesson
            };
            
        } catch (error) {
            console.error('Failed to load lesson:', error);
            this.lessonState = 'failed';
            this.notifyStateChange();
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get the next lesson in the current module
     * @returns {Promise<Object>} Next lesson load result
     */
    async getNextLesson() {
        if (!this.currentLesson) {
            return { success: false, error: 'No current lesson' };
        }
        
        const moduleData = this.lessonData.get(this.currentLesson.moduleId);
        const lessonKeys = Array.from(moduleData.keys());
        const currentIndex = lessonKeys.indexOf(this.currentLesson.id);
        
        if (currentIndex === -1 || currentIndex >= lessonKeys.length - 1) {
            return { success: false, error: 'No next lesson available' };
        }
        
        const nextLessonId = lessonKeys[currentIndex + 1];
        return await this.loadLesson(this.currentLesson.moduleId, nextLessonId);
    }

    /**
     * Get the previous lesson in the current module
     * @returns {Promise<Object>} Previous lesson load result
     */
    async getPreviousLesson() {
        if (!this.currentLesson) {
            return { success: false, error: 'No current lesson' };
        }
        
        const moduleData = this.lessonData.get(this.currentLesson.moduleId);
        const lessonKeys = Array.from(moduleData.keys());
        const currentIndex = lessonKeys.indexOf(this.currentLesson.id);
        
        if (currentIndex <= 0) {
            return { success: false, error: 'No previous lesson available' };
        }
        
        const previousLessonId = lessonKeys[currentIndex - 1];
        return await this.loadLesson(this.currentLesson.moduleId, previousLessonId);
    }

    /**
     * Get available modules
     * @returns {Array<Object>} Array of module information
     */
    getAvailableModules() {
        const modules = [];
        
        for (const [moduleId, moduleData] of this.lessonData.entries()) {
            const lessons = Array.from(moduleData.values());
            const firstLesson = lessons[0];
            
            if (firstLesson && firstLesson.moduleMeta) {
                modules.push({
                    id: moduleId,
                    title: firstLesson.moduleMeta.title,
                    description: firstLesson.moduleMeta.description,
                    difficulty: firstLesson.moduleMeta.difficulty,
                    estimatedTime: firstLesson.moduleMeta.estimatedTime,
                    lessonCount: lessons.length,
                    isUnlocked: this.isModuleUnlocked(moduleId),
                    progress: this.progressTracker.getModuleProgress(moduleId)
                });
            }
        }
        
        return modules.sort((a, b) => a.id.localeCompare(b.id));
    }

    /**
     * Get lessons for a specific module
     * @param {string} moduleId - Module identifier
     * @returns {Array<Object>} Array of lesson information
     */
    getLessonsForModule(moduleId) {
        const moduleData = this.lessonData.get(moduleId);
        if (!moduleData) {
            return [];
        }
        
        const lessons = [];
        
        for (const [lessonId, lessonData] of moduleData.entries()) {
            lessons.push({
                id: lessonId,
                title: lessonData.title,
                description: lessonData.description,
                difficulty: lessonData.difficulty,
                estimatedTime: lessonData.estimatedTime,
                objectives: lessonData.objectives,
                isUnlocked: this.isLessonUnlocked(moduleId, lessonId),
                isCompleted: this.progressTracker.isLessonCompleted(moduleId, lessonId),
                progress: this.progressTracker.getLessonProgress(moduleId, lessonId)
            });
        }
        
        return lessons;
    }

    /**
     * Check if a module is unlocked
     * @param {string} moduleId - Module identifier
     * @returns {boolean} Whether module is unlocked
     */
    isModuleUnlocked(moduleId) {
        // First module is always unlocked
        const modules = Array.from(this.lessonData.keys()).sort();
        if (moduleId === modules[0]) {
            return true;
        }
        
        // Check if previous module is completed
        const currentIndex = modules.indexOf(moduleId);
        if (currentIndex > 0) {
            const previousModule = modules[currentIndex - 1];
            return this.progressTracker.isModuleCompleted(previousModule);
        }
        
        return false;
    }

    /**
     * Check if a lesson is unlocked
     * @param {string} moduleId - Module identifier
     * @param {string} lessonId - Lesson identifier
     * @returns {boolean} Whether lesson is unlocked
     */
    isLessonUnlocked(moduleId, lessonId) {
        // Check if module is unlocked
        if (!this.isModuleUnlocked(moduleId)) {
            return false;
        }
        
        // First lesson in module is always unlocked if module is unlocked
        const moduleData = this.lessonData.get(moduleId);
        const lessonKeys = Array.from(moduleData.keys());
        
        if (lessonId === lessonKeys[0]) {
            return true;
        }
        
        // Check if previous lesson is completed
        const currentIndex = lessonKeys.indexOf(lessonId);
        if (currentIndex > 0) {
            const previousLesson = lessonKeys[currentIndex - 1];
            return this.progressTracker.isLessonCompleted(moduleId, previousLesson);
        }
        
        return false;
    }

    /**
     * Validate lesson structure
     * @param {Object} lessonData - Lesson data to validate
     * @returns {Object} Validation result
     * @private
     */
    validateLessonStructure(lessonData) {
        const errors = [];
        const requiredFields = ['title', 'description', 'objectives'];
        
        // Check required fields
        for (const field of requiredFields) {
            if (!lessonData[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }
        
        // Validate objectives
        if (lessonData.objectives && Array.isArray(lessonData.objectives)) {
            lessonData.objectives.forEach((objective, index) => {
                if (!objective.id) {
                    errors.push(`Objective ${index} missing id`);
                }
                if (!objective.type) {
                    errors.push(`Objective ${index} missing type`);
                }
                if (!objective.description) {
                    errors.push(`Objective ${index} missing description`);
                }
            });
        } else {
            errors.push('Invalid or missing objectives array');
        }
        
        // Validate requirements if present
        if (lessonData.requirements && !Array.isArray(lessonData.requirements)) {
            errors.push('Requirements must be an array');
        }
        
        // Validate hints if present
        if (lessonData.hints && !Array.isArray(lessonData.hints)) {
            errors.push('Hints must be an array');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Prepare lesson data for use
     * @param {Object} lessonData - Raw lesson data
     * @returns {Object} Prepared lesson data
     * @private
     */
    prepareLesson(lessonData) {
        const preparedLesson = {
            ...lessonData,
            startTime: Date.now(),
            attempts: 0,
            hintsUsed: 0,
            state: {
                currentObjective: 0,
                completedObjectives: [],
                errors: [],
                warnings: []
            }
        };
        
        // Ensure all required arrays exist
        if (!preparedLesson.requirements) {
            preparedLesson.requirements = [];
        }
        
        if (!preparedLesson.hints) {
            preparedLesson.hints = [];
        }
        
        if (!preparedLesson.restrictions) {
            preparedLesson.restrictions = [];
        }
        
        // Set default initial game state elements
        if (!preparedLesson.initialHand) {
            preparedLesson.initialHand = this.generateDefaultHand();
        }
        
        if (!preparedLesson.initialDiscardPile) {
            preparedLesson.initialDiscardPile = [this.generateRandomCard()];
        }
        
        if (!preparedLesson.opponentHand) {
            preparedLesson.opponentHand = this.generateDefaultOpponentHand();
        }
        
        return preparedLesson;
    }

    /**
     * Generate a default hand for the tutorial player
     * @returns {Array<Object>} Default hand cards
     * @private
     */
    generateDefaultHand() {
        return [
            { suit: 'Hearts', rank: '7', id: 'tutorial_card_1' },
            { suit: 'Diamonds', rank: 'Jack', id: 'tutorial_card_2' },
            { suit: 'Clubs', rank: '9', id: 'tutorial_card_3' },
            { suit: 'Spades', rank: 'Queen', id: 'tutorial_card_4' },
            { suit: 'Hearts', rank: 'Ace', id: 'tutorial_card_5' },
            { suit: 'Diamonds', rank: '3', id: 'tutorial_card_6' },
            { suit: 'Clubs', rank: '8', id: 'tutorial_card_7' },
            { suit: 'Spades', rank: '5', id: 'tutorial_card_8' }
        ];
    }

    /**
     * Generate a default opponent hand
     * @returns {Array<Object>} Default opponent hand cards
     * @private
     */
    generateDefaultOpponentHand() {
        // Generate 8 random cards for opponent (they won't be visible anyway)
        const hand = [];
        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
        
        for (let i = 0; i < 8; i++) {
            hand.push({
                suit: suits[Math.floor(Math.random() * suits.length)],
                rank: ranks[Math.floor(Math.random() * ranks.length)],
                id: `tutorial_opponent_card_${i + 1}`
            });
        }
        
        return hand;
    }

    /**
     * Generate a random card
     * @returns {Object} Random card
     * @private
     */
    generateRandomCard() {
        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
        
        return {
            suit: suits[Math.floor(Math.random() * suits.length)],
            rank: ranks[Math.floor(Math.random() * ranks.length)],
            id: 'tutorial_discard_' + Date.now()
        };
    }

    /**
     * Mark the current lesson as completed
     * @returns {Object} Completion result
     */
    markCurrentLessonCompleted() {
        if (!this.currentLesson) {
            return { success: false, error: 'No current lesson to complete' };
        }
        
        this.lessonState = 'completed';
        this.currentLesson.completedTime = Date.now();
        this.currentLesson.duration = this.currentLesson.completedTime - this.currentLesson.startTime;
        
        console.log('Lesson marked as completed:', this.currentLesson.title);
        
        this.notifyStateChange();
        
        return { success: true };
    }

    /**
     * Reset the current lesson
     * @returns {Object} Reset result
     */
    resetCurrentLesson() {
        if (!this.currentLesson) {
            return { success: false, error: 'No current lesson to reset' };
        }
        
        console.log('Resetting lesson:', this.currentLesson.title);
        
        // Reset lesson state
        this.currentLesson.attempts += 1;
        this.currentLesson.startTime = Date.now();
        this.currentLesson.state = {
            currentObjective: 0,
            completedObjectives: [],
            errors: [],
            warnings: []
        };
        
        this.lessonState = 'active';
        
        this.notifyStateChange();
        
        return { success: true };
    }

    /**
     * Get the current lesson state
     * @returns {Object} Current lesson state
     */
    getCurrentLessonState() {
        return {
            lesson: this.currentLesson,
            state: this.lessonState,
            isActive: this.lessonState === 'active',
            isCompleted: this.lessonState === 'completed',
            isFailed: this.lessonState === 'failed'
        };
    }

    /**
     * Update lesson progress
     * @param {Object} progressData - Progress update data
     */
    updateLessonProgress(progressData) {
        if (!this.currentLesson) {
            return;
        }
        
        if (progressData.objectiveCompleted) {
            const objectiveId = progressData.objectiveCompleted;
            if (!this.currentLesson.state.completedObjectives.includes(objectiveId)) {
                this.currentLesson.state.completedObjectives.push(objectiveId);
            }
        }
        
        if (progressData.error) {
            this.currentLesson.state.errors.push({
                timestamp: Date.now(),
                error: progressData.error
            });
        }
        
        if (progressData.warning) {
            this.currentLesson.state.warnings.push({
                timestamp: Date.now(),
                warning: progressData.warning
            });
        }
        
        if (progressData.hintUsed) {
            this.currentLesson.hintsUsed += 1;
        }
        
        this.notifyStateChange();
    }

    /**
     * Get lesson statistics
     * @param {string} moduleId - Module identifier
     * @param {string} lessonId - Lesson identifier
     * @returns {Object} Lesson statistics
     */
    getLessonStatistics(moduleId, lessonId) {
        const progress = this.progressTracker.getLessonProgress(moduleId, lessonId);
        const moduleData = this.lessonData.get(moduleId);
        const lessonData = moduleData ? moduleData.get(lessonId) : null;
        
        if (!lessonData) {
            return null;
        }
        
        return {
            lessonId,
            moduleId,
            title: lessonData.title,
            difficulty: lessonData.difficulty,
            estimatedTime: lessonData.estimatedTime,
            isCompleted: progress ? progress.completed : false,
            completionTime: progress ? progress.completionTime : null,
            attempts: progress ? progress.attempts : 0,
            hintsUsed: progress ? progress.hintsUsed : 0,
            objectiveCount: lessonData.objectives ? lessonData.objectives.length : 0
        };
    }

    /**
     * Notify state change callback
     * @private
     */
    notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange(this.getCurrentLessonState());
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        console.log('Destroying lesson manager');
        this.currentLesson = null;
        this.lessonState = 'inactive';
        this.lessonData.clear();
        this.onStateChange = null;
    }
}

export default LessonManager;