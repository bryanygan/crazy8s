/**
 * useTutorial.js - React hook for tutorial state management
 * Provides a bridge between the TutorialEngine and React components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import TutorialEngine from '../TutorialEngine';

/**
 * Custom hook for managing tutorial state in React components
 * @param {Object} gameState - Current game state from the main application
 * @returns {Object} Tutorial state and control functions
 */
const useTutorial = (gameState = null) => {
    // Tutorial state
    const [tutorialState, setTutorialState] = useState({
        isActive: false,
        tutorialState: 'inactive',
        currentModule: null,
        currentLesson: null,
        simulatedGameState: null,
        progress: null,
        availableHints: []
    });

    // Loading and error states
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Tutorial engine instance ref
    const engineRef = useRef(null);

    /**
     * Handle tutorial state changes from engine
     */
    const handleStateChange = useCallback((newState) => {
        setTutorialState(newState);
    }, []);

    /**
     * Handle tutorial completion events
     */
    const handleComplete = useCallback((completionData) => {
        console.log('Tutorial completion event:', completionData);

        // Dispatch custom event for external listeners
        window.dispatchEvent(new CustomEvent('tutorialComplete', {
            detail: completionData
        }));
    }, []);

    /**
     * Initialize or update the tutorial engine
     */
    useEffect(() => {
        // Create engine instance if it doesn't exist
        if (!engineRef.current) {
            engineRef.current = new TutorialEngine(
                gameState,
                handleStateChange,
                handleComplete
            );
        } else {
            // Update game state in existing engine
            engineRef.current.gameState = gameState;
        }

        return () => {
            // Cleanup on unmount
            if (engineRef.current) {
                engineRef.current.destroy();
                engineRef.current = null;
            }
        };
    }, [gameState, handleStateChange, handleComplete]);

    /**
     * Start the tutorial from a specific module
     * @param {string} moduleId - Module to start (default: 'basics')
     * @param {string} lessonId - Specific lesson to start (optional)
     * @returns {Promise<Object>} Start result
     */
    const startTutorial = useCallback(async (moduleId = 'basics', lessonId = null) => {
        if (!engineRef.current) {
            setError('Tutorial engine not initialized');
            return { success: false, error: 'Tutorial engine not initialized' };
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await engineRef.current.startTutorial(moduleId, lessonId);

            if (!result.success) {
                setError(result.error);
            }

            return result;
        } catch (err) {
            const errorMessage = err.message || 'Failed to start tutorial';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Stop the current tutorial
     * @returns {Object} Stop result
     */
    const stopTutorial = useCallback(() => {
        if (!engineRef.current) {
            return { success: false, error: 'Tutorial engine not initialized' };
        }

        return engineRef.current.stopTutorial();
    }, []);

    /**
     * Pause the current tutorial
     * @returns {Object} Pause result
     */
    const pauseTutorial = useCallback(() => {
        if (!engineRef.current) {
            return { success: false, error: 'Tutorial engine not initialized' };
        }

        return engineRef.current.pauseTutorial();
    }, []);

    /**
     * Resume a paused tutorial
     * @returns {Object} Resume result
     */
    const resumeTutorial = useCallback(() => {
        if (!engineRef.current) {
            return { success: false, error: 'Tutorial engine not initialized' };
        }

        return engineRef.current.resumeTutorial();
    }, []);

    /**
     * Process a player action within the tutorial
     * @param {string} actionType - Type of action
     * @param {Object} actionData - Action data
     * @returns {Promise<Object>} Action result
     */
    const processAction = useCallback(async (actionType, actionData) => {
        if (!engineRef.current) {
            return { success: false, error: 'Tutorial engine not initialized' };
        }

        return await engineRef.current.processPlayerAction(actionType, actionData);
    }, []);

    /**
     * Request a hint for the current lesson
     * @param {string} contextType - Type of hint context (optional)
     * @returns {Object} Hint data
     */
    const requestHint = useCallback((contextType = null) => {
        if (!engineRef.current) {
            return { success: false, error: 'Tutorial engine not initialized' };
        }

        return engineRef.current.requestHint(contextType);
    }, []);

    /**
     * Get available tutorial modules
     * @returns {Array} Available modules
     */
    const getAvailableModules = useCallback(() => {
        if (!engineRef.current) {
            return [];
        }

        return engineRef.current.lessonManager.getAvailableModules();
    }, []);

    /**
     * Get lessons for a specific module
     * @param {string} moduleId - Module identifier
     * @returns {Array} Lessons in the module
     */
    const getLessonsForModule = useCallback((moduleId) => {
        if (!engineRef.current) {
            return [];
        }

        return engineRef.current.lessonManager.getLessonsForModule(moduleId);
    }, []);

    /**
     * Navigate to the next lesson
     * @returns {Promise<Object>} Navigation result
     */
    const nextLesson = useCallback(async () => {
        if (!engineRef.current) {
            return { success: false, error: 'Tutorial engine not initialized' };
        }

        setIsLoading(true);
        try {
            const result = await engineRef.current.lessonManager.getNextLesson();
            if (result.success) {
                // Update tutorial state with new lesson
                setTutorialState(engineRef.current.getTutorialState());
            }
            return result;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Navigate to the previous lesson
     * @returns {Promise<Object>} Navigation result
     */
    const previousLesson = useCallback(async () => {
        if (!engineRef.current) {
            return { success: false, error: 'Tutorial engine not initialized' };
        }

        setIsLoading(true);
        try {
            const result = await engineRef.current.lessonManager.getPreviousLesson();
            if (result.success) {
                setTutorialState(engineRef.current.getTutorialState());
            }
            return result;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Reset the current lesson
     * @returns {Object} Reset result
     */
    const resetLesson = useCallback(() => {
        if (!engineRef.current) {
            return { success: false, error: 'Tutorial engine not initialized' };
        }

        const result = engineRef.current.lessonManager.resetCurrentLesson();
        if (result.success) {
            setTutorialState(engineRef.current.getTutorialState());
        }
        return result;
    }, []);

    /**
     * Get the tutorial engine instance (for advanced usage)
     * @returns {TutorialEngine|null} Engine instance
     */
    const getEngine = useCallback(() => {
        return engineRef.current;
    }, []);

    return {
        // State
        tutorialState,
        isActive: tutorialState.isActive,
        currentModule: tutorialState.currentModule,
        currentLesson: tutorialState.currentLesson,
        simulatedGameState: tutorialState.simulatedGameState,
        progress: tutorialState.progress,
        availableHints: tutorialState.availableHints,
        isLoading,
        error,

        // Actions
        startTutorial,
        stopTutorial,
        pauseTutorial,
        resumeTutorial,
        processAction,
        requestHint,

        // Navigation
        nextLesson,
        previousLesson,
        resetLesson,

        // Module/Lesson info
        getAvailableModules,
        getLessonsForModule,

        // Advanced
        getEngine
    };
};

export default useTutorial;
