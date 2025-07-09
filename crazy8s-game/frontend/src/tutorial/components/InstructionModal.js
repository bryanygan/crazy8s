/**
 * InstructionModal.js - Displays lesson instructions and explanations
 * Shows lesson objectives, hints, and contextual information
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Instruction modal component for displaying lesson information
 * @param {Object} props - Component props
 * @param {Object} props.lesson - Current lesson data
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onAction - Callback for tutorial actions
 * @param {Object} props.theme - Theme configuration
 * @param {Object} props.gameState - Current game state
 * @param {boolean} props.autoHide - Whether to auto-hide the modal
 * @param {number} props.autoHideDelay - Delay before auto-hiding (ms)
 */
const InstructionModal = ({
    lesson,
    onClose,
    onAction,
    theme,
    gameState,
    autoHide = false,
    autoHideDelay = 10000
}) => {
    // State management
    const [currentObjectiveIndex, setCurrentObjectiveIndex] = useState(0);
    const [showHints, setShowHints] = useState(false);
    const [expandedSections, setExpandedSections] = useState(new Set(['objectives']));
    const [isMinimized, setIsMinimized] = useState(false);
    const [autoHideTimer, setAutoHideTimer] = useState(null);
    
    // Refs
    const modalRef = useRef(null);
    const objectiveRefs = useRef([]);
    
    /**
     * Set up auto-hide timer
     */
    useEffect(() => {
        if (autoHide && autoHideDelay > 0) {
            const timer = setTimeout(() => {
                setIsMinimized(true);
            }, autoHideDelay);
            
            setAutoHideTimer(timer);
            
            return () => clearTimeout(timer);
        }
    }, [autoHide, autoHideDelay]);

    /**
     * Update current objective based on lesson progress
     */
    useEffect(() => {
        if (!lesson.state?.completedObjectives) return;
        
        const completedCount = lesson.state.completedObjectives.length;
        setCurrentObjectiveIndex(Math.min(completedCount, lesson.objectives.length - 1));
    }, [lesson.state?.completedObjectives, lesson.objectives.length]);

    /**
     * Handle keyboard navigation
     */
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            } else if (event.key === 'h' || event.key === 'H') {
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    setShowHints(!showHints);
                }
            } else if (event.key === 'm' || event.key === 'M') {
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    setIsMinimized(!isMinimized);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose, showHints, isMinimized]);

    /**
     * Get completed objectives
     */
    const getCompletedObjectives = () => {
        return lesson.state?.completedObjectives || [];
    };

    /**
     * Get current objective
     */
    const getCurrentObjective = () => {
        const completed = getCompletedObjectives();
        return lesson.objectives.find(obj => !completed.includes(obj.id)) || null;
    };

    /**
     * Check if objective is completed
     */
    const isObjectiveCompleted = (objectiveId) => {
        return getCompletedObjectives().includes(objectiveId);
    };

    /**
     * Get objective status icon
     */
    const getObjectiveIcon = (objective) => {
        if (isObjectiveCompleted(objective.id)) {
            return '✅';
        } else if (getCurrentObjective()?.id === objective.id) {
            return '🎯';
        } else {
            return '⭕';
        }
    };

    /**
     * Toggle section expansion
     */
    const toggleSection = (sectionName) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionName)) {
            newExpanded.delete(sectionName);
        } else {
            newExpanded.add(sectionName);
        }
        setExpandedSections(newExpanded);
    };

    /**
     * Format card for display
     */
    const formatCard = (card) => {
        if (!card) return 'Any card';
        
        const suitSymbols = {
            'Hearts': '♥',
            'Diamonds': '♦',
            'Clubs': '♣',
            'Spades': '♠'
        };
        
        const symbol = suitSymbols[card.suit] || card.suit;
        return `${card.rank}${symbol}`;
    };

    /**
     * Get objective details
     */
    const getObjectiveDetails = (objective) => {
        switch (objective.type) {
            case 'playCard':
                if (objective.requiredCard) {
                    return `Play the ${formatCard(objective.requiredCard)}`;
                }
                return 'Play a card';
                
            case 'selectCards':
                if (objective.count) {
                    return `Select ${objective.count} cards`;
                }
                if (objective.specificCards) {
                    const cardList = objective.specificCards.map(formatCard).join(', ');
                    return `Select these cards: ${cardList}`;
                }
                return 'Select cards';
                
            case 'drawCard':
                return 'Draw a card from the deck';
                
            case 'declareSuit':
                if (objective.requiredSuit) {
                    return `Declare ${objective.requiredSuit} as the new suit`;
                }
                return 'Declare a new suit';
                
            case 'gameState':
                return objective.description || 'Achieve specific game state';
                
            default:
                return objective.description || 'Complete objective';
        }
    };

    /**
     * Render objective item
     */
    const renderObjective = (objective, index) => {
        const isCompleted = isObjectiveCompleted(objective.id);
        const isCurrent = getCurrentObjective()?.id === objective.id;
        
        return (
            <div
                key={objective.id}
                ref={el => objectiveRefs.current[index] = el}
                style={{
                    padding: theme.spacing.medium,
                    marginBottom: theme.spacing.small,
                    border: `2px solid ${
                        isCurrent ? theme.colors.info : 
                        isCompleted ? theme.colors.success : 
                        'rgba(0, 0, 0, 0.1)'
                    }`,
                    borderRadius: theme.borderRadius,
                    backgroundColor: isCompleted ? 
                        'rgba(39, 174, 96, 0.1)' : 
                        isCurrent ? 'rgba(52, 152, 219, 0.1)' : 
                        'transparent',
                    transition: 'all 0.3s ease-out',
                    position: 'relative'
                }}
                className={`objective-item ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: theme.spacing.small
                }}>
                    <span style={{
                        fontSize: '18px',
                        flexShrink: 0,
                        animation: isCurrent ? 'objectivePulse 2s infinite' : 'none'
                    }}>
                        {getObjectiveIcon(objective)}
                    </span>
                    
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginBottom: '4px',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            opacity: isCompleted ? 0.7 : 1
                        }}>
                            {objective.description}
                        </div>
                        
                        <div style={{
                            fontSize: '14px',
                            color: theme.colors.secondary,
                            fontStyle: 'italic'
                        }}>
                            {getObjectiveDetails(objective)}
                        </div>
                    </div>
                </div>
                
                {isCurrent && (
                    <div style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        background: theme.colors.info,
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                    }}>
                        Current
                    </div>
                )}
            </div>
        );
    };

    /**
     * Render lesson hints
     */
    const renderHints = () => {
        if (!lesson.hints || lesson.hints.length === 0) {
            return (
                <div style={{
                    textAlign: 'center',
                    color: theme.colors.secondary,
                    fontStyle: 'italic',
                    padding: theme.spacing.medium
                }}>
                    No hints available for this lesson
                </div>
            );
        }
        
        return lesson.hints.map((hint, index) => (
            <div
                key={index}
                style={{
                    padding: theme.spacing.medium,
                    marginBottom: theme.spacing.small,
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    border: `1px solid ${theme.colors.info}`,
                    borderRadius: theme.borderRadius,
                    borderLeft: `4px solid ${theme.colors.info}`
                }}
            >
                <div style={{
                    fontWeight: '600',
                    color: theme.colors.info,
                    marginBottom: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: theme.spacing.small
                }}>
                    💡 {hint.title}
                </div>
                <div style={{
                    color: theme.colors.text,
                    lineHeight: 1.5
                }}>
                    {hint.content}
                </div>
            </div>
        ));
    };

    /**
     * Render section header
     */
    const renderSectionHeader = (title, sectionName, icon = '') => {
        const isExpanded = expandedSections.has(sectionName);
        
        return (
            <button
                onClick={() => toggleSection(sectionName)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: theme.spacing.medium,
                    background: 'none',
                    border: 'none',
                    borderBottom: `1px solid rgba(0, 0, 0, 0.1)`,
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: theme.colors.text,
                    transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                }}
                aria-expanded={isExpanded}
                aria-controls={`section-${sectionName}`}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.small }}>
                    {icon && <span>{icon}</span>}
                    {title}
                </span>
                <span style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                }}>
                    ▼
                </span>
            </button>
        );
    };

    // Don't render if no lesson
    if (!lesson) {
        return null;
    }

    return (
        <>
            {/* CSS Animations */}
            <style jsx>{`
                @keyframes objectivePulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                @keyframes modalSlideIn {
                    from { 
                        transform: translateX(-100%); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateX(0); 
                        opacity: 1; 
                    }
                }
                
                @keyframes modalSlideOut {
                    from { 
                        transform: translateX(0); 
                        opacity: 1; 
                    }
                    to { 
                        transform: translateX(-100%); 
                        opacity: 0; 
                    }
                }
                
                .instruction-modal {
                    position: fixed;
                    top: 20px;
                    left: 20px;
                    width: 380px;
                    max-width: calc(100vw - 40px);
                    max-height: calc(100vh - 40px);
                    background: ${theme.colors.background};
                    border-radius: ${theme.borderRadius};
                    box-shadow: ${theme.boxShadow};
                    z-index: 10000;
                    overflow: hidden;
                    animation: modalSlideIn 0.4s ease-out;
                    border: 2px solid ${theme.colors.info};
                }
                
                .instruction-modal.minimized {
                    width: 60px;
                    height: 60px;
                    overflow: hidden;
                }
                
                .modal-header {
                    background: ${theme.colors.info};
                    color: white;
                    padding: ${theme.spacing.medium};
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-height: 60px;
                }
                
                .modal-content {
                    max-height: calc(70vh - 60px);
                    overflow-y: auto;
                    padding: 0;
                }
                
                .modal-content::-webkit-scrollbar {
                    width: 6px;
                }
                
                .modal-content::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                }
                
                .modal-content::-webkit-scrollbar-thumb {
                    background: ${theme.colors.secondary};
                    border-radius: 3px;
                }
                
                .control-button {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background-color 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                }
                
                .control-button:hover {
                    background-color: rgba(255, 255, 255, 0.2);
                }
                
                .section-content {
                    max-height: 400px;
                    overflow-y: auto;
                    transition: max-height 0.3s ease-out;
                }
                
                .section-content.collapsed {
                    max-height: 0;
                    overflow: hidden;
                }
                
                @media (max-width: 768px) {
                    .instruction-modal {
                        top: 10px;
                        left: 10px;
                        width: calc(100vw - 20px);
                        max-width: none;
                    }
                    
                    .modal-content {
                        max-height: calc(60vh - 60px);
                    }
                }
                
                @media (max-width: 480px) {
                    .instruction-modal {
                        top: 5px;
                        left: 5px;
                        width: calc(100vw - 10px);
                    }
                    
                    .modal-header {
                        padding: ${theme.spacing.small};
                        font-size: 14px;
                    }
                }
            `}</style>

            {/* Main Modal */}
            <div
                ref={modalRef}
                className={`instruction-modal ${isMinimized ? 'minimized' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="instruction-title"
                aria-describedby="instruction-description"
            >
                {/* Modal Header */}
                <div className="modal-header">
                    {!isMinimized && (
                        <>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h2
                                    id="instruction-title"
                                    style={{
                                        margin: 0,
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    📚 {lesson.title}
                                </h2>
                                <div style={{
                                    fontSize: '12px',
                                    opacity: 0.9,
                                    marginTop: '2px'
                                }}>
                                    {lesson.difficulty} • {lesson.estimatedTime}
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '4px', marginLeft: theme.spacing.small }}>
                                <button
                                    className="control-button"
                                    onClick={() => setShowHints(!showHints)}
                                    title="Toggle hints (Ctrl+H)"
                                    aria-label="Toggle hints"
                                >
                                    💡
                                </button>
                                
                                <button
                                    className="control-button"
                                    onClick={() => setIsMinimized(true)}
                                    title="Minimize (Ctrl+M)"
                                    aria-label="Minimize instructions"
                                >
                                    −
                                </button>
                                
                                <button
                                    className="control-button"
                                    onClick={onClose}
                                    title="Close instructions (Esc)"
                                    aria-label="Close instructions"
                                >
                                    ×
                                </button>
                            </div>
                        </>
                    )}
                    
                    {isMinimized && (
                        <button
                            className="control-button"
                            onClick={() => setIsMinimized(false)}
                            title="Restore instructions"
                            aria-label="Restore instructions"
                            style={{ 
                                width: '100%', 
                                height: '100%',
                                fontSize: '20px' 
                            }}
                        >
                            📚
                        </button>
                    )}
                </div>

                {/* Modal Content */}
                {!isMinimized && (
                    <div className="modal-content">
                        {/* Lesson Description */}
                        <div style={{ padding: theme.spacing.medium }}>
                            <p
                                id="instruction-description"
                                style={{
                                    margin: 0,
                                    color: theme.colors.text,
                                    lineHeight: 1.5,
                                    fontSize: '14px'
                                }}
                            >
                                {lesson.description}
                            </p>
                        </div>

                        {/* Objectives Section */}
                        <div>
                            {renderSectionHeader('Objectives', 'objectives', '🎯')}
                            
                            {expandedSections.has('objectives') && (
                                <div
                                    id="section-objectives"
                                    className="section-content"
                                    style={{ padding: theme.spacing.medium }}
                                >
                                    {lesson.objectives.map((objective, index) => 
                                        renderObjective(objective, index)
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Hints Section */}
                        {showHints && (
                            <div>
                                {renderSectionHeader('Hints', 'hints', '💡')}
                                
                                {expandedSections.has('hints') && (
                                    <div
                                        id="section-hints"
                                        className="section-content"
                                        style={{ padding: theme.spacing.medium }}
                                    >
                                        {renderHints()}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Progress Section */}
                        <div>
                            {renderSectionHeader('Progress', 'progress', '📊')}
                            
                            {expandedSections.has('progress') && (
                                <div
                                    id="section-progress"
                                    className="section-content"
                                    style={{ padding: theme.spacing.medium }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: theme.spacing.small
                                    }}>
                                        <span style={{ color: theme.colors.text }}>
                                            Objectives Complete:
                                        </span>
                                        <span style={{
                                            fontWeight: '600',
                                            color: theme.colors.success
                                        }}>
                                            {getCompletedObjectives().length} / {lesson.objectives.length}
                                        </span>
                                    </div>
                                    
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                        borderRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(getCompletedObjectives().length / lesson.objectives.length) * 100}%`,
                                            height: '100%',
                                            backgroundColor: theme.colors.success,
                                            transition: 'width 0.3s ease-out'
                                        }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default InstructionModal;