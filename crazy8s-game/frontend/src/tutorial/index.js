/**
 * tutorial/index.js - Main export file for the tutorial system
 * Provides easy access to all tutorial components
 */

// Core imports for re-export
import TutorialEngineClass from './TutorialEngine.js';
import LessonManagerClass from './LessonManager.js';
import ProgressTrackerClass from './ProgressTracker.js';
import ValidationSystemClass from './ValidationSystem.js';
import HintSystemClass from './HintSystem.js';

// React integration imports
import useTutorialHook from './hooks/useTutorial.js';
import {
    TutorialProvider as TutorialProviderComponent,
    useTutorialContext as useTutorialContextHook,
    withTutorial as withTutorialHOC
} from './TutorialContext.js';
import TutorialActionInterceptorClass from './TutorialActionInterceptor.js';

// UI Component imports
import TutorialOverlayComponent from './components/TutorialOverlay.js';

// Lesson definition imports
import {
    tutorialLessons as tutorialLessonsData,
    getAvailableModules as getAvailableModulesFunc,
    getModuleLessons as getModuleLessonsFunc,
    getLesson as getLessonFunc,
    validateLessonStructure as validateLessonStructureFunc,
    getTotalLessonCount as getTotalLessonCountFunc,
    getModuleLessonCount as getModuleLessonCountFunc,
    getNextLessonInfo as getNextLessonInfoFunc
} from './lessons/index.js';

// Named exports - Main tutorial engine
export const TutorialEngine = TutorialEngineClass;

// Named exports - React integration
export const useTutorial = useTutorialHook;
export const TutorialProvider = TutorialProviderComponent;
export const useTutorialContext = useTutorialContextHook;
export const withTutorial = withTutorialHOC;
export const TutorialActionInterceptor = TutorialActionInterceptorClass;

// Named exports - UI Components
export const TutorialOverlay = TutorialOverlayComponent;

// Named exports - Core components
export const LessonManager = LessonManagerClass;
export const ProgressTracker = ProgressTrackerClass;
export const ValidationSystem = ValidationSystemClass;
export const HintSystem = HintSystemClass;

// Named exports - Lesson definitions
export const tutorialLessons = tutorialLessonsData;
export const getAvailableModules = getAvailableModulesFunc;
export const getModuleLessons = getModuleLessonsFunc;
export const getLesson = getLessonFunc;
export const validateLessonStructure = validateLessonStructureFunc;
export const getTotalLessonCount = getTotalLessonCountFunc;
export const getModuleLessonCount = getModuleLessonCountFunc;
export const getNextLessonInfo = getNextLessonInfoFunc;

/**
 * Tutorial System Version
 */
export const TUTORIAL_VERSION = '1.0.0';

/**
 * Create a new tutorial engine instance
 * @param {Object} gameState - Current game state from main application
 * @param {Function} onStateChange - Callback for tutorial state changes
 * @param {Function} onComplete - Callback for tutorial completion
 * @returns {TutorialEngine} Configured tutorial engine instance
 */
export const createTutorialEngine = (gameState, onStateChange, onComplete) => {
    return new TutorialEngineClass(gameState, onStateChange, onComplete);
};

/**
 * Tutorial system configuration defaults
 */
export const TUTORIAL_CONFIG = {
    // Progress persistence
    storage: {
        key: 'crazy8s_tutorial_progress',
        autoSave: true,
        saveInterval: 30000 // 30 seconds
    },

    // Hint system settings
    hints: {
        enabled: true,
        progressive: true,
        maxHistorySize: 50
    },

    // Validation settings
    validation: {
        strictMode: false,
        allowRetry: true,
        showDetailedErrors: true
    },

    // Lesson progression
    progression: {
        requireCompletion: true,
        allowSkipping: false,
        trackStatistics: true
    }
};

/**
 * Tutorial event types for state management
 */
export const TUTORIAL_EVENTS = {
    // Engine events
    TUTORIAL_STARTED: 'tutorial:started',
    TUTORIAL_PAUSED: 'tutorial:paused',
    TUTORIAL_RESUMED: 'tutorial:resumed',
    TUTORIAL_STOPPED: 'tutorial:stopped',
    TUTORIAL_COMPLETED: 'tutorial:completed',

    // Lesson events
    LESSON_LOADED: 'lesson:loaded',
    LESSON_STARTED: 'lesson:started',
    LESSON_COMPLETED: 'lesson:completed',
    LESSON_FAILED: 'lesson:failed',
    LESSON_RESET: 'lesson:reset',

    // Progress events
    PROGRESS_UPDATED: 'progress:updated',
    ACHIEVEMENT_EARNED: 'progress:achievement',
    MODULE_COMPLETED: 'progress:module_completed',

    // Validation events
    ACTION_VALIDATED: 'validation:action',
    VALIDATION_FAILED: 'validation:failed',

    // Hint events
    HINT_REQUESTED: 'hint:requested',
    HINT_SHOWN: 'hint:shown'
};

/**
 * Tutorial action types
 */
export const TUTORIAL_ACTIONS = {
    PLAY_CARD: 'playCard',
    DRAW_CARD: 'drawCard',
    SELECT_CARD: 'selectCard',
    DECLARE_SUIT: 'declareSuit',
    PASS_TURN: 'passTurn'
};

/**
 * Tutorial objective types
 */
export const OBJECTIVE_TYPES = {
    PLAY_CARD: 'playCard',
    DRAW_CARD: 'drawCard',
    SELECT_CARDS: 'selectCards',
    GAME_STATE: 'gameState',
    CUSTOM: 'custom'
};

/**
 * Hint context types
 */
export const HINT_CONTEXTS = {
    CARD_SELECTION: 'card_selection',
    CARD_PLAYING: 'card_playing',
    STACKING: 'stacking',
    SPECIAL_CARDS: 'special_cards',
    DRAWING: 'drawing',
    VALIDATION_ERRORS: 'validation_errors',
    LESSON_OBJECTIVES: 'lesson_objectives'
};

/**
 * Validation rule types
 */
export const VALIDATION_RULES = {
    PLAYER_TURN: 'playerTurn',
    CARD_OWNERSHIP: 'cardOwnership',
    CARD_PLAYABILITY: 'cardPlayability',
    STACKING_RULES: 'stackingRules',
    LESSON_REQUIREMENTS: 'lessonRequirements'
};

/**
 * Progress tracking constants
 */
export const PROGRESS_CONSTANTS = {
    STORAGE_VERSION: '1.0.0',
    MAX_HINT_HISTORY: 100,
    AUTO_SAVE_INTERVAL: 30000,
    ACHIEVEMENT_CATEGORIES: {
        COMPLETION: 'completion',
        PERFORMANCE: 'performance',
        MASTERY: 'mastery'
    }
};

/**
 * Default lesson structure template
 */
export const LESSON_TEMPLATE = {
    title: '',
    description: '',
    difficulty: 'beginner', // 'beginner', 'intermediate', 'advanced'
    estimatedTime: '5 minutes',
    objectives: [],
    requirements: [],
    hints: [],
    initialHand: [],
    initialDiscardPile: [],
    opponentHand: [],
    gameStateModifiers: {},
    restrictions: []
};

/**
 * Utility functions for tutorial integration
 */
export const TutorialUtils = {
    /**
     * Check if tutorial is available
     * @returns {boolean} Whether tutorial can be used
     */
    isAvailable() {
        return typeof window !== 'undefined' &&
               typeof localStorage !== 'undefined';
    },

    /**
     * Get tutorial compatibility info
     * @returns {Object} Compatibility information
     */
    getCompatibilityInfo() {
        return {
            localStorage: typeof localStorage !== 'undefined',
            promises: typeof Promise !== 'undefined',
            es6: typeof Map !== 'undefined' && typeof Set !== 'undefined',
            version: TUTORIAL_VERSION
        };
    },

    /**
     * Format time duration
     * @param {number} milliseconds - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    },

    /**
     * Generate card display string
     * @param {Object} card - Card object
     * @returns {string} Formatted card string
     */
    formatCard(card) {
        if (!card || !card.rank || !card.suit) {
            return 'Unknown Card';
        }

        const suitSymbols = {
            'Hearts': '\u2665',
            'Diamonds': '\u2666',
            'Clubs': '\u2663',
            'Spades': '\u2660'
        };

        const symbol = suitSymbols[card.suit] || card.suit;
        return `${card.rank}${symbol}`;
    },

    /**
     * Validate card structure
     * @param {Object} card - Card to validate
     * @returns {boolean} Whether card is valid
     */
    isValidCard(card) {
        return card &&
               typeof card.suit === 'string' &&
               typeof card.rank === 'string' &&
               typeof card.id === 'string';
    },

    /**
     * Deep clone object (for game state simulation)
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }

        if (obj instanceof Array) {
            return obj.map(item => TutorialUtils.deepClone(item));
        }

        if (typeof obj === 'object') {
            const cloned = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    cloned[key] = TutorialUtils.deepClone(obj[key]);
                }
            }
            return cloned;
        }

        return obj;
    }
};

/**
 * Tutorial system information
 */
export const TUTORIAL_INFO = {
    name: 'Crazy 8\'s Tutorial System',
    version: TUTORIAL_VERSION,
    description: 'Comprehensive tutorial engine for learning Crazy 8\'s card game',
    features: [
        'Progressive lesson system',
        'Real-time action validation',
        'Contextual hint system',
        'Progress tracking with achievements',
        'Modular lesson architecture',
        'Game state simulation',
        'localStorage persistence'
    ],
    compatibility: {
        browser: 'Modern browsers with ES6 support',
        storage: 'localStorage required for progress persistence',
        framework: 'React hooks compatible'
    }
};

// Export everything as default for convenience
export default {
    // React integration
    useTutorial: useTutorialHook,
    TutorialProvider: TutorialProviderComponent,
    useTutorialContext: useTutorialContextHook,
    withTutorial: withTutorialHOC,
    TutorialOverlay: TutorialOverlayComponent,
    TutorialActionInterceptor: TutorialActionInterceptorClass,

    // Core classes
    TutorialEngine: TutorialEngineClass,
    LessonManager: LessonManagerClass,
    ProgressTracker: ProgressTrackerClass,
    ValidationSystem: ValidationSystemClass,
    HintSystem: HintSystemClass,

    // Lessons
    tutorialLessons: tutorialLessonsData,
    getAvailableModules: getAvailableModulesFunc,
    getModuleLessons: getModuleLessonsFunc,
    getLesson: getLessonFunc,
    validateLessonStructure: validateLessonStructureFunc,
    getTotalLessonCount: getTotalLessonCountFunc,
    getModuleLessonCount: getModuleLessonCountFunc,
    getNextLessonInfo: getNextLessonInfoFunc,

    // Factory
    createTutorialEngine,

    // Constants
    TUTORIAL_CONFIG,
    TUTORIAL_EVENTS,
    TUTORIAL_ACTIONS,
    OBJECTIVE_TYPES,
    HINT_CONTEXTS,
    VALIDATION_RULES,
    PROGRESS_CONSTANTS,
    LESSON_TEMPLATE,

    // Utilities
    TutorialUtils,
    TUTORIAL_INFO,
    TUTORIAL_VERSION
};
