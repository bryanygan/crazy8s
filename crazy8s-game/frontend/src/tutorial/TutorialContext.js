/**
 * TutorialContext.js - React Context for tutorial state management
 * Provides global access to tutorial functionality throughout the application
 * Includes action interception and game state simulation
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import useTutorial from './hooks/useTutorial';
import TutorialActionInterceptor from './TutorialActionInterceptor';

/**
 * Tutorial Context
 */
const TutorialContext = createContext(null);

/**
 * Custom hook to access tutorial context
 * @returns {Object} Tutorial context value
 * @throws {Error} If used outside of TutorialProvider
 */
export const useTutorialContext = () => {
    const context = useContext(TutorialContext);

    if (!context) {
        throw new Error('useTutorialContext must be used within a TutorialProvider');
    }

    return context;
};

/**
 * Tutorial Provider Component
 * Wraps the application to provide tutorial functionality
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} props.gameState - Current game state from the main application
 * @param {Object} props.gameElements - References to game elements for highlighting
 * @param {Function} props.onTutorialStart - Callback when tutorial starts
 * @param {Function} props.onTutorialEnd - Callback when tutorial ends
 * @param {Function} props.onLessonComplete - Callback when a lesson is completed
 */
export const TutorialProvider = ({
    children,
    gameState = null,
    gameElements = {},
    onTutorialStart = null,
    onTutorialEnd = null,
    onLessonComplete = null
}) => {
    // Use the tutorial hook for core functionality
    const tutorial = useTutorial(gameState);

    // Additional UI state for the tutorial overlay
    const [isTutorialVisible, setIsTutorialVisible] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);

    // Simulated game state for tutorial lessons
    const [simulatedGameState, setSimulatedGameState] = useState(null);

    // Feedback state for toast notifications
    const [feedback, setFeedback] = useState(null);
    const [feedbackQueue, setFeedbackQueue] = useState([]);

    // Action interceptor ref
    const interceptorRef = useRef(null);

    /**
     * Handle feedback from the interceptor
     */
    const handleFeedback = useCallback((feedbackData) => {
        setFeedback(feedbackData);

        // Auto-clear success feedback after delay
        if (feedbackData.type === 'success' || feedbackData.type === 'hint') {
            setTimeout(() => {
                setFeedback(prev => prev === feedbackData ? null : prev);
            }, 3000);
        }

        // Add to queue for multiple feedbacks
        setFeedbackQueue(prev => [...prev, { ...feedbackData, id: Date.now() }]);
    }, []);

    /**
     * Clear current feedback
     */
    const clearFeedback = useCallback(() => {
        setFeedback(null);
    }, []);

    /**
     * Initialize the action interceptor
     */
    useEffect(() => {
        if (!interceptorRef.current) {
            interceptorRef.current = new TutorialActionInterceptor(
                tutorial.getEngine(),
                handleFeedback
            );
        }

        // Update engine reference when it changes
        if (tutorial.getEngine()) {
            interceptorRef.current.tutorialEngine = tutorial.getEngine();
        }
    }, [tutorial, handleFeedback]);

    /**
     * Show the tutorial overlay and optionally start a specific module
     * @param {string} moduleId - Optional module to start
     * @param {string} lessonId - Optional specific lesson to start
     */
    const showTutorial = useCallback(async (moduleId = null, lessonId = null) => {
        setIsTutorialVisible(true);

        if (moduleId) {
            setSelectedModule(moduleId);
            const result = await tutorial.startTutorial(moduleId, lessonId);

            if (result.success) {
                // Initialize simulated state from lesson
                const lesson = result.lesson;
                if (lesson && interceptorRef.current) {
                    const simState = interceptorRef.current.initializeSimulatedState(lesson);
                    setSimulatedGameState(simState);
                    interceptorRef.current.enable();
                }

                if (onTutorialStart) {
                    onTutorialStart({
                        moduleId,
                        lessonId: lesson?.id
                    });
                }
            }

            return result;
        }

        return { success: true };
    }, [tutorial, onTutorialStart]);

    /**
     * Hide the tutorial overlay and stop the tutorial
     */
    const hideTutorial = useCallback(() => {
        setIsTutorialVisible(false);
        setSelectedModule(null);
        setSimulatedGameState(null);
        setFeedback(null);

        if (interceptorRef.current) {
            interceptorRef.current.disable();
            interceptorRef.current.reset();
        }

        if (tutorial.isActive) {
            tutorial.stopTutorial();

            if (onTutorialEnd) {
                onTutorialEnd({
                    completed: tutorial.tutorialState.tutorialState === 'completed'
                });
            }
        }
    }, [tutorial, onTutorialEnd]);

    /**
     * Toggle tutorial visibility
     */
    const toggleTutorial = useCallback(() => {
        if (isTutorialVisible) {
            hideTutorial();
        } else {
            showTutorial();
        }
    }, [isTutorialVisible, showTutorial, hideTutorial]);

    /**
     * Handle tutorial action with event callbacks
     */
    const handleTutorialAction = useCallback(async (actionType, actionData) => {
        const result = await tutorial.processAction(actionType, actionData);

        if (result.success && result.lessonCompleted && onLessonComplete) {
            onLessonComplete({
                moduleId: tutorial.currentModule,
                lessonId: tutorial.currentLesson?.id
            });
        }

        return result;
    }, [tutorial, onLessonComplete]);

    /**
     * Wrapped play card action - validates through tutorial if active
     * @param {Array} cards - Cards to play
     * @param {Function} originalAction - Original play function
     * @returns {Promise<Object>} Result
     */
    const wrapPlayCard = useCallback(async (cards, originalAction) => {
        if (!interceptorRef.current?.isActive()) {
            // Not in tutorial, execute normally
            return await originalAction(cards);
        }

        const result = await interceptorRef.current.interceptPlayCard(
            cards,
            simulatedGameState || gameState,
            originalAction
        );

        // Update simulated state if changed
        if (result.success && interceptorRef.current.simulatedState) {
            setSimulatedGameState({ ...interceptorRef.current.simulatedState });
        }

        return result;
    }, [simulatedGameState, gameState]);

    /**
     * Wrapped draw card action - validates through tutorial if active
     * @param {Function} originalAction - Original draw function
     * @returns {Promise<Object>} Result
     */
    const wrapDrawCard = useCallback(async (originalAction) => {
        if (!interceptorRef.current?.isActive()) {
            return await originalAction();
        }

        const result = await interceptorRef.current.interceptDrawCard(
            simulatedGameState || gameState,
            originalAction
        );

        if (result.success && interceptorRef.current.simulatedState) {
            setSimulatedGameState({ ...interceptorRef.current.simulatedState });
        }

        return result;
    }, [simulatedGameState, gameState]);

    /**
     * Wrapped card selection - validates through tutorial if active
     * @param {Object} card - Card being selected
     * @param {Array} currentSelection - Current selection
     * @returns {Object} Selection result
     */
    const wrapSelectCard = useCallback((card, currentSelection) => {
        if (!interceptorRef.current?.isActive()) {
            return { allowed: true };
        }

        return interceptorRef.current.interceptSelectCard(
            card,
            currentSelection,
            simulatedGameState || gameState
        );
    }, [simulatedGameState, gameState]);

    /**
     * Wrapped suit declaration - validates through tutorial if active
     * @param {string} suit - Suit to declare
     * @param {Function} originalAction - Original action
     * @returns {Promise<Object>} Result
     */
    const wrapDeclareSuit = useCallback(async (suit, originalAction) => {
        if (!interceptorRef.current?.isActive()) {
            return await originalAction(suit);
        }

        const result = await interceptorRef.current.interceptDeclareSuit(
            suit,
            simulatedGameState || gameState,
            originalAction
        );

        if (result.success && interceptorRef.current.simulatedState) {
            setSimulatedGameState({ ...interceptorRef.current.simulatedState });
        }

        return result;
    }, [simulatedGameState, gameState]);

    /**
     * Get the active game state (simulated during tutorial, real otherwise)
     * @returns {Object} Active game state
     */
    const getActiveGameState = useCallback(() => {
        if (interceptorRef.current?.isActive() && simulatedGameState) {
            return simulatedGameState;
        }
        return gameState;
    }, [simulatedGameState, gameState]);

    /**
     * Check if currently using simulated state
     * @returns {boolean}
     */
    const isUsingSimulatedState = useCallback(() => {
        return interceptorRef.current?.isActive() && simulatedGameState !== null;
    }, [simulatedGameState]);

    /**
     * Quick start the tutorial from the beginning
     */
    const quickStart = useCallback(async () => {
        return await showTutorial('basics');
    }, [showTutorial]);

    /**
     * Check if user is a first-time visitor (for auto-showing tutorial)
     */
    const isFirstTimeUser = useCallback(() => {
        try {
            const hasSeenTutorial = localStorage.getItem('crazy8s_tutorial_seen');
            return !hasSeenTutorial;
        } catch {
            return false;
        }
    }, []);

    /**
     * Mark that user has seen the tutorial
     */
    const markTutorialSeen = useCallback(() => {
        try {
            localStorage.setItem('crazy8s_tutorial_seen', 'true');
        } catch (e) {
            console.warn('Could not save tutorial seen status:', e);
        }
    }, []);

    /**
     * Advance to next lesson (updates simulated state)
     */
    const advanceToNextLesson = useCallback(async () => {
        const result = await tutorial.nextLesson();

        if (result.success && result.lesson && interceptorRef.current) {
            const simState = interceptorRef.current.initializeSimulatedState(result.lesson);
            setSimulatedGameState(simState);
        }

        return result;
    }, [tutorial]);

    /**
     * Reset current lesson (reinitialize simulated state)
     */
    const resetCurrentLesson = useCallback(() => {
        const result = tutorial.resetLesson();

        if (result.success && tutorial.currentLesson && interceptorRef.current) {
            const simState = interceptorRef.current.initializeSimulatedState(tutorial.currentLesson);
            setSimulatedGameState(simState);
        }

        return result;
    }, [tutorial]);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        // From useTutorial hook
        ...tutorial,

        // UI state
        isTutorialVisible,
        selectedModule,
        gameElements,

        // Simulated state
        simulatedGameState,
        getActiveGameState,
        isUsingSimulatedState,

        // Feedback
        feedback,
        feedbackQueue,
        clearFeedback,

        // UI actions
        showTutorial,
        hideTutorial,
        toggleTutorial,
        quickStart,

        // Wrapped game actions (use these instead of direct actions during tutorial)
        wrapPlayCard,
        wrapDrawCard,
        wrapSelectCard,
        wrapDeclareSuit,

        // Enhanced navigation
        advanceToNextLesson,
        resetCurrentLesson,

        // Event-wrapped action handler
        handleTutorialAction,

        // First-time user helpers
        isFirstTimeUser,
        markTutorialSeen
    }), [
        tutorial,
        isTutorialVisible,
        selectedModule,
        gameElements,
        simulatedGameState,
        getActiveGameState,
        isUsingSimulatedState,
        feedback,
        feedbackQueue,
        clearFeedback,
        showTutorial,
        hideTutorial,
        toggleTutorial,
        quickStart,
        wrapPlayCard,
        wrapDrawCard,
        wrapSelectCard,
        wrapDeclareSuit,
        advanceToNextLesson,
        resetCurrentLesson,
        handleTutorialAction,
        isFirstTimeUser,
        markTutorialSeen
    ]);

    return (
        <TutorialContext.Provider value={contextValue}>
            {children}
        </TutorialContext.Provider>
    );
};

/**
 * Higher-order component to inject tutorial context
 * @param {React.Component} WrappedComponent - Component to wrap
 * @returns {React.Component} Wrapped component with tutorial props
 */
export const withTutorial = (WrappedComponent) => {
    const WithTutorialComponent = (props) => {
        const tutorial = useTutorialContext();
        return <WrappedComponent {...props} tutorial={tutorial} />;
    };

    WithTutorialComponent.displayName = `WithTutorial(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return WithTutorialComponent;
};

export default TutorialContext;
