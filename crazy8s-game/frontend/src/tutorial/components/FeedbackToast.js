/**
 * FeedbackToast.js - Success/error feedback for tutorial actions
 * Displays toast notifications with animations and auto-dismiss
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Feedback toast component for tutorial notifications
 * @param {Object} props - Component props
 * @param {string} props.message - Toast message content
 * @param {string} props.type - Toast type ('success', 'error', 'warning', 'info')
 * @param {Function} props.onClose - Callback when toast is closed
 * @param {Object} props.theme - Theme configuration
 * @param {number} props.duration - Auto-dismiss duration (ms)
 * @param {string} props.position - Toast position ('top-right', 'top-left', 'bottom-right', 'bottom-left')
 * @param {boolean} props.showIcon - Whether to show type icon
 * @param {boolean} props.dismissible - Whether toast can be manually dismissed
 * @param {Function} props.onAction - Optional action callback for interactive toasts
 * @param {string} props.actionLabel - Label for action button
 */
const FeedbackToast = ({
    message,
    type = 'info',
    onClose,
    theme,
    duration = 4000,
    position = 'top-right',
    showIcon = true,
    dismissible = true,
    onAction,
    actionLabel = 'Action'
}) => {
    // State management
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const [isPaused, setIsPaused] = useState(false);
    
    // Refs
    const toastRef = useRef(null);
    const progressRef = useRef(null);
    const timeoutRef = useRef(null);
    const startTimeRef = useRef(null);
    const remainingTimeRef = useRef(duration);
    
    /**
     * Initialize toast visibility and auto-dismiss
     */
    useEffect(() => {
        // Show toast with animation
        setIsVisible(true);
        startTimeRef.current = Date.now();
        
        // Start auto-dismiss timer
        if (duration > 0) {
            startDismissTimer();
        }
        
        // Focus toast for accessibility
        if (toastRef.current) {
            toastRef.current.focus();
        }
        
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [duration]);

    /**
     * Start the auto-dismiss timer
     */
    const startDismissTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
            handleClose();
        }, remainingTimeRef.current);
        
        // Start progress animation
        if (progressRef.current) {
            progressRef.current.style.transition = `width ${remainingTimeRef.current}ms linear`;
            progressRef.current.style.width = '0%';
        }
    };

    /**
     * Pause the auto-dismiss timer
     */
    const pauseDismissTimer = () => {
        if (!isPaused && timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            
            // Calculate remaining time
            const elapsed = Date.now() - startTimeRef.current;
            remainingTimeRef.current = Math.max(0, duration - elapsed);
            
            setIsPaused(true);
            
            // Pause progress animation
            if (progressRef.current) {
                const computedStyle = window.getComputedStyle(progressRef.current);
                const currentWidth = computedStyle.width;
                progressRef.current.style.transition = 'none';
                progressRef.current.style.width = currentWidth;
            }
        }
    };

    /**
     * Resume the auto-dismiss timer
     */
    const resumeDismissTimer = () => {
        if (isPaused && remainingTimeRef.current > 0) {
            setIsPaused(false);
            startTimeRef.current = Date.now();
            startDismissTimer();
        }
    };

    /**
     * Handle toast close
     */
    const handleClose = () => {
        setIsExiting(true);
        
        // Wait for exit animation before calling onClose
        setTimeout(() => {
            if (onClose) {
                onClose();
            }
        }, 300);
    };

    /**
     * Handle action button click
     */
    const handleAction = () => {
        if (onAction) {
            onAction();
        }
        handleClose();
    };

    /**
     * Get toast configuration based on type
     */
    const getToastConfig = () => {
        const configs = {
            success: {
                icon: '✅',
                color: theme.colors.success,
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                borderColor: theme.colors.success,
                progressColor: theme.colors.success
            },
            error: {
                icon: '❌',
                color: theme.colors.error,
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderColor: theme.colors.error,
                progressColor: theme.colors.error
            },
            warning: {
                icon: '⚠️',
                color: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                borderColor: '#f39c12',
                progressColor: '#f39c12'
            },
            info: {
                icon: '💡',
                color: theme.colors.info,
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderColor: theme.colors.info,
                progressColor: theme.colors.info
            }
        };
        
        return configs[type] || configs.info;
    };

    /**
     * Get position styles
     */
    const getPositionStyles = () => {
        const positions = {
            'top-right': {
                top: '20px',
                right: '20px',
                animation: isExiting ? 
                    'toastSlideOutRight 0.3s ease-in forwards' : 
                    'toastSlideInRight 0.3s ease-out'
            },
            'top-left': {
                top: '20px',
                left: '20px',
                animation: isExiting ? 
                    'toastSlideOutLeft 0.3s ease-in forwards' : 
                    'toastSlideInLeft 0.3s ease-out'
            },
            'bottom-right': {
                bottom: '20px',
                right: '20px',
                animation: isExiting ? 
                    'toastSlideOutRight 0.3s ease-in forwards' : 
                    'toastSlideInRight 0.3s ease-out'
            },
            'bottom-left': {
                bottom: '20px',
                left: '20px',
                animation: isExiting ? 
                    'toastSlideOutLeft 0.3s ease-in forwards' : 
                    'toastSlideInLeft 0.3s ease-out'
            }
        };
        
        return positions[position] || positions['top-right'];
    };

    /**
     * Handle keyboard navigation
     */
    const handleKeyDown = (event) => {
        switch (event.key) {
            case 'Escape':
                if (dismissible) {
                    handleClose();
                }
                break;
            case 'Enter':
            case ' ':
                if (onAction) {
                    event.preventDefault();
                    handleAction();
                }
                break;
            default:
                break;
        }
    };

    const config = getToastConfig();
    const positionStyles = getPositionStyles();

    return (
        <>
            {/* CSS Animations */}
            <style jsx>{`
                @keyframes toastSlideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes toastSlideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
                
                @keyframes toastSlideInLeft {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes toastSlideOutLeft {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                }
                
                @keyframes toastFadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                @keyframes toastShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                    20%, 40%, 60%, 80% { transform: translateX(2px); }
                }
                
                .feedback-toast {
                    position: fixed;
                    max-width: 400px;
                    min-width: 300px;
                    background: ${theme.colors.background};
                    border: 2px solid ${config.borderColor};
                    border-radius: ${theme.borderRadius};
                    box-shadow: ${theme.boxShadow};
                    z-index: 10001;
                    overflow: hidden;
                    transition: transform 0.2s ease;
                }
                
                .toast-content {
                    padding: ${theme.spacing.medium};
                    display: flex;
                    align-items: flex-start;
                    gap: ${theme.spacing.small};
                    background: ${config.backgroundColor};
                }
                
                .toast-icon {
                    font-size: 18px;
                    flex-shrink: 0;
                    margin-top: 2px;
                }
                
                .toast-message {
                    flex: 1;
                    color: ${theme.colors.text};
                    font-size: 14px;
                    line-height: 1.4;
                    word-wrap: break-word;
                }
                
                .toast-actions {
                    display: flex;
                    gap: ${theme.spacing.small};
                    margin-top: ${theme.spacing.small};
                }
                
                .toast-button {
                    padding: 4px 8px;
                    border: 1px solid ${config.color};
                    background: transparent;
                    color: ${config.color};
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .toast-button:hover {
                    background: ${config.color};
                    color: white;
                }
                
                .toast-button.primary {
                    background: ${config.color};
                    color: white;
                }
                
                .toast-button.primary:hover {
                    opacity: 0.9;
                }
                
                .toast-close {
                    background: none;
                    border: none;
                    color: ${theme.colors.secondary};
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    font-size: 16px;
                    line-height: 1;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }
                
                .toast-close:hover {
                    background: rgba(0, 0, 0, 0.1);
                    color: ${theme.colors.text};
                }
                
                .toast-progress {
                    height: 3px;
                    background: rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                
                .toast-progress-bar {
                    height: 100%;
                    background: ${config.progressColor};
                    width: 100%;
                    transition: width 0.1s linear;
                }
                
                .feedback-toast:hover {
                    transform: translateY(-2px);
                }
                
                .feedback-toast.error {
                    animation: toastShake 0.5s ease-out;
                }
                
                @media (max-width: 768px) {
                    .feedback-toast {
                        max-width: calc(100vw - 40px);
                        min-width: 280px;
                    }
                    
                    .toast-content {
                        padding: ${theme.spacing.small};
                    }
                    
                    .toast-message {
                        font-size: 13px;
                    }
                }
                
                @media (max-width: 480px) {
                    .feedback-toast {
                        max-width: calc(100vw - 20px);
                        min-width: 250px;
                    }
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .feedback-toast {
                        animation: toastFadeIn 0.3s ease-out !important;
                    }
                    
                    .toast-progress-bar {
                        transition: none !important;
                    }
                }
            `}</style>

            {/* Toast Container */}
            <div
                ref={toastRef}
                className={`feedback-toast ${type}`}
                style={positionStyles}
                role="alert"
                aria-live={type === 'error' ? 'assertive' : 'polite'}
                aria-atomic="true"
                tabIndex={-1}
                onKeyDown={handleKeyDown}
                onMouseEnter={() => {
                    if (duration > 0) {
                        pauseDismissTimer();
                    }
                }}
                onMouseLeave={() => {
                    if (duration > 0) {
                        resumeDismissTimer();
                    }
                }}
                onFocus={() => {
                    if (duration > 0) {
                        pauseDismissTimer();
                    }
                }}
                onBlur={() => {
                    if (duration > 0) {
                        resumeDismissTimer();
                    }
                }}
            >
                {/* Toast Content */}
                <div className="toast-content">
                    {/* Icon */}
                    {showIcon && (
                        <div 
                            className="toast-icon"
                            aria-hidden="true"
                        >
                            {config.icon}
                        </div>
                    )}
                    
                    {/* Message Content */}
                    <div className="toast-message">
                        {message}
                        
                        {/* Action Buttons */}
                        {(onAction || dismissible) && (
                            <div className="toast-actions">
                                {onAction && (
                                    <button
                                        className="toast-button primary"
                                        onClick={handleAction}
                                        aria-label={actionLabel}
                                    >
                                        {actionLabel}
                                    </button>
                                )}
                                
                                {dismissible && (
                                    <button
                                        className="toast-button"
                                        onClick={handleClose}
                                        aria-label="Dismiss notification"
                                    >
                                        Dismiss
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Close Button */}
                    {dismissible && (
                        <button
                            className="toast-close"
                            onClick={handleClose}
                            aria-label="Close notification"
                            title="Close (Esc)"
                        >
                            ×
                        </button>
                    )}
                </div>
                
                {/* Progress Bar */}
                {duration > 0 && (
                    <div 
                        className="toast-progress"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Auto-dismiss progress"
                    >
                        <div 
                            ref={progressRef}
                            className="toast-progress-bar"
                        />
                    </div>
                )}
            </div>
        </>
    );
};

/**
 * Toast container component for managing multiple toasts
 * @param {Object} props - Component props
 * @param {Array} props.toasts - Array of toast data
 * @param {Function} props.onRemoveToast - Callback to remove a toast
 * @param {Object} props.theme - Theme configuration
 * @param {string} props.position - Container position
 * @param {number} props.maxToasts - Maximum number of visible toasts
 */
export const ToastContainer = ({
    toasts = [],
    onRemoveToast,
    theme,
    position = 'top-right',
    maxToasts = 5
}) => {
    // Limit number of visible toasts
    const visibleToasts = toasts.slice(-maxToasts);
    
    return (
        <div
            style={{
                position: 'fixed',
                zIndex: 10001,
                pointerEvents: 'none'
            }}
            aria-live="polite"
            aria-label="Notifications"
        >
            {visibleToasts.map((toast, index) => (
                <FeedbackToast
                    key={toast.id}
                    {...toast}
                    theme={theme}
                    position={position}
                    onClose={() => onRemoveToast(toast.id)}
                    style={{
                        marginBottom: theme.spacing.small,
                        transform: `translateY(${index * -10}px)`,
                        zIndex: 10001 - index,
                        pointerEvents: 'auto'
                    }}
                />
            ))}
        </div>
    );
};

/**
 * Hook for managing toast notifications
 * @returns {Object} Toast management functions
 */
export const useToastManager = () => {
    const [toasts, setToasts] = useState([]);
    
    const addToast = (message, type = 'info', options = {}) => {
        const toast = {
            id: Date.now() + Math.random(),
            message,
            type,
            timestamp: Date.now(),
            ...options
        };
        
        setToasts(prev => [...prev, toast]);
        
        return toast.id;
    };
    
    const removeToast = (toastId) => {
        setToasts(prev => prev.filter(toast => toast.id !== toastId));
    };
    
    const clearAllToasts = () => {
        setToasts([]);
    };
    
    const showSuccess = (message, options) => addToast(message, 'success', options);
    const showError = (message, options) => addToast(message, 'error', options);
    const showWarning = (message, options) => addToast(message, 'warning', options);
    const showInfo = (message, options) => addToast(message, 'info', options);
    
    return {
        toasts,
        addToast,
        removeToast,
        clearAllToasts,
        showSuccess,
        showError,
        showWarning,
        showInfo
    };
};

export default FeedbackToast;