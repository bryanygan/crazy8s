/**
 * DrawingCardsLesson.js - Learn when and how to draw
 * Teaches players the drawing mechanics and when drawing is required
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Drawing cards lesson component for learning when and how to draw cards
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback when lesson is completed
 * @param {Function} props.onProgress - Callback for progress updates
 * @param {Object} props.tutorialEngine - Tutorial engine instance
 * @param {Object} props.theme - Theme configuration
 */
const DrawingCardsLesson = ({
    onComplete,
    onProgress,
    tutorialEngine,
    theme
}) => {
    // State management
    const [currentPhase, setCurrentPhase] = useState('explanation');
    const [playerHand, setPlayerHand] = useState([]);
    const [topCard, setTopCard] = useState(null);
    const [deckCards, setDeckCards] = useState(0);
    const [drawCount, setDrawCount] = useState(0);
    const [canPlay, setCanPlay] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackType, setFeedbackType] = useState('info');
    const [animatingDraw, setAnimatingDraw] = useState(false);
    const [completedObjectives, setCompletedObjectives] = useState(new Set());
    const [hintsUsed, setHintsUsed] = useState(0);
    
    // Refs
    const containerRef = useRef(null);
    const deckRef = useRef(null);
    const handRef = useRef(null);
    
    // Lesson configuration
    const lessonData = {
        id: 'drawing-cards',
        title: 'Drawing Cards',
        description: 'Learn when and how to draw cards from the deck',
        estimatedTime: '3 minutes',
        difficulty: 'beginner',
        objectives: [
            {
                id: 'understand-when-to-draw',
                description: 'Understand when you must draw cards',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'practice-drawing',
                description: 'Successfully draw cards from the deck',
                type: 'practical',
                completed: false
            },
            {
                id: 'find-playable-card',
                description: 'Draw until you find a playable card',
                type: 'practical',
                completed: false
            }
        ]
    };
    
    // Pre-designed scenarios
    const scenarios = [
        {
            id: 'no-playable-cards',
            title: 'No Playable Cards',
            description: 'You have no cards that match the top card. You must draw!',
            topCard: { rank: '3', suit: '♥', color: 'red' },
            initialHand: [
                { rank: 'J', suit: '♠', color: 'black', playable: false },
                { rank: '5', suit: '♣', color: 'black', playable: false },
                { rank: 'A', suit: '♠', color: 'black', playable: false },
                { rank: '9', suit: '♦', color: 'red', playable: false }
            ],
            deckCards: [
                { rank: '7', suit: '♣', color: 'black', playable: false },
                { rank: 'K', suit: '♠', color: 'black', playable: false },
                { rank: '3', suit: '♠', color: 'black', playable: true }
            ],
            explanation: 'When you have no playable cards, you must keep drawing until you get one you can play!'
        }
    ];
    
    /**
     * Initialize lesson
     */
    useEffect(() => {
        initializeScenario();
        onProgress({
            lessonId: lessonData.id,
            progress: 0,
            phase: 'explanation'
        });
    }, []);
    
    /**
     * Initialize the drawing scenario
     */
    const initializeScenario = () => {
        const scenario = scenarios[0];
        setTopCard(scenario.topCard);
        setPlayerHand(scenario.initialHand.map((card, index) => ({
            ...card,
            id: `hand-${index}`
        })));
        setDeckCards(scenario.deckCards.length);
        setDrawCount(0);
        setCanPlay(false);
    };
    
    /**
     * Handle drawing a card
     */
    const handleDrawCard = async () => {
        if (animatingDraw || deckCards <= 0) return;
        
        setAnimatingDraw(true);
        
        // Simulate drawing animation
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const scenario = scenarios[0];
        const drawnCard = scenario.deckCards[drawCount];
        
        if (drawnCard) {
            // Add card to hand
            const newCard = {
                ...drawnCard,
                id: `drawn-${drawCount}`,
                isNew: true
            };
            
            setPlayerHand(prev => [...prev, newCard]);
            setDeckCards(prev => prev - 1);
            setDrawCount(prev => prev + 1);
            
            // Check if drawn card is playable
            if (drawnCard.playable) {
                setCanPlay(true);
                setFeedbackMessage(`🎉 Great! You drew a ${drawnCard.rank}${drawnCard.suit} - this matches the top card! You can play it now.`);
                setFeedbackType('success');
                
                // Mark objective as complete
                const newCompleted = new Set(completedObjectives);
                newCompleted.add('practice-drawing');
                newCompleted.add('find-playable-card');
                setCompletedObjectives(newCompleted);
                
                setTimeout(() => {
                    completeLesson();
                }, 3000);
            } else {
                setFeedbackMessage(`You drew ${drawnCard.rank}${drawnCard.suit}. This doesn't match ${topCard.rank}${topCard.suit}, so draw again!`);
                setFeedbackType('info');
            }
            
            setShowFeedback(true);
            setTimeout(() => setShowFeedback(false), 3000);
        }
        
        setAnimatingDraw(false);
    };
    
    /**
     * Handle clicking on explanation phase
     */
    const handleStartPractice = () => {
        setCurrentPhase('practice');
        const newCompleted = new Set(completedObjectives);
        newCompleted.add('understand-when-to-draw');
        setCompletedObjectives(newCompleted);
        
        onProgress({
            lessonId: lessonData.id,
            progress: 33,
            phase: 'practice'
        });
    };
    
    /**
     * Complete the lesson
     */
    const completeLesson = () => {
        const completedObjectivesList = lessonData.objectives.map(obj => ({
            ...obj,
            completed: completedObjectives.has(obj.id)
        }));
        
        const score = calculateScore();
        
        onComplete({
            lessonId: lessonData.id,
            completed: true,
            objectives: completedObjectivesList,
            score,
            hintsUsed,
            cardsDrawn: drawCount
        });
    };
    
    /**
     * Calculate lesson score
     */
    const calculateScore = () => {
        const baseScore = 100;
        const drawPenalty = Math.max(0, (drawCount - 2) * 10); // Penalty for drawing more than 2 cards
        const hintPenalty = hintsUsed * 5;
        
        return Math.max(60, baseScore - drawPenalty - hintPenalty);
    };
    
    /**
     * Show hint
     */
    const handleShowHint = () => {
        setHintsUsed(prev => prev + 1);
        
        if (currentPhase === 'explanation') {
            setFeedbackMessage('💡 Click "Start Practice" to begin the drawing exercise!');
        } else if (!canPlay) {
            setFeedbackMessage('💡 Click the deck to draw cards. Keep drawing until you get one that matches the top card!');
        } else {
            setFeedbackMessage('💡 You found a playable card! The lesson will complete automatically.');
        }
        
        setFeedbackType('info');
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 4000);
    };
    
    /**
     * Render a card component
     */
    const renderCard = (card, isTopCard = false, isNew = false) => {
        const cardStyle = {
            width: isTopCard ? '80px' : '60px',
            height: isTopCard ? '112px' : '84px',
            background: 'white',
            border: isNew ? `3px solid ${theme.colors.success}` :
                    card.playable ? `3px solid ${theme.colors.info}` :
                    '2px solid #ddd',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isTopCard ? '16px' : '12px',
            fontWeight: 'bold',
            color: card.color,
            boxShadow: isNew ? `0 0 15px ${theme.colors.success}` :
                      card.playable ? `0 0 10px ${theme.colors.info}` :
                      '0 2px 8px rgba(0, 0, 0, 0.1)',
            animation: isNew ? 'cardDrawIn 0.8s ease-out' : 'none',
            transform: isNew ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.3s ease'
        };
        
        return (
            <div style={cardStyle}>
                <div style={{ fontSize: isTopCard ? '14px' : '10px' }}>{card.rank}</div>
                <div style={{ fontSize: isTopCard ? '24px' : '18px', margin: '2px 0' }}>
                    {card.suit}
                </div>
                <div style={{ 
                    fontSize: isTopCard ? '14px' : '10px', 
                    transform: 'rotate(180deg)' 
                }}>
                    {card.rank}
                </div>
                
                {isNew && (
                    <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: theme.colors.success,
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>
                        +
                    </div>
                )}
            </div>
        );
    };
    
    /**
     * Render deck pile
     */
    const renderDeck = () => {
        return (
            <div
                ref={deckRef}
                onClick={currentPhase === 'practice' ? handleDrawCard : undefined}
                style={{
                    width: '80px',
                    height: '112px',
                    background: 'linear-gradient(135deg, #2c3e50, #34495e)',
                    border: `3px solid ${currentPhase === 'practice' ? theme.colors.info : '#ddd'}`,
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: currentPhase === 'practice' ? 'pointer' : 'default',
                    position: 'relative',
                    boxShadow: currentPhase === 'practice' ? 
                        `0 0 15px ${theme.colors.info}` : 
                        '0 4px 8px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s ease',
                    transform: animatingDraw ? 'scale(0.95)' : 'scale(1)',
                    animation: currentPhase === 'practice' && !canPlay ? 'deckPulse 2s infinite' : 'none'
                }}
                onMouseEnter={(e) => {
                    if (currentPhase === 'practice') {
                        e.target.style.transform = 'scale(1.05)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (currentPhase === 'practice') {
                        e.target.style.transform = 'scale(1)';
                    }
                }}
                title={currentPhase === 'practice' ? 'Click to draw a card' : 'Draw pile'}
            >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>🂠</div>
                <div style={{ fontSize: '12px' }}>{deckCards} cards</div>
                
                {/* Draw animation overlay */}
                {animatingDraw && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(52, 152, 219, 0.8)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'drawingEffect 0.8s ease-out'
                    }}>
                        <div style={{ fontSize: '16px' }}>✨</div>
                    </div>
                )}
            </div>
        );
    };
    
    /**
     * Render explanation phase
     */
    const renderExplanation = () => {
        return (
            <div style={{
                textAlign: 'center',
                maxWidth: '600px',
                margin: '0 auto',
                animation: 'explanationFadeIn 0.8s ease-out'
            }}>
                <h2 style={{
                    fontSize: '28px',
                    color: theme.colors.primary,
                    marginBottom: theme.spacing.large
                }}>
                    📥 When to Draw Cards
                </h2>
                
                <div style={{
                    background: 'rgba(52, 152, 219, 0.1)',
                    border: `2px solid ${theme.colors.info}`,
                    borderRadius: theme.borderRadius,
                    padding: theme.spacing.large,
                    marginBottom: theme.spacing.large
                }}>
                    <h3 style={{
                        fontSize: '20px',
                        color: theme.colors.info,
                        marginBottom: theme.spacing.medium
                    }}>
                        📋 The Drawing Rule
                    </h3>
                    <p style={{
                        fontSize: '16px',
                        lineHeight: 1.6,
                        color: theme.colors.text,
                        margin: 0
                    }}>
                        If you can't play any cards from your hand, you <strong>must draw cards</strong> from 
                        the deck until you get one you can play. Once you draw a playable card, you can 
                        choose to play it or pass your turn.
                    </p>
                </div>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: theme.spacing.medium,
                    marginBottom: theme.spacing.xlarge
                }}>
                    <div style={{
                        background: 'rgba(39, 174, 96, 0.1)',
                        border: `2px solid ${theme.colors.success}`,
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium,
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                        <h4 style={{ 
                            color: theme.colors.success, 
                            marginBottom: '8px',
                            fontSize: '16px'
                        }}>
                            Can Play
                        </h4>
                        <p style={{ 
                            fontSize: '14px', 
                            color: theme.colors.text,
                            margin: 0
                        }}>
                            You have cards that match the top card by suit or rank
                        </p>
                    </div>
                    
                    <div style={{
                        background: 'rgba(231, 76, 60, 0.1)',
                        border: `2px solid ${theme.colors.error}`,
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium,
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📥</div>
                        <h4 style={{ 
                            color: theme.colors.error, 
                            marginBottom: '8px',
                            fontSize: '16px'
                        }}>
                            Must Draw
                        </h4>
                        <p style={{ 
                            fontSize: '14px', 
                            color: theme.colors.text,
                            margin: 0
                        }}>
                            No matching cards in hand - keep drawing until you get one!
                        </p>
                    </div>
                </div>
                
                <button
                    onClick={handleStartPractice}
                    style={{
                        padding: '12px 24px',
                        background: theme.colors.info,
                        border: 'none',
                        borderRadius: theme.borderRadius,
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        animation: 'startButtonPulse 2s infinite'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    🚀 Start Practice
                </button>
            </div>
        );
    };
    
    /**
     * Render practice phase
     */
    const renderPractice = () => {
        return (
            <div style={{
                animation: 'practiceSlideIn 0.6s ease-out'
            }}>
                <div style={{
                    textAlign: 'center',
                    marginBottom: theme.spacing.xlarge
                }}>
                    <h2 style={{
                        fontSize: '24px',
                        color: theme.colors.primary,
                        marginBottom: theme.spacing.small
                    }}>
                        🎯 Drawing Practice
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: theme.colors.text,
                        margin: 0
                    }}>
                        You have no playable cards. Click the deck to draw until you find one!
                    </p>
                </div>
                
                {/* Game Area */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: theme.spacing.xlarge,
                    marginBottom: theme.spacing.xlarge
                }}>
                    {/* Deck */}
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{
                            fontSize: '16px',
                            color: theme.colors.secondary,
                            marginBottom: theme.spacing.medium
                        }}>
                            🂠 Draw Pile
                        </h3>
                        {renderDeck()}
                    </div>
                    
                    {/* Arrow */}
                    <div style={{
                        fontSize: '30px',
                        animation: 'arrowBounce 1s infinite',
                        color: theme.colors.info
                    }}>
                        👆
                    </div>
                    
                    {/* Top Card */}
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{
                            fontSize: '16px',
                            color: theme.colors.secondary,
                            marginBottom: theme.spacing.medium
                        }}>
                            🃏 Top Card
                        </h3>
                        {topCard && renderCard(topCard, true)}
                    </div>
                </div>
                
                {/* Player Hand */}
                <div style={{ textAlign: 'center' }}>
                    <h3 style={{
                        fontSize: '18px',
                        color: theme.colors.secondary,
                        marginBottom: theme.spacing.medium
                    }}>
                        🎴 Your Hand ({playerHand.length} cards)
                    </h3>
                    <div 
                        ref={handRef}
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                            minHeight: '100px'
                        }}
                    >
                        {playerHand.map((card, index) => (
                            <div key={card.id}>
                                {renderCard(card, false, card.isNew)}
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Stats */}
                <div style={{
                    position: 'absolute',
                    bottom: theme.spacing.medium,
                    left: theme.spacing.medium,
                    background: 'rgba(0, 0, 0, 0.1)',
                    padding: theme.spacing.small,
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: theme.colors.secondary
                }}>
                    Cards drawn: {drawCount}
                </div>
            </div>
        );
    };
    
    return (
        <>
            {/* CSS Animations */}
            <style jsx>{`
                @keyframes explanationFadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes practiceSlideIn {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                
                @keyframes startButtonPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                @keyframes deckPulse {
                    0%, 100% { box-shadow: 0 0 15px rgba(52, 152, 219, 0.3); }
                    50% { box-shadow: 0 0 25px rgba(52, 152, 219, 0.6); }
                }
                
                @keyframes cardDrawIn {
                    from { 
                        transform: translateY(-50px) scale(0.5); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateY(0) scale(1.05); 
                        opacity: 1; 
                    }
                }
                
                @keyframes drawingEffect {
                    0% { opacity: 0; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.1); }
                    100% { opacity: 0; transform: scale(1); }
                }
                
                @keyframes arrowBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                
                @media (max-width: 768px) {
                    .game-area {
                        flex-direction: column !important;
                        gap: 20px !important;
                    }
                    
                    .card-hand {
                        gap: 4px !important;
                    }
                }
            `}</style>
            
            {/* Main Container */}
            <div
                ref={containerRef}
                style={{
                    padding: theme.spacing.xlarge,
                    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.05), rgba(155, 89, 182, 0.05))',
                    borderRadius: theme.borderRadius,
                    minHeight: '600px',
                    position: 'relative'
                }}
            >
                {/* Content based on phase */}
                {currentPhase === 'explanation' && renderExplanation()}
                {currentPhase === 'practice' && renderPractice()}
                
                {/* Feedback */}
                {showFeedback && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: feedbackType === 'success' ? 
                            'rgba(39, 174, 96, 0.95)' : 
                            feedbackType === 'error' ?
                            'rgba(231, 76, 60, 0.95)' :
                            'rgba(52, 152, 219, 0.95)',
                        color: 'white',
                        padding: theme.spacing.medium,
                        borderRadius: theme.borderRadius,
                        fontSize: '16px',
                        textAlign: 'center',
                        boxShadow: theme.boxShadow,
                        zIndex: 1000,
                        maxWidth: '500px',
                        animation: 'feedbackSlideDown 0.4s ease-out'
                    }}>
                        {feedbackMessage}
                    </div>
                )}
                
                {/* Hint Button */}
                <button
                    onClick={handleShowHint}
                    style={{
                        position: 'absolute',
                        top: theme.spacing.medium,
                        right: theme.spacing.medium,
                        padding: '8px 12px',
                        background: theme.colors.warning,
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}
                    title="Show hint"
                >
                    💡 Hint
                </button>
            </div>
        </>
    );
};

export default DrawingCardsLesson;