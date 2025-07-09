/**
 * HighlightSystem.js - Visual highlighting for tutorial targets
 * Provides spotlight effects, glows, and animations for tutorial elements
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Highlight system component for drawing attention to tutorial targets
 * @param {Object} props - Component props
 * @param {Array} props.targets - Array of highlight target objects
 * @param {Object} props.theme - Theme configuration
 * @param {boolean} props.isActive - Whether highlighting is active
 * @param {Function} props.onTargetClick - Callback when highlighted element is clicked
 */
const HighlightSystem = ({
    targets = [],
    theme,
    isActive = true,
    onTargetClick
}) => {
    // State management
    const [activeHighlights, setActiveHighlights] = useState([]);
    const [highlightElements, setHighlightElements] = useState(new Map());
    const [observers, setObservers] = useState(new Map());
    
    // Refs
    const containerRef = useRef(null);
    const resizeObserverRef = useRef(null);
    const mutationObserverRef = useRef(null);
    
    /**
     * Update highlights when targets change
     */
    useEffect(() => {
        if (!isActive || targets.length === 0) {
            clearAllHighlights();
            return;
        }
        
        updateHighlights();
        
    }, [targets, isActive]);

    /**
     * Set up observers for dynamic updates
     */
    useEffect(() => {
        setupObservers();
        
        return () => {
            cleanupObservers();
        };
    }, []);

    /**
     * Handle window resize
     */
    useEffect(() => {
        const handleResize = debounce(() => {
            if (isActive && activeHighlights.length > 0) {
                updateHighlightPositions();
            }
        }, 150);

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isActive, activeHighlights]);

    /**
     * Update all highlights
     */
    const updateHighlights = useCallback(() => {
        const newHighlights = [];
        const newElements = new Map();
        
        targets.forEach(target => {
            const element = getTargetElement(target);
            
            if (element) {
                const highlight = createHighlightData(target, element);
                newHighlights.push(highlight);
                newElements.set(target.id, element);
                
                // Set up individual element observer
                observeElement(target.id, element);
            }
        });
        
        setActiveHighlights(newHighlights);
        setHighlightElements(newElements);
    }, [targets]);

    /**
     * Get target element from target definition
     */
    const getTargetElement = (target) => {
        // Direct element reference
        if (target.element && target.element.nodeType) {
            return target.element;
        }
        
        // Selector-based targeting
        if (target.selector) {
            return document.querySelector(target.selector);
        }
        
        // ID-based targeting
        if (target.elementId) {
            return document.getElementById(target.elementId);
        }
        
        // Class-based targeting
        if (target.className) {
            return document.querySelector(`.${target.className}`);
        }
        
        return null;
    };

    /**
     * Create highlight data for an element
     */
    const createHighlightData = (target, element) => {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        return {
            id: target.id,
            target,
            element,
            position: {
                top: rect.top + scrollTop,
                left: rect.left + scrollLeft,
                width: rect.width,
                height: rect.height
            },
            style: getHighlightStyle(target),
            animations: getHighlightAnimations(target),
            interactive: target.interactive !== false
        };
    };

    /**
     * Get highlight style based on target configuration
     */
    const getHighlightStyle = (target) => {
        const baseStyle = {
            position: 'absolute',
            pointerEvents: target.interactive !== false ? 'auto' : 'none',
            zIndex: 10000,
            borderRadius: target.borderRadius || theme.borderRadius,
            transition: 'all 0.3s ease-out'
        };
        
        switch (target.type) {
            case 'spotlight':
                return {
                    ...baseStyle,
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: `3px solid ${target.color || theme.colors.info}`,
                    boxShadow: `0 0 0 4px rgba(52, 152, 219, 0.3), 
                               0 0 20px rgba(52, 152, 219, 0.5),
                               inset 0 0 20px rgba(255, 255, 255, 0.1)`
                };
                
            case 'glow':
                return {
                    ...baseStyle,
                    background: 'transparent',
                    border: `2px solid ${target.color || theme.colors.success}`,
                    boxShadow: `0 0 0 2px rgba(39, 174, 96, 0.4),
                               0 0 15px rgba(39, 174, 96, 0.6)`
                };
                
            case 'outline':
                return {
                    ...baseStyle,
                    background: 'rgba(52, 152, 219, 0.1)',
                    border: `2px dashed ${target.color || theme.colors.info}`,
                    borderRadius: '4px'
                };
                
            case 'pulse':
                return {
                    ...baseStyle,
                    background: 'rgba(52, 152, 219, 0.2)',
                    border: `2px solid ${target.color || theme.colors.info}`,
                    boxShadow: `0 0 0 4px rgba(52, 152, 219, 0.2)`
                };
                
            case 'card':
                return {
                    ...baseStyle,
                    background: 'rgba(39, 174, 96, 0.1)',
                    border: `3px solid ${target.color || theme.colors.success}`,
                    borderRadius: '12px',
                    boxShadow: `0 0 0 3px rgba(39, 174, 96, 0.3),
                               0 4px 15px rgba(39, 174, 96, 0.4)`
                };
                
            case 'button':
                return {
                    ...baseStyle,
                    background: 'rgba(52, 152, 219, 0.15)',
                    border: `2px solid ${target.color || theme.colors.info}`,
                    borderRadius: '8px',
                    boxShadow: `0 0 0 3px rgba(52, 152, 219, 0.2),
                               0 2px 10px rgba(52, 152, 219, 0.3)`
                };
                
            default:
                return {
                    ...baseStyle,
                    background: 'rgba(52, 152, 219, 0.1)',
                    border: `2px solid ${target.color || theme.colors.info}`
                };
        }
    };

    /**
     * Get animations for highlight type
     */
    const getHighlightAnimations = (target) => {
        const animations = [];
        
        if (target.pulse) {
            animations.push('tutorialPulse 2s infinite');
        }
        
        if (target.bounce) {
            animations.push('tutorialBounce 0.6s ease-out');
        }
        
        if (target.fade) {
            animations.push('tutorialFadeIn 0.5s ease-out');
        }
        
        if (target.shake) {
            animations.push('tutorialShake 0.5s ease-out');
        }
        
        return animations.join(', ');
    };

    /**
     * Update highlight positions
     */
    const updateHighlightPositions = useCallback(() => {
        setActiveHighlights(prev => 
            prev.map(highlight => {
                const element = highlightElements.get(highlight.id);
                if (!element) return highlight;
                
                const rect = element.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                
                return {
                    ...highlight,
                    position: {
                        top: rect.top + scrollTop,
                        left: rect.left + scrollLeft,
                        width: rect.width,
                        height: rect.height
                    }
                };
            })
        );
    }, [highlightElements]);

    /**
     * Set up element observers
     */
    const setupObservers = () => {
        // Mutation observer for DOM changes
        if ('MutationObserver' in window) {
            mutationObserverRef.current = new MutationObserver(() => {
                if (isActive && activeHighlights.length > 0) {
                    updateHighlightPositions();
                }
            });
            
            mutationObserverRef.current.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
    };

    /**
     * Observe individual element for changes
     */
    const observeElement = (targetId, element) => {
        if ('ResizeObserver' in window) {
            const observer = new ResizeObserver(() => {
                updateHighlightPositions();
            });
            
            observer.observe(element);
            setObservers(prev => new Map(prev.set(targetId, observer)));
        }
    };

    /**
     * Clean up observers
     */
    const cleanupObservers = () => {
        // Clean up mutation observer
        if (mutationObserverRef.current) {
            mutationObserverRef.current.disconnect();
        }
        
        // Clean up resize observers
        observers.forEach(observer => observer.disconnect());
        setObservers(new Map());
    };

    /**
     * Clear all highlights
     */
    const clearAllHighlights = () => {
        setActiveHighlights([]);
        setHighlightElements(new Map());
        cleanupObservers();
    };

    /**
     * Handle highlight click
     */
    const handleHighlightClick = (highlight, event) => {
        if (onTargetClick) {
            onTargetClick(highlight.target, highlight.element, event);
        }
        
        // Add click animation
        const highlightEl = event.currentTarget;
        highlightEl.style.animation = 'tutorialClickPulse 0.3s ease-out';
        
        setTimeout(() => {
            highlightEl.style.animation = highlight.animations;
        }, 300);
    };

    /**
     * Render tooltip for highlight
     */
    const renderTooltip = (highlight) => {
        if (!highlight.target.tooltip) return null;
        
        const { position } = highlight;
        const tooltipStyle = {
            position: 'absolute',
            top: position.top - 40,
            left: position.left + (position.width / 2),
            transform: 'translateX(-50%)',
            background: theme.colors.primary,
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            whiteSpace: 'nowrap',
            zIndex: 10001,
            boxShadow: theme.boxShadow,
            animation: 'tutorialFadeIn 0.3s ease-out'
        };
        
        return (
            <div style={tooltipStyle} className="tutorial-tooltip">
                {highlight.target.tooltip}
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: `6px solid ${theme.colors.primary}`
                }} />
            </div>
        );
    };

    /**
     * Debounce utility
     */
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    // Don't render if inactive or no highlights
    if (!isActive || activeHighlights.length === 0) {
        return null;
    }

    return (
        <>
            {/* CSS Animations */}
            <style jsx>{`
                @keyframes tutorialPulse {
                    0%, 100% { 
                        transform: scale(1); 
                        opacity: 1; 
                    }
                    50% { 
                        transform: scale(1.03); 
                        opacity: 0.8; 
                    }
                }
                
                @keyframes tutorialBounce {
                    0%, 20%, 50%, 80%, 100% { 
                        transform: translateY(0); 
                    }
                    40% { 
                        transform: translateY(-10px); 
                    }
                    60% { 
                        transform: translateY(-5px); 
                    }
                }
                
                @keyframes tutorialFadeIn {
                    from { 
                        opacity: 0; 
                        transform: translateY(-10px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateY(0); 
                    }
                }
                
                @keyframes tutorialShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                
                @keyframes tutorialClickPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(0.95); }
                    100% { transform: scale(1); }
                }
                
                .tutorial-highlight {
                    cursor: pointer;
                    user-select: none;
                }
                
                .tutorial-highlight:hover {
                    filter: brightness(1.1);
                }
                
                .tutorial-highlight:active {
                    filter: brightness(0.9);
                }
                
                .tutorial-tooltip {
                    pointer-events: none;
                    user-select: none;
                }
                
                @media (max-width: 768px) {
                    .tutorial-tooltip {
                        font-size: 12px;
                        padding: 6px 10px;
                    }
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .tutorial-highlight {
                        animation: none !important;
                    }
                    
                    .tutorial-tooltip {
                        animation: none !important;
                    }
                }
            `}</style>

            {/* Highlight Container */}
            <div ref={containerRef} style={{ position: 'relative', pointerEvents: 'none' }}>
                {activeHighlights.map(highlight => (
                    <React.Fragment key={highlight.id}>
                        {/* Main Highlight */}
                        <div
                            className="tutorial-highlight"
                            style={{
                                ...highlight.style,
                                top: highlight.position.top,
                                left: highlight.position.left,
                                width: highlight.position.width,
                                height: highlight.position.height,
                                animation: highlight.animations,
                                pointerEvents: highlight.interactive ? 'auto' : 'none'
                            }}
                            onClick={(e) => handleHighlightClick(highlight, e)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleHighlightClick(highlight, e);
                                }
                            }}
                            tabIndex={highlight.interactive ? 0 : -1}
                            role={highlight.interactive ? 'button' : 'presentation'}
                            aria-label={
                                highlight.target.tooltip || 
                                `Tutorial highlight for ${highlight.target.type}`
                            }
                        />
                        
                        {/* Tooltip */}
                        {renderTooltip(highlight)}
                        
                        {/* Additional Effects */}
                        {highlight.target.arrow && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: highlight.position.top - 30,
                                    left: highlight.position.left + (highlight.position.width / 2) - 10,
                                    width: 0,
                                    height: 0,
                                    borderLeft: '10px solid transparent',
                                    borderRight: '10px solid transparent',
                                    borderTop: `20px solid ${highlight.target.color || theme.colors.info}`,
                                    zIndex: 10000,
                                    animation: 'tutorialBounce 1s infinite',
                                    pointerEvents: 'none'
                                }}
                                aria-hidden="true"
                            />
                        )}
                        
                        {/* Ripple Effect */}
                        {highlight.target.ripple && (
                            <div
                                style={{
                                    position: 'absolute',
                                    top: highlight.position.top - 10,
                                    left: highlight.position.left - 10,
                                    width: highlight.position.width + 20,
                                    height: highlight.position.height + 20,
                                    border: `2px solid ${highlight.target.color || theme.colors.info}`,
                                    borderRadius: '50%',
                                    opacity: 0.5,
                                    animation: 'tutorialPulse 3s infinite',
                                    pointerEvents: 'none',
                                    zIndex: 9999
                                }}
                                aria-hidden="true"
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </>
    );
};

export default HighlightSystem;