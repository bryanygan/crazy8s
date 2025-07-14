/**
 * TutorialControls.js - Navigation buttons (next, back, skip, etc.)
 * Provides comprehensive tutorial navigation and control interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { FaSync, FaLightbulb, FaGamepad, FaBook } from 'react-icons/fa';

/**
 * Tutorial controls component for navigation and tutorial management
 * @param {Object} props - Component props
 * @param {Object} props.tutorialState - Current tutorial state
 * @param {Function} props.onAction - Callback for control actions
 * @param {Function} props.onToggleInstructions - Callback to toggle instructions
 * @param {Function} props.onToggleProgress - Callback to toggle progress sidebar
 * @param {boolean} props.showInstructions - Whether instructions are visible
 * @param {boolean} props.showProgress - Whether progress sidebar is visible
 * @param {Object} props.theme - Theme configuration
 * @param {boolean} props.isLoading - Whether tutorial is processing an action
 * @param {string} props.position - Controls position ('bottom', 'top', 'floating')
 */
const TutorialControls = ({
    tutorialState,
    onAction,
    onToggleInstructions,
    onToggleProgress,
    showInstructions = true,
    showProgress = true,
    theme,
    isLoading = false,
    position = 'bottom'
}) => {
    // State management
    const [isExpanded, setIsExpanded] = useState(true);
    const [showTooltips, setShowTooltips] = useState(false);
    const [actionHistory, setActionHistory] = useState([]);
    const [confirmingAction, setConfirmingAction] = useState(null);
    
    // Refs
    const controlsRef = useRef(null);
    const timeoutRef = useRef(null);
    
    /**
     * Auto-collapse controls after inactivity
     */
    useEffect(() => {
        if (position === 'floating') {
            const timer = setTimeout(() => {
                setIsExpanded(false);
            }, 5000);
            
            timeoutRef.current = timer;
            return () => clearTimeout(timer);
        }
    }, [position, isExpanded]);
    
    /**
     * Handle mouse enter to expand controls
     */
    const handleMouseEnter = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setIsExpanded(true);
        setShowTooltips(true);
    };
    
    /**
     * Handle mouse leave to schedule collapse
     */
    const handleMouseLeave = () => {
        setShowTooltips(false);
        
        if (position === 'floating') {
            timeoutRef.current = setTimeout(() => {
                setIsExpanded(false);
            }, 2000);
        }
    };
    
    /**
     * Check if action is available
     */
    const isActionAvailable = (actionType) => {
        if (isLoading) return false;
        
        switch (actionType) {
            case 'next':
                return tutorialState.canGoNext !== false;
            case 'previous':
                return tutorialState.canGoPrevious !== false;
            case 'restart':
                return tutorialState.currentLesson != null;
            case 'skip':
                return tutorialState.currentLesson?.canSkip !== false;
            case 'hint':
                return tutorialState.currentLesson?.hints?.length > 0;
            case 'pause':
                return tutorialState.isActive;
            case 'resume':
                return tutorialState.isPaused;
            default:
                return true;
        }
    };
    
    /**
     * Handle control action with confirmation if needed
     */
    const handleAction = async (actionType) => {
        // Actions that require confirmation
        const confirmableActions = ['skip', 'restart', 'close'];
        
        if (confirmableActions.includes(actionType) && !confirmingAction) {
            setConfirmingAction(actionType);
            setTimeout(() => setConfirmingAction(null), 3000);
            return;
        }
        
        // Clear confirmation state
        setConfirmingAction(null);
        
        // Record action in history
        setActionHistory(prev => [...prev.slice(-4), {
            action: actionType,
            timestamp: Date.now()
        }]);
        
        // Execute action
        try {
            await onAction(actionType);
        } catch (error) {
            console.error('Control action failed:', error);
        }
    };
    
    /**
     * Get button configuration
     */
    const getButtonConfig = (actionType) => {
        const configs = {
            previous: {
                icon: '⬅️',
                label: 'Previous',
                shortcut: 'Ctrl+P',
                disabled: !isActionAvailable('previous')
            },
            next: {
                icon: '➡️',
                label: 'Next',
                shortcut: 'Ctrl+N',
                disabled: !isActionAvailable('next')
            },
            restart: {
                icon: <FaSync />,
                label: confirmingAction === 'restart' ? 'Confirm Restart' : 'Restart',
                shortcut: 'Ctrl+R',
                disabled: !isActionAvailable('restart'),
                warning: confirmingAction === 'restart'
            },
            skip: {
                icon: '⏭️',
                label: confirmingAction === 'skip' ? 'Confirm Skip' : 'Skip',
                shortcut: 'Ctrl+S',
                disabled: !isActionAvailable('skip'),
                warning: confirmingAction === 'skip'
            },
            hint: {
                icon: <FaLightbulb />,
                label: 'Hint',
                shortcut: 'Ctrl+H',
                disabled: !isActionAvailable('hint')
            },
            pause: {
                icon: tutorialState.isPaused ? '▶️' : '⏸️',
                label: tutorialState.isPaused ? 'Resume' : 'Pause',
                shortcut: 'Space',
                disabled: !isActionAvailable(tutorialState.isPaused ? 'resume' : 'pause')
            },
            close: {
                icon: '❌',
                label: confirmingAction === 'close' ? 'Confirm Close' : 'Close',
                shortcut: 'Esc',
                disabled: false,
                warning: confirmingAction === 'close'
            }
        };
        
        return configs[actionType] || {};
    };
    
    /**
     * Render control button
     */
    const renderButton = (actionType, variant = 'default') => {
        const config = getButtonConfig(actionType);
        const isConfirming = confirmingAction === actionType;
        
        const buttonStyle = {
            padding: variant === 'compact' ? '8px 12px' : '12px 16px',
            background: config.warning ? theme.colors.warning : 
                       variant === 'primary' ? theme.colors.info : 
                       'rgba(255, 255, 255, 0.1)',
            border: `2px solid ${config.warning ? theme.colors.warning : theme.colors.info}`,
            borderRadius: theme.borderRadius,
            color: config.warning ? 'white' : theme.colors.text,
            cursor: config.disabled ? 'not-allowed' : 'pointer',
            opacity: config.disabled ? 0.5 : 1,
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.small,
            fontSize: variant === 'compact' ? '14px' : '16px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden'
        };
        
        return (
            <button
                key={actionType}
                onClick={() => handleAction(actionType)}
                disabled={config.disabled}
                style={buttonStyle}
                onMouseEnter={(e) => {
                    if (!config.disabled) {
                        e.target.style.background = config.warning ? 
                            'rgba(243, 156, 18, 0.9)' : 
                            'rgba(52, 152, 219, 0.2)';
                        e.target.style.transform = 'translateY(-2px)';
                    }
                }}
                onMouseLeave={(e) => {
                    e.target.style.background = buttonStyle.background;
                    e.target.style.transform = 'translateY(0)';
                }}
                title={`${config.label} (${config.shortcut})`}
                aria-label={`${config.label} - ${config.shortcut}`}
            >
                <span style={{ fontSize: '18px' }}>{config.icon}</span>
                {(isExpanded || variant === 'always-show') && (
                    <span>{config.label}</span>
                )}
                
                {/* Loading indicator */}
                {isLoading && actionHistory[actionHistory.length - 1]?.action === actionType && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'controlsSpinner 1s linear infinite'
                        }} />
                    </div>
                )}
                
                {/* Confirmation pulse */}
                {isConfirming && (
                    <div style={{
                        position: 'absolute',
                        top: '-2px',
                        left: '-2px',
                        right: '-2px',
                        bottom: '-2px',
                        border: '2px solid rgba(243, 156, 18, 0.5)',
                        borderRadius: theme.borderRadius,
                        animation: 'controlsPulse 1s infinite'
                    }} />
                )}
            </button>
        );
    };
    
    /**
     * Render tooltip for button
     */
    const renderTooltip = (actionType) => {
        if (!showTooltips) return null;
        
        const config = getButtonConfig(actionType);
        
        return (
            <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: theme.colors.primary,
                color: 'white',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                marginBottom: '8px',
                boxShadow: theme.boxShadow,
                zIndex: 10002,
                animation: 'controlsFadeIn 0.2s ease-out'
            }}>
                {config.label}
                <div style={{
                    fontSize: '10px',
                    opacity: 0.8,
                    marginTop: '2px'
                }}>
                    {config.shortcut}
                </div>
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: `4px solid ${theme.colors.primary}`
                }} />
            </div>
        );
    };
    
    /**
     * Get controls layout based on position
     */
    const getControlsStyle = () => {
        const baseStyle = {
            position: 'fixed',
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing.small,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(15px)',
            borderRadius: theme.borderRadius,
            padding: theme.spacing.medium,
            zIndex: 10001,
            transition: 'all 0.3s ease-out',
            border: `1px solid rgba(255, 255, 255, 0.1)`,
            boxShadow: theme.boxShadow
        };
        
        switch (position) {
            case 'bottom':
                return {
                    ...baseStyle,
                    bottom: theme.spacing.large,
                    left: '50%',
                    transform: `translateX(-50%) ${isExpanded ? 'translateY(0)' : 'translateY(20px)'}`,
                    opacity: isExpanded ? 1 : 0.8
                };
                
            case 'top':
                return {
                    ...baseStyle,
                    top: theme.spacing.large,
                    right: theme.spacing.large,
                    transform: isExpanded ? 'translateY(0)' : 'translateY(-20px)',
                    opacity: isExpanded ? 1 : 0.8
                };
                
            case 'floating':
                return {
                    ...baseStyle,
                    bottom: theme.spacing.large,
                    right: theme.spacing.large,
                    width: isExpanded ? 'auto' : '60px',
                    height: isExpanded ? 'auto' : '60px',
                    borderRadius: isExpanded ? theme.borderRadius : '50%',
                    justifyContent: 'center',
                    overflow: 'hidden'
                };
                
            default:
                return baseStyle;
        }
    };
    
    // Don't render if no tutorial state
    if (!tutorialState) {
        return null;
    }
    
    return (
        <>
            {/* CSS Animations */}
            <style jsx>{`
                @keyframes controlsSpinner {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                @keyframes controlsPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                @keyframes controlsFadeIn {
                    from { opacity: 0; transform: translateX(-50%) translateY(5px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                
                @keyframes controlsSlideIn {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .tutorial-controls {
                    animation: controlsSlideIn 0.4s ease-out;
                }
                
                .tutorial-controls:hover .control-button {
                    opacity: 1;
                }
                
                .control-button {
                    transition: all 0.2s ease;
                }
                
                .control-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }
                
                .control-button:active {
                    transform: translateY(0);
                }
                
                @media (max-width: 768px) {
                    .tutorial-controls {
                        padding: ${theme.spacing.small} !important;
                        gap: ${theme.spacing.small} !important;
                    }
                    
                    .control-button {
                        padding: 8px 10px !important;
                        font-size: 14px !important;
                    }
                }
                
                @media (max-width: 480px) {
                    .tutorial-controls {
                        bottom: ${theme.spacing.small} !important;
                        left: ${theme.spacing.small} !important;
                        right: ${theme.spacing.small} !important;
                        transform: none !important;
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .tutorial-controls {
                        animation: none !important;
                    }
                    
                    .control-button {
                        transition: none !important;
                    }
                }
            `}</style>
            
            {/* Main Controls Container */}
            <div
                ref={controlsRef}
                className="tutorial-controls"
                style={getControlsStyle()}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                role="toolbar"
                aria-label="Tutorial navigation controls"
            >
                {/* Floating Controls - Collapsed State */}
                {position === 'floating' && !isExpanded && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                    }}>
                        <FaGamepad />
                    </div>
                )}
                
                {/* Expanded Controls */}
                {(position !== 'floating' || isExpanded) && (
                    <>
                        {/* Primary Navigation */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing.small,
                            position: 'relative'
                        }}>
                            {renderButton('previous', 'compact')}
                            {renderButton('next', 'primary')}
                            {showTooltips && renderTooltip('previous')}
                            {showTooltips && renderTooltip('next')}
                        </div>
                        
                        {/* Separator */}
                        <div style={{
                            width: '1px',
                            height: '30px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            margin: `0 ${theme.spacing.small}`
                        }} />
                        
                        {/* Action Controls */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing.small,
                            position: 'relative'
                        }}>
                            {renderButton('hint', 'compact')}
                            {renderButton('restart', 'compact')}
                            {renderButton('skip', 'compact')}
                            {showTooltips && renderTooltip('hint')}
                            {showTooltips && renderTooltip('restart')}
                            {showTooltips && renderTooltip('skip')}
                        </div>
                        
                        {/* Separator */}
                        <div style={{
                            width: '1px',
                            height: '30px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            margin: `0 ${theme.spacing.small}`
                        }} />
                        
                        {/* UI Controls */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing.small,
                            position: 'relative'
                        }}>
                            <button
                                onClick={onToggleInstructions}
                                style={{
                                    padding: '8px 12px',
                                    background: showInstructions ? 
                                        'rgba(52, 152, 219, 0.3)' : 
                                        'rgba(255, 255, 255, 0.1)',
                                    border: `2px solid ${theme.colors.info}`,
                                    borderRadius: theme.borderRadius,
                                    color: theme.colors.text,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: theme.spacing.small,
                                    fontSize: '14px'
                                }}
                                title="Toggle instructions (Ctrl+I)"
                                aria-label="Toggle tutorial instructions"
                            >
                                <span><FaBook /></span>
                                {isExpanded && <span>Instructions</span>}
                            </button>
                            
                            <button
                                onClick={onToggleProgress}
                                style={{
                                    padding: '8px 12px',
                                    background: showProgress ? 
                                        'rgba(52, 152, 219, 0.3)' : 
                                        'rgba(255, 255, 255, 0.1)',
                                    border: `2px solid ${theme.colors.info}`,
                                    borderRadius: theme.borderRadius,
                                    color: theme.colors.text,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: theme.spacing.small,
                                    fontSize: '14px'
                                }}
                                title="Toggle progress sidebar"
                                aria-label="Toggle tutorial progress sidebar"
                            >
                                <span>📊</span>
                                {isExpanded && <span>Progress</span>}
                            </button>
                        </div>
                        
                        {/* Separator */}
                        <div style={{
                            width: '1px',
                            height: '30px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            margin: `0 ${theme.spacing.small}`
                        }} />
                        
                        {/* Exit Control */}
                        <div style={{
                            position: 'relative'
                        }}>
                            {renderButton('close', 'compact')}
                            {showTooltips && renderTooltip('close')}
                        </div>
                    </>
                )}
                
                {/* Progress Indicator */}
                {tutorialState.progress && (
                    <div style={{
                        position: 'absolute',
                        top: '-4px',
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '1px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${tutorialState.progress.lessons?.percentage || 0}%`,
                            height: '100%',
                            background: theme.colors.success,
                            transition: 'width 0.5s ease-out'
                        }} />
                    </div>
                )}
            </div>
        </>
    );
};

export default TutorialControls;