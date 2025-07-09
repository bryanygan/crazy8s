/**
 * TutorialOverlay.js - Main tutorial wrapper that overlays the game
 * Provides dark overlay and manages tutorial UI components
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import HighlightSystem from './HighlightSystem';
import InstructionModal from './InstructionModal';
import ProgressSidebar from './ProgressSidebar';
import FeedbackToast from './FeedbackToast';
import TutorialControls from './TutorialControls';

/**
 * Main tutorial overlay component that manages the entire tutorial UI
 * @param {Object} props - Component props
 * @param {Object} props.tutorialEngine - Tutorial engine instance
 * @param {Object} props.tutorialState - Current tutorial state
 * @param {Function} props.onClose - Callback when tutorial is closed
 * @param {Function} props.onAction - Callback for tutorial actions
 * @param {Object} props.gameElements - References to game elements for highlighting
 * @param {boolean} props.isVisible - Whether tutorial overlay is visible
 * @param {Object} props.theme - Theme configuration for styling
 */
const TutorialOverlay = ({
    tutorialEngine,
    tutorialState,
    onClose,
    onAction,
    gameElements = {},
    isVisible = true,
    theme = {}
}) => {
    // State management
    const [highlightTargets, setHighlightTargets] = useState([]);
    const [showInstructions, setShowInstructions] = useState(true);
    const [showProgress, setShowProgress] = useState(true);
    const [feedbackMessages, setFeedbackMessages] = useState([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [overlayOpacity, setOverlayOpacity] = useState(0);
    
    // Refs
    const overlayRef = useRef(null);
    const animationRef = useRef(null);
    
    // Theme configuration
    const tutorialTheme = {
        overlay: {
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999
        },
        colors: {
            success: theme.success || '#27ae60',
            error: theme.error || '#e74c3c',
            info: theme.info || '#3498db',
            warning: '#f39c12',
            primary: '#2c3e50',
            secondary: '#34495e',
            background: '#ffffff',
            text: '#2c3e50'
        },
        animations: {
            fadeIn: 'tutorialFadeIn 0.3s ease-out',
            slideIn: 'tutorialSlideIn 0.4s ease-out',
            pulse: 'tutorialPulse 2s infinite',
            bounce: 'tutorialBounce 0.6s ease-out'
        },
        spacing: {
            small: '8px',
            medium: '16px',
            large: '24px',
            xlarge: '32px'
        },
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
    };

    /**
     * Handle tutorial state changes
     */
    useEffect(() => {
        if (!tutorialState || !tutorialState.isActive) {
            handleTutorialInactive();
            return;
        }

        handleTutorialActive();
        updateHighlightTargets();
        
    }, [tutorialState]);

    /**
     * Handle overlay visibility animations
     */
    useEffect(() => {
        if (isVisible) {
            setIsAnimating(true);
            
            // Fade in overlay
            requestAnimationFrame(() => {
                setOverlayOpacity(1);
            });
            
            // Complete animation
            const timer = setTimeout(() => {
                setIsAnimating(false);
            }, 300);
            
            return () => clearTimeout(timer);
        } else {
            setOverlayOpacity(0);
        }
    }, [isVisible]);

    /**
     * Handle tutorial becoming active
     */
    const handleTutorialActive = useCallback(() => {
        setShowInstructions(true);
        
        // Auto-hide instructions after 5 seconds for experienced users
        const autoHideTimer = setTimeout(() => {
            if (tutorialState.currentLesson?.difficulty !== 'beginner') {
                setShowInstructions(false);
            }
        }, 5000);
        
        return () => clearTimeout(autoHideTimer);
    }, [tutorialState]);

    /**
     * Handle tutorial becoming inactive
     */
    const handleTutorialInactive = useCallback(() => {
        setHighlightTargets([]);
        setFeedbackMessages([]);
        setShowInstructions(false);
    }, []);

    /**
     * Update highlight targets based on current lesson
     */
    const updateHighlightTargets = useCallback(() => {
        if (!tutorialState.currentLesson) {
            setHighlightTargets([]);
            return;
        }

        const targets = [];
        const lesson = tutorialState.currentLesson;
        const currentObjective = getCurrentObjective(lesson);

        if (currentObjective) {
            const target = getHighlightTargetForObjective(currentObjective);
            if (target) {
                targets.push(target);
            }
        }

        // Add general UI targets based on lesson context
        const uiTargets = getUITargetsForLesson(lesson);
        targets.push(...uiTargets);

        setHighlightTargets(targets);
    }, [tutorialState, gameElements]);

    /**
     * Get current objective for highlighting
     */
    const getCurrentObjective = (lesson) => {
        if (!lesson.objectives || !lesson.state) return null;
        
        const completedObjectives = lesson.state.completedObjectives || [];
        return lesson.objectives.find(obj => !completedObjectives.includes(obj.id));
    };

    /**
     * Get highlight target for specific objective
     */
    const getHighlightTargetForObjective = (objective) => {
        switch (objective.type) {
            case 'playCard':
                return {
                    id: 'play-card-target',
                    element: gameElements.playButton,
                    type: 'button',
                    pulse: true,
                    tooltip: 'Click here to play your selected cards'
                };
                
            case 'selectCards':
                return {
                    id: 'card-selection-target',
                    element: gameElements.playerHand,
                    type: 'area',
                    pulse: true,
                    tooltip: 'Select cards from your hand'
                };
                
            case 'drawCard':
                return {
                    id: 'draw-card-target',
                    element: gameElements.drawPile,
                    type: 'card',
                    pulse: true,
                    tooltip: 'Click the deck to draw a card'
                };
                
            case 'declareSuit':
                return {
                    id: 'suit-selector-target',
                    element: gameElements.suitSelector,
                    type: 'modal',
                    pulse: true,
                    tooltip: 'Choose a suit for your wild card'
                };
                
            default:
                return null;
        }
    };

    /**
     * Get UI targets for lesson context
     */
    const getUITargetsForLesson = (lesson) => {
        const targets = [];
        
        // Highlight specific cards based on lesson requirements
        if (lesson.requirements) {
            lesson.requirements.forEach(requirement => {
                if (requirement.type === 'mustPlayCard' && requirement.card) {
                    targets.push({
                        id: `required-card-${requirement.card.rank}-${requirement.card.suit}`,
                        selector: `[data-card-rank="${requirement.card.rank}"][data-card-suit="${requirement.card.suit}"]`,
                        type: 'card',
                        glow: true,
                        color: tutorialTheme.colors.success,
                        tooltip: `Play this card: ${requirement.card.rank} of ${requirement.card.suit}`
                    });
                }
            });
        }
        
        return targets;
    };

    /**
     * Handle tutorial action
     */
    const handleTutorialAction = async (actionType, actionData) => {
        try {
            setIsAnimating(true);
            
            const result = await onAction(actionType, actionData);
            
            if (result.success) {
                showFeedback('Action completed successfully!', 'success');
                
                if (result.lessonCompleted) {
                    showFeedback('Lesson completed! 🎉', 'success', 3000);
                }
            } else {
                showFeedback(result.error || 'Action failed', 'error');
                
                if (result.hint) {
                    setTimeout(() => {
                        showFeedback(result.hint.content, 'info', 5000);
                    }, 1500);
                }
            }
            
        } catch (error) {
            console.error('Tutorial action error:', error);
            showFeedback('An error occurred. Please try again.', 'error');
        } finally {
            setIsAnimating(false);
        }
    };

    /**
     * Show feedback message
     */
    const showFeedback = (message, type = 'info', duration = 3000) => {
        const feedback = {
            id: Date.now(),
            message,
            type,
            timestamp: Date.now()
        };
        
        setFeedbackMessages(prev => [...prev, feedback]);
        
        // Auto-remove feedback
        setTimeout(() => {
            setFeedbackMessages(prev => prev.filter(f => f.id !== feedback.id));
        }, duration);
    };

    /**
     * Handle instruction modal visibility
     */
    const toggleInstructions = () => {
        setShowInstructions(!showInstructions);
    };

    /**
     * Handle progress sidebar visibility
     */
    const toggleProgress = () => {
        setShowProgress(!showProgress);
    };

    /**
     * Handle tutorial controls
     */
    const handleControlAction = async (action) => {
        switch (action) {
            case 'next':
                await tutorialEngine.getNextLesson?.();
                break;
            case 'previous':
                await tutorialEngine.getPreviousLesson?.();
                break;
            case 'restart':
                await tutorialEngine.resetCurrentLesson?.();
                break;
            case 'skip':
                await tutorialEngine.skipLesson?.();
                break;
            case 'hint':
                const hint = tutorialEngine.requestHint();
                if (hint.success) {
                    showFeedback(hint.hint.content, 'info', 5000);
                }
                break;
            case 'close':
                onClose();
                break;
            default:
                console.warn('Unknown control action:', action);
        }
    };

    /**
     * Handle keyboard navigation
     */
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!isVisible || !tutorialState.isActive) return;
            
            switch (event.key) {
                case 'Escape':
                    event.preventDefault();
                    onClose();
                    break;
                case 'h':
                case 'H':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        handleControlAction('hint');
                    }
                    break;
                case 'n':
                case 'N':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        handleControlAction('next');
                    }
                    break;
                case 'p':
                case 'P':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        handleControlAction('previous');
                    }
                    break;
                case 'i':
                case 'I':
                    if (event.ctrlKey || event.metaKey) {
                        event.preventDefault();
                        toggleInstructions();
                    }
                    break;
                default:
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, tutorialState.isActive]);

    // Don't render if not visible or no tutorial state
    if (!isVisible || !tutorialState) {
        return null;
    }

    return (
        <>
            {/* CSS Animations */}
            <style jsx>{`
                @keyframes tutorialFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes tutorialSlideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                @keyframes tutorialPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                }
                
                @keyframes tutorialBounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
                
                .tutorial-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: ${tutorialTheme.overlay.background};
                    backdrop-filter: ${tutorialTheme.overlay.backdropFilter};
                    z-index: ${tutorialTheme.overlay.zIndex};
                    opacity: ${overlayOpacity};
                    transition: opacity 0.3s ease-out;
                    pointer-events: ${isVisible ? 'auto' : 'none'};
                }
                
                .tutorial-content {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }
                
                .tutorial-main {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                }
                
                .tutorial-loading {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-size: 18px;
                    text-align: center;
                }
                
                .tutorial-loading::after {
                    content: '';
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: spin 1s linear infinite;
                    margin-left: 10px;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                .tutorial-accessibility {
                    position: absolute;
                    top: -9999px;
                    left: -9999px;
                }
                
                @media (max-width: 768px) {
                    .tutorial-overlay {
                        backdrop-filter: blur(2px);
                    }
                }
                
                @media (max-width: 480px) {
                    .tutorial-content {
                        padding: ${tutorialTheme.spacing.small};
                    }
                }
            `}</style>

            {/* Main Overlay */}
            <div 
                ref={overlayRef}
                className="tutorial-overlay"
                role="dialog"
                aria-modal="true"
                aria-labelledby="tutorial-title"
                aria-describedby="tutorial-description"
            >
                {/* Accessibility Info */}
                <div className="tutorial-accessibility">
                    <h1 id="tutorial-title">
                        {tutorialState.currentLesson?.title || 'Tutorial'}
                    </h1>
                    <p id="tutorial-description">
                        {tutorialState.currentLesson?.description || 'Interactive tutorial for Crazy 8\'s card game'}
                    </p>
                    <p>
                        Press Escape to close, Ctrl+H for hint, Ctrl+N for next, Ctrl+P for previous, Ctrl+I to toggle instructions
                    </p>
                </div>

                {/* Tutorial Content */}
                <div className="tutorial-content">
                    {/* Loading State */}
                    {isAnimating && (
                        <div className="tutorial-loading">
                            Processing tutorial action...
                        </div>
                    )}

                    {/* Main Tutorial Area */}
                    <div className="tutorial-main">
                        {/* Highlight System */}
                        <HighlightSystem
                            targets={highlightTargets}
                            theme={tutorialTheme}
                            isActive={tutorialState.isActive && !isAnimating}
                        />

                        {/* Instruction Modal */}
                        {showInstructions && tutorialState.currentLesson && (
                            <InstructionModal
                                lesson={tutorialState.currentLesson}
                                onClose={() => setShowInstructions(false)}
                                onAction={handleTutorialAction}
                                theme={tutorialTheme}
                                gameState={tutorialState.simulatedGameState}
                            />
                        )}

                        {/* Progress Sidebar */}
                        {showProgress && (
                            <ProgressSidebar
                                tutorialState={tutorialState}
                                onToggle={toggleProgress}
                                onNavigate={handleControlAction}
                                theme={tutorialTheme}
                            />
                        )}
                    </div>

                    {/* Tutorial Controls */}
                    <TutorialControls
                        tutorialState={tutorialState}
                        onAction={handleControlAction}
                        onToggleInstructions={toggleInstructions}
                        onToggleProgress={toggleProgress}
                        showInstructions={showInstructions}
                        showProgress={showProgress}
                        theme={tutorialTheme}
                        isLoading={isAnimating}
                    />
                </div>

                {/* Feedback Toasts */}
                {feedbackMessages.map(feedback => (
                    <FeedbackToast
                        key={feedback.id}
                        message={feedback.message}
                        type={feedback.type}
                        onClose={() => setFeedbackMessages(prev => 
                            prev.filter(f => f.id !== feedback.id)
                        )}
                        theme={tutorialTheme}
                    />
                ))}
            </div>
        </>
    );
};

export default TutorialOverlay;