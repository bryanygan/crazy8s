/**
 * CardMatchingLesson.js - Interactive matching practice
 * Teaches players how to match cards by suit or rank with hands-on practice
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Card matching lesson component for learning Crazy 8's matching rules
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback when lesson is completed
 * @param {Function} props.onProgress - Callback for progress updates
 * @param {Object} props.tutorialEngine - Tutorial engine instance
 * @param {Object} props.theme - Theme configuration
 */
const CardMatchingLesson = ({
    onComplete,
    onProgress,
    tutorialEngine,
    theme
}) => {
    // State management
    const [currentScenario, setCurrentScenario] = useState(0);
    const [selectedCard, setSelectedCard] = useState(null);
    const [attemptedMatches, setAttemptedMatches] = useState([]);
    const [correctMatches, setCorrectMatches] = useState([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackType, setFeedbackType] = useState('success');
    const [celebrationActive, setCelebrationActive] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);
    const [showHint, setShowHint] = useState(false);
    
    // Refs
    const containerRef = useRef(null);
    const topCardRef = useRef(null);
    const handRef = useRef(null);
    
    // Lesson configuration
    const lessonData = {
        id: 'card-matching',
        title: 'Card Matching Practice',
        description: 'Learn how to match cards by suit or rank',
        estimatedTime: '3 minutes',
        difficulty: 'beginner',
        objectives: [
            {
                id: 'match-by-suit',
                description: 'Successfully match a card by suit',
                type: 'practical',
                completed: false
            },
            {
                id: 'match-by-rank',
                description: 'Successfully match a card by rank',
                type: 'practical',
                completed: false
            },
            {
                id: 'understand-rules',
                description: 'Understand when cards can be played',
                type: 'comprehension',
                completed: false
            }
        ]
    };
    
    // Pre-designed scenarios for practice
    const scenarios = [
        {
            id: 'suit-match',
            title: 'Match by Suit',
            description: 'The top card is 5♥. Find cards that match the suit (Hearts ♥).',
            topCard: { rank: '5', suit: '♥', color: 'red' },
            playerHand: [
                { rank: '2', suit: '♠', color: 'black', playable: false },
                { rank: 'J', suit: '♥', color: 'red', playable: true },
                { rank: '9', suit: '♣', color: 'black', playable: false },
                { rank: 'A', suit: '♥', color: 'red', playable: true },
                { rank: '4', suit: '♦', color: 'red', playable: false }
            ],
            correctAnswers: ['J♥', 'A♥'],
            hint: 'Look for cards with Hearts (♥) - they have the same suit as the top card!',
            explanation: 'Great! Cards with the same suit (♥) can be played on each other.'
        },
        {
            id: 'rank-match',
            title: 'Match by Rank', 
            description: 'The top card is K♣. Find cards that match the rank (King).',
            topCard: { rank: 'K', suit: '♣', color: 'black' },
            playerHand: [
                { rank: 'Q', suit: '♠', color: 'black', playable: false },
                { rank: 'K', suit: '♦', color: 'red', playable: true },
                { rank: '7', suit: '♣', color: 'black', playable: false },
                { rank: 'K', suit: '♥', color: 'red', playable: true },
                { rank: '3', suit: '♠', color: 'black', playable: false }
            ],
            correctAnswers: ['K♦', 'K♥'],
            hint: 'Look for other Kings (K) - they have the same rank as the top card!',
            explanation: 'Perfect! Cards with the same rank (K) can be played regardless of suit.'
        },
        {
            id: 'both-matches',
            title: 'Either Suit or Rank',
            description: 'The top card is 7♠. Find ALL cards you can play (matching suit OR rank).',
            topCard: { rank: '7', suit: '♠', color: 'black' },
            playerHand: [
                { rank: '7', suit: '♥', color: 'red', playable: true },
                { rank: 'Q', suit: '♠', color: 'black', playable: true },
                { rank: '2', suit: '♦', color: 'red', playable: false },
                { rank: '7', suit: '♣', color: 'black', playable: true },
                { rank: '8', suit: '♦', color: 'red', playable: true, special: true },
                { rank: 'A', suit: '♠', color: 'black', playable: true }
            ],
            correctAnswers: ['7♥', 'Q♠', '7♣', '8♦', 'A♠'],
            hint: 'Find cards that match either the suit (♠) OR the rank (7). Plus, 8s are always playable!',
            explanation: 'Excellent! You found all playable cards: same suit, same rank, AND the wild 8!'
        }
    ];
    
    /**
     * Initialize lesson
     */
    useEffect(() => {
        onProgress({
            lessonId: lessonData.id,
            progress: 0,
            currentScenario: scenarios[0]
        });
    }, []);
    
    /**
     * Handle card selection
     */
    const handleCardClick = (card) => {
        if (selectedCard?.id === card.id) {
            setSelectedCard(null);
            return;
        }
        
        setSelectedCard(card);
        
        // Auto-submit after selection for better UX
        setTimeout(() => {
            handlePlayCard(card);
        }, 500);
    };
    
    /**
     * Handle playing a card
     */
    const handlePlayCard = (card) => {
        const scenario = scenarios[currentScenario];
        const cardId = `${card.rank}${card.suit}`;
        
        // Track attempt
        const newAttempt = {
            cardId,
            correct: card.playable,
            timestamp: Date.now()
        };
        
        setAttemptedMatches(prev => [...prev, newAttempt]);
        
        if (card.playable) {
            // Correct match
            setCorrectMatches(prev => [...prev, cardId]);
            setFeedbackMessage(getSuccessMessage(card, scenario));
            setFeedbackType('success');
            setCelebrationActive(true);
            
            // Check if scenario is complete
            const allCorrectFound = scenario.correctAnswers.every(answer => 
                [...correctMatches, cardId].includes(answer)
            );
            
            if (allCorrectFound) {
                setTimeout(() => {
                    completeScenario();
                }, 1500);
            }
        } else {
            // Incorrect match
            setFeedbackMessage(getErrorMessage(card, scenario));
            setFeedbackType('error');
        }
        
        setShowFeedback(true);
        setSelectedCard(null);
        
        // Hide feedback after delay
        setTimeout(() => {
            setShowFeedback(false);
            setCelebrationActive(false);
        }, 3000);
    };
    
    /**
     * Get success message for correct match
     */
    const getSuccessMessage = (card, scenario) => {
        const topCard = scenario.topCard;
        
        if (card.special) {
            return `🎱 Great! 8s are wild cards - they can be played anytime!`;
        } else if (card.suit === topCard.suit && card.rank === topCard.rank) {
            return `🎉 Perfect! ${card.rank}${card.suit} matches both suit AND rank!`;
        } else if (card.suit === topCard.suit) {
            return `✅ Excellent! ${card.rank}${card.suit} matches the suit (${card.suit})!`;
        } else if (card.rank === topCard.rank) {
            return `✅ Great! ${card.rank}${card.suit} matches the rank (${card.rank})!`;
        }
        
        return `✅ Well done! That's a valid play!`;
    };
    
    /**
     * Get error message for incorrect match
     */
    const getErrorMessage = (card, scenario) => {
        const topCard = scenario.topCard;
        
        return `❌ ${card.rank}${card.suit} doesn't match ${topCard.rank}${topCard.suit}. Try matching the suit (${topCard.suit}) or rank (${topCard.rank}).`;
    };
    
    /**
     * Complete current scenario
     */
    const completeScenario = () => {
        if (currentScenario < scenarios.length - 1) {
            // Move to next scenario
            const nextScenario = currentScenario + 1;
            setCurrentScenario(nextScenario);
            setSelectedCard(null);
            setAttemptedMatches([]);
            setCorrectMatches([]);
            setShowFeedback(false);
            
            onProgress({
                lessonId: lessonData.id,
                progress: ((nextScenario + 1) / scenarios.length) * 100,
                currentScenario: scenarios[nextScenario],
                scenariosCompleted: nextScenario
            });
        } else {
            // Complete lesson
            completeLesson();
        }
    };
    
    /**
     * Complete the entire lesson
     */
    const completeLesson = () => {
        const completedObjectives = lessonData.objectives.map(obj => ({
            ...obj,
            completed: true
        }));
        
        const score = calculateScore();
        
        onComplete({
            lessonId: lessonData.id,
            completed: true,
            objectives: completedObjectives,
            score,
            hintsUsed,
            attempts: attemptedMatches.length,
            scenariosCompleted: scenarios.length
        });
    };
    
    /**
     * Calculate lesson score based on performance
     */
    const calculateScore = () => {
        const totalAttempts = attemptedMatches.length;
        const correctAttempts = attemptedMatches.filter(a => a.correct).length;
        const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 100;
        const hintPenalty = hintsUsed * 5;
        
        return Math.max(50, Math.min(100, Math.round(accuracy - hintPenalty)));
    };
    
    /**
     * Show hint for current scenario
     */
    const handleShowHint = () => {
        setShowHint(true);
        setHintsUsed(prev => prev + 1);
        
        setTimeout(() => {
            setShowHint(false);
        }, 5000);
    };
    
    /**
     * Reset current scenario
     */
    const handleResetScenario = () => {
        setSelectedCard(null);
        setAttemptedMatches([]);
        setCorrectMatches([]);
        setShowFeedback(false);
        setCelebrationActive(false);
    };
    
    /**
     * Render a card component
     */
    const renderCard = (card, isTopCard = false, isInHand = false) => {
        const cardId = `${card.rank}${card.suit}`;
        const isSelected = selectedCard?.id === card.id;
        const isCorrect = correctMatches.includes(cardId);
        const wasAttempted = attemptedMatches.some(a => a.cardId === cardId);
        
        const cardStyle = {
            width: isTopCard ? '80px' : '70px',
            height: isTopCard ? '112px' : '98px',
            background: 'white',
            border: card.special ? '3px solid #f39c12' : 
                    isSelected ? `3px solid ${theme.colors.info}` :
                    isCorrect ? `3px solid ${theme.colors.success}` :
                    '2px solid #ddd',
            borderRadius: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isTopCard ? '16px' : '14px',
            fontWeight: 'bold',
            color: card.color,
            cursor: isInHand ? 'pointer' : 'default',
            transition: 'all 0.3s ease',
            position: 'relative',
            boxShadow: isSelected ? `0 0 15px ${theme.colors.info}` :
                      isCorrect ? `0 0 15px ${theme.colors.success}` :
                      card.special ? '0 4px 15px rgba(243, 156, 18, 0.3)' :
                      '0 2px 8px rgba(0, 0, 0, 0.1)',
            transform: isSelected ? 'translateY(-10px) scale(1.05)' :
                      isCorrect && celebrationActive ? 'scale(1.1)' : 'scale(1)',
            animation: isCorrect && celebrationActive ? 'cardCelebration 1s ease-out' : 'none'
        };
        
        return (
            <div
                key={cardId}
                style={cardStyle}
                onClick={() => isInHand && handleCardClick(card)}
                onMouseEnter={(e) => {
                    if (isInHand && !isSelected && !isCorrect) {
                        e.target.style.transform = 'translateY(-5px) scale(1.02)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (isInHand && !isSelected && !isCorrect) {
                        e.target.style.transform = 'scale(1)';
                    }
                }}
                title={isInHand ? 'Click to play this card' : ''}
            >
                <div style={{ fontSize: isTopCard ? '14px' : '12px' }}>{card.rank}</div>
                <div style={{ fontSize: isTopCard ? '24px' : '20px', margin: '4px 0' }}>
                    {card.suit}
                </div>
                <div style={{ 
                    fontSize: isTopCard ? '14px' : '12px', 
                    transform: 'rotate(180deg)' 
                }}>
                    {card.rank}
                </div>
                
                {/* Special indicators */}
                {card.special && (
                    <div style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: theme.colors.warning,
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}>
                        ★
                    </div>
                )}
                
                {/* Correct indicator */}
                {isCorrect && (
                    <div style={{
                        position: 'absolute',
                        top: '-5px',
                        left: '-5px',
                        background: theme.colors.success,
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px'
                    }}>
                        ✓
                    </div>
                )}
            </div>
        );
    };
    
    const scenario = scenarios[currentScenario];
    
    return (
        <>
            {/* CSS Animations */}
            <style jsx>{`
                @keyframes cardCelebration {
                    0%, 100% { transform: scale(1); }
                    25% { transform: scale(1.1) rotate(5deg); }
                    50% { transform: scale(1.15) rotate(-5deg); }
                    75% { transform: scale(1.1) rotate(5deg); }
                }
                
                @keyframes feedbackSlideIn {
                    from { 
                        transform: translateY(-20px); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateY(0); 
                        opacity: 1; 
                    }
                }
                
                @keyframes scenarioFadeIn {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                
                @keyframes hintPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                
                .matching-lesson {
                    animation: scenarioFadeIn 0.6s ease-out;
                }
                
                .feedback-popup {
                    animation: feedbackSlideIn 0.4s ease-out;
                }
                
                .hint-box {
                    animation: hintPulse 2s infinite;
                }
                
                @media (max-width: 768px) {
                    .card-hand {
                        flex-wrap: wrap !important;
                        justify-content: center !important;
                    }
                    
                    .lesson-card {
                        width: 60px !important;
                        height: 84px !important;
                        font-size: 12px !important;
                    }
                }
            `}</style>
            
            {/* Main Lesson Container */}
            <div
                ref={containerRef}
                className="matching-lesson"
                style={{
                    padding: theme.spacing.xlarge,
                    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.05), rgba(39, 174, 96, 0.05))',
                    borderRadius: theme.borderRadius,
                    minHeight: '600px',
                    position: 'relative'
                }}
            >
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: theme.spacing.xlarge
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        color: theme.colors.primary,
                        margin: `0 0 ${theme.spacing.small} 0`
                    }}>
                        {scenario.title}
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: theme.colors.text,
                        margin: 0,
                        maxWidth: '600px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }}>
                        {scenario.description}
                    </p>
                </div>
                
                {/* Game Area */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: theme.spacing.xlarge
                }}>
                    {/* Top Card (Discard Pile) */}
                    <div style={{
                        textAlign: 'center'
                    }}>
                        <h3 style={{
                            fontSize: '18px',
                            color: theme.colors.secondary,
                            marginBottom: theme.spacing.medium
                        }}>
                            🃏 Top Card (Discard Pile)
                        </h3>
                        <div ref={topCardRef}>
                            {renderCard(scenario.topCard, true)}
                        </div>
                    </div>
                    
                    {/* Player Hand */}
                    <div style={{
                        textAlign: 'center',
                        width: '100%'
                    }}>
                        <h3 style={{
                            fontSize: '18px',
                            color: theme.colors.secondary,
                            marginBottom: theme.spacing.medium
                        }}>
                            🎴 Your Hand - Click cards you can play!
                        </h3>
                        <div 
                            ref={handRef}
                            className="card-hand"
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: theme.spacing.medium,
                                flexWrap: 'wrap'
                            }}
                        >
                            {scenario.playerHand.map((card, index) => (
                                <div key={index} style={{ position: 'relative' }}>
                                    {renderCard({...card, id: `hand-${index}`}, false, true)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Feedback */}
                {showFeedback && (
                    <div
                        className="feedback-popup"
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: feedbackType === 'success' ? 
                                'rgba(39, 174, 96, 0.95)' : 
                                'rgba(231, 76, 60, 0.95)',
                            color: 'white',
                            padding: theme.spacing.large,
                            borderRadius: theme.borderRadius,
                            fontSize: '18px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            boxShadow: theme.boxShadow,
                            zIndex: 1000,
                            maxWidth: '400px'
                        }}
                    >
                        {feedbackMessage}
                    </div>
                )}
                
                {/* Hint */}
                {showHint && (
                    <div
                        className="hint-box"
                        style={{
                            position: 'absolute',
                            bottom: theme.spacing.large,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            background: 'rgba(243, 156, 18, 0.95)',
                            color: 'white',
                            padding: theme.spacing.medium,
                            borderRadius: theme.borderRadius,
                            fontSize: '16px',
                            textAlign: 'center',
                            boxShadow: theme.boxShadow,
                            maxWidth: '500px'
                        }}
                    >
                        💡 <strong>Hint:</strong> {scenario.hint}
                    </div>
                )}
                
                {/* Controls */}
                <div style={{
                    position: 'absolute',
                    top: theme.spacing.medium,
                    right: theme.spacing.medium,
                    display: 'flex',
                    gap: theme.spacing.small
                }}>
                    <button
                        onClick={handleShowHint}
                        style={{
                            padding: '8px 12px',
                            background: theme.colors.warning,
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                        title="Show hint"
                    >
                        💡 Hint
                    </button>
                    
                    <button
                        onClick={handleResetScenario}
                        style={{
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: `1px solid ${theme.colors.secondary}`,
                            borderRadius: '6px',
                            color: theme.colors.text,
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                        title="Reset scenario"
                    >
                        🔄 Reset
                    </button>
                </div>
                
                {/* Progress */}
                <div style={{
                    position: 'absolute',
                    bottom: theme.spacing.medium,
                    left: theme.spacing.medium,
                    fontSize: '14px',
                    color: theme.colors.secondary
                }}>
                    Scenario {currentScenario + 1} of {scenarios.length}
                </div>
            </div>
        </>
    );
};

export default CardMatchingLesson;