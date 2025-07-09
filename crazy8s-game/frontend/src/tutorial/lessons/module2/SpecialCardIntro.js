/**
 * SpecialCardIntro.js - Overview of special cards
 * Introduces all 5 special cards and their unique powers
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Special card introduction lesson component
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback when lesson is completed
 * @param {Function} props.onProgress - Callback for progress updates
 * @param {Object} props.tutorialEngine - Tutorial engine instance
 * @param {Object} props.theme - Theme configuration
 */
const SpecialCardIntro = ({
    onComplete,
    onProgress,
    tutorialEngine,
    theme
}) => {
    // State management
    const [currentCard, setCurrentCard] = useState(0);
    const [animationPhase, setAnimationPhase] = useState('intro');
    const [cardsRevealed, setCardsRevealed] = useState(new Set());
    const [showDetails, setShowDetails] = useState(false);
    const [completedOverviews, setCompletedOverviews] = useState(new Set());
    const [interactionCount, setInteractionCount] = useState(0);
    
    // Refs
    const containerRef = useRef(null);
    const cardRefs = useRef([]);
    
    // Lesson configuration
    const lessonData = {
        id: 'special-card-intro',
        title: 'Special Cards Overview',
        description: 'Discover the 5 special cards that change the game',
        estimatedTime: '2 minutes',
        difficulty: 'beginner',
        objectives: [
            {
                id: 'learn-special-cards',
                description: 'Learn about all 5 special cards',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'understand-effects',
                description: 'Understand each card\'s unique effect',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'ready-for-practice',
                description: 'Feel ready to practice with special cards',
                type: 'engagement',
                completed: false
            }
        ]
    };
    
    // Special cards configuration
    const specialCards = [
        {
            id: 'jack',
            rank: 'J',
            name: 'Jack',
            suits: ['♠', '♥', '♣', '♦'],
            colors: ['black', 'red', 'black', 'red'],
            power: 'Skip',
            shortDescription: 'Skip next player',
            fullDescription: 'Forces the next player to skip their turn completely',
            icon: '⏭️',
            color: '#e74c3c',
            details: 'In 2-player games, Jack lets you play again immediately!',
            examples: ['Player skips turn', 'Turn continues clockwise', 'No drawing required']
        },
        {
            id: 'queen',
            rank: 'Q',
            name: 'Queen',
            suits: ['♠', '♥', '♣', '♦'],
            colors: ['black', 'red', 'black', 'red'],
            power: 'Reverse',
            shortDescription: 'Reverse turn direction',
            fullDescription: 'Changes the direction of play from clockwise to counter-clockwise or vice versa',
            icon: '🔄',
            color: '#9b59b6',
            details: 'In 2-player games, Queen acts like a Skip (you play again)!',
            examples: ['Direction reverses', 'Turn order changes', 'Strategic timing matters']
        },
        {
            id: 'ace',
            rank: 'A',
            name: 'Ace',
            suits: ['♠', '♥', '♣', '♦'],
            colors: ['black', 'red', 'black', 'red'],
            power: 'Draw 4',
            shortDescription: 'Next player draws 4',
            fullDescription: 'Forces the next player to draw 4 cards from the deck',
            icon: '📚',
            color: '#f39c12',
            details: 'Can be countered by another Ace to stack the draw amount!',
            examples: ['Player draws 4 cards', 'Turn skipped', 'Stackable with other Aces']
        },
        {
            id: 'two',
            rank: '2',
            name: 'Two',
            suits: ['♠', '♥', '♣', '♦'],
            colors: ['black', 'red', 'black', 'red'],
            power: 'Draw 2',
            shortDescription: 'Next player draws 2',
            fullDescription: 'Forces the next player to draw 2 cards from the deck',
            icon: '📖',
            color: '#3498db',
            details: 'Can be stacked with other 2s to increase the draw amount!',
            examples: ['Player draws 2 cards', 'Turn skipped', 'Stackable with other 2s']
        },
        {
            id: 'eight',
            rank: '8',
            name: 'Eight',
            suits: ['♠', '♥', '♣', '♦'],
            colors: ['black', 'red', 'black', 'red'],
            power: 'Wild',
            shortDescription: 'Change suit',
            fullDescription: 'Can be played on any card and lets you declare the new suit',
            icon: '🎱',
            color: '#27ae60',
            details: 'The most powerful card - always playable and gives you control!',
            examples: ['Play on any card', 'Choose new suit', 'Game-changing power']
        }
    ];
    
    /**
     * Initialize lesson
     */
    useEffect(() => {
        onProgress({
            lessonId: lessonData.id,
            progress: 0,
            phase: 'intro'
        });
        
        // Start introduction sequence
        setTimeout(() => {
            setAnimationPhase('cards-reveal');
            revealCards();
        }, 1000);
    }, []);
    
    /**
     * Reveal cards one by one
     */
    const revealCards = async () => {
        for (let i = 0; i < specialCards.length; i++) {
            await new Promise(resolve => {
                setTimeout(() => {
                    setCardsRevealed(prev => new Set([...prev, i]));
                    resolve();
                }, i * 600);
            });
        }
        
        // After all cards revealed, allow interaction
        setTimeout(() => {
            setAnimationPhase('interactive');
        }, 1000);
    };
    
    /**
     * Handle card click for detailed view
     */
    const handleCardClick = (cardIndex) => {
        setCurrentCard(cardIndex);
        setShowDetails(true);
        setInteractionCount(prev => prev + 1);
        
        // Mark as viewed
        setCompletedOverviews(prev => new Set([...prev, cardIndex]));
        
        // Update progress
        const progress = ((cardIndex + 1) / specialCards.length) * 80;
        onProgress({
            lessonId: lessonData.id,
            progress,
            currentCard: specialCards[cardIndex],
            cardsViewed: completedOverviews.size + 1
        });
    };
    
    /**
     * Close detailed view
     */
    const handleCloseDetails = () => {
        setShowDetails(false);
    };
    
    /**
     * Complete the lesson
     */
    const handleComplete = () => {
        const completedObjectives = lessonData.objectives.map(obj => ({
            ...obj,
            completed: true
        }));
        
        onComplete({
            lessonId: lessonData.id,
            completed: true,
            objectives: completedObjectives,
            score: calculateScore(),
            cardsViewed: completedOverviews.size,
            interactions: interactionCount
        });
    };
    
    /**
     * Calculate lesson score
     */
    const calculateScore = () => {
        const baseScore = 100;
        const viewedBonus = (completedOverviews.size / specialCards.length) * 20;
        const interactionBonus = Math.min(interactionCount * 5, 30);
        
        return Math.min(100, Math.round(baseScore + viewedBonus + interactionBonus));
    };
    
    /**
     * Render a special card
     */
    const renderSpecialCard = (card, index) => {
        const isRevealed = cardsRevealed.has(index);
        const isViewed = completedOverviews.has(index);
        const isSelected = currentCard === index && showDetails;
        
        if (!isRevealed) {
            return (
                <div
                    key={card.id}
                    style={{
                        width: '120px',
                        height: '168px',
                        background: 'linear-gradient(135deg, #2c3e50, #34495e)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                        opacity: 0.3
                    }}
                >
                    🂠
                </div>
            );
        }
        
        return (
            <div
                key={card.id}
                ref={el => cardRefs.current[index] = el}
                onClick={() => animationPhase === 'interactive' && handleCardClick(index)}
                style={{
                    width: '120px',
                    height: '168px',
                    background: 'white',
                    border: isSelected ? `4px solid ${card.color}` :
                           isViewed ? `3px solid ${theme.colors.success}` :
                           '3px solid #ddd',
                    borderRadius: '12px',
                    cursor: animationPhase === 'interactive' ? 'pointer' : 'default',
                    transition: 'all 0.4s ease',
                    animation: isRevealed ? `cardReveal 0.8s ease-out ${index * 0.1}s both` : 'none',
                    boxShadow: isSelected ? `0 0 25px ${card.color}` :
                              isViewed ? `0 0 15px ${theme.colors.success}` :
                              '0 6px 20px rgba(0, 0, 0, 0.15)',
                    transform: isSelected ? 'translateY(-10px) scale(1.05)' :
                              animationPhase === 'interactive' ? 'scale(1)' : 'scale(0.95)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px'
                }}
                onMouseEnter={(e) => {
                    if (animationPhase === 'interactive' && !isSelected) {
                        e.target.style.transform = 'translateY(-5px) scale(1.02)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (animationPhase === 'interactive' && !isSelected) {
                        e.target.style.transform = 'scale(1)';
                    }
                }}
            >
                {/* Card Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: '#2c3e50'
                }}>
                    <span style={{ fontSize: '20px' }}>{card.icon}</span>
                    <span>{card.rank}</span>
                </div>
                
                {/* Card Suits */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px',
                    fontSize: '20px'
                }}>
                    {card.suits.map((suit, suitIndex) => (
                        <div
                            key={suitIndex}
                            style={{
                                color: card.colors[suitIndex],
                                textAlign: 'center'
                            }}
                        >
                            {suit}
                        </div>
                    ))}
                </div>
                
                {/* Card Power */}
                <div style={{
                    background: card.color,
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    width: '100%'
                }}>
                    {card.power}
                </div>
                
                {/* Viewed indicator */}
                {isViewed && (
                    <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: theme.colors.success,
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}>
                        ✓
                    </div>
                )}
                
                {/* Click indicator */}
                {animationPhase === 'interactive' && !isViewed && (
                    <div style={{
                        position: 'absolute',
                        bottom: '-15px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: theme.colors.info,
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        animation: 'clickPrompt 2s infinite'
                    }}>
                        Click me!
                    </div>
                )}
            </div>
        );
    };
    
    /**
     * Render detailed card view
     */
    const renderCardDetails = () => {
        if (!showDetails) return null;
        
        const card = specialCards[currentCard];
        
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                animation: 'detailsSlideIn 0.4s ease-out'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: theme.borderRadius,
                    padding: theme.spacing.xlarge,
                    maxWidth: '500px',
                    width: '90%',
                    position: 'relative',
                    border: `4px solid ${card.color}`,
                    animation: 'detailsZoomIn 0.4s ease-out'
                }}>
                    {/* Close button */}
                    <button
                        onClick={handleCloseDetails}
                        style={{
                            position: 'absolute',
                            top: theme.spacing.medium,
                            right: theme.spacing.medium,
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: theme.colors.secondary
                        }}
                    >
                        ×
                    </button>
                    
                    {/* Card header */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: theme.spacing.large
                    }}>
                        <div style={{
                            fontSize: '48px',
                            marginBottom: theme.spacing.small
                        }}>
                            {card.icon}
                        </div>
                        <h2 style={{
                            fontSize: '28px',
                            color: card.color,
                            margin: `0 0 ${theme.spacing.small} 0`
                        }}>
                            {card.name} ({card.rank})
                        </h2>
                        <div style={{
                            background: card.color,
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            display: 'inline-block'
                        }}>
                            {card.power}: {card.shortDescription}
                        </div>
                    </div>
                    
                    {/* Description */}
                    <div style={{
                        marginBottom: theme.spacing.large
                    }}>
                        <p style={{
                            fontSize: '16px',
                            lineHeight: 1.6,
                            color: theme.colors.text,
                            textAlign: 'center',
                            margin: `0 0 ${theme.spacing.medium} 0`
                        }}>
                            {card.fullDescription}
                        </p>
                        
                        <div style={{
                            background: 'rgba(52, 152, 219, 0.1)',
                            border: `2px solid ${theme.colors.info}`,
                            borderRadius: theme.borderRadius,
                            padding: theme.spacing.medium,
                            fontSize: '14px',
                            color: theme.colors.text,
                            textAlign: 'center'
                        }}>
                            💡 <strong>Special Note:</strong> {card.details}
                        </div>
                    </div>
                    
                    {/* Examples */}
                    <div style={{
                        marginBottom: theme.spacing.large
                    }}>
                        <h4 style={{
                            fontSize: '16px',
                            color: theme.colors.primary,
                            marginBottom: theme.spacing.small
                        }}>
                            📋 Key Effects:
                        </h4>
                        <ul style={{
                            margin: 0,
                            paddingLeft: '20px'
                        }}>
                            {card.examples.map((example, index) => (
                                <li key={index} style={{
                                    marginBottom: '4px',
                                    color: theme.colors.text
                                }}>
                                    {example}
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    {/* Navigation */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <button
                            onClick={() => {
                                const prevCard = (currentCard - 1 + specialCards.length) % specialCards.length;
                                setCurrentCard(prevCard);
                                setCompletedOverviews(prev => new Set([...prev, prevCard]));
                            }}
                            style={{
                                padding: '8px 16px',
                                background: theme.colors.secondary,
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            ← Previous
                        </button>
                        
                        <div style={{
                            fontSize: '14px',
                            color: theme.colors.secondary
                        }}>
                            {currentCard + 1} of {specialCards.length}
                        </div>
                        
                        <button
                            onClick={() => {
                                const nextCard = (currentCard + 1) % specialCards.length;
                                setCurrentCard(nextCard);
                                setCompletedOverviews(prev => new Set([...prev, nextCard]));
                            }}
                            style={{
                                padding: '8px 16px',
                                background: theme.colors.info,
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Next →
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    return (
        <>
            {/* CSS Animations */}
            <style jsx>{`
                @keyframes cardReveal {
                    from { 
                        transform: rotateY(180deg) scale(0.5);
                        opacity: 0;
                    }
                    to { 
                        transform: rotateY(0deg) scale(1);
                        opacity: 1;
                    }
                }
                
                @keyframes clickPrompt {
                    0%, 100% { 
                        transform: translateX(-50%) scale(1);
                        opacity: 0.8;
                    }
                    50% { 
                        transform: translateX(-50%) scale(1.1);
                        opacity: 1;
                    }
                }
                
                @keyframes detailsSlideIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes detailsZoomIn {
                    from { 
                        transform: scale(0.8);
                        opacity: 0;
                    }
                    to { 
                        transform: scale(1);
                        opacity: 1;
                    }
                }
                
                @keyframes introFadeIn {
                    from { 
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .special-intro {
                    animation: introFadeIn 1s ease-out;
                }
                
                @media (max-width: 768px) {
                    .cards-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 15px !important;
                    }
                    
                    .special-card {
                        width: 100px !important;
                        height: 140px !important;
                    }
                    
                    .details-modal {
                        padding: 20px !important;
                        margin: 10px !important;
                    }
                }
                
                @media (max-width: 480px) {
                    .cards-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
            
            {/* Main Container */}
            <div
                ref={containerRef}
                className="special-intro"
                style={{
                    padding: theme.spacing.xlarge,
                    background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.1), rgba(52, 152, 219, 0.1))',
                    borderRadius: theme.borderRadius,
                    minHeight: '600px',
                    textAlign: 'center',
                    position: 'relative'
                }}
            >
                {/* Header */}
                <div style={{
                    marginBottom: theme.spacing.xlarge
                }}>
                    <h2 style={{
                        fontSize: '32px',
                        color: theme.colors.primary,
                        marginBottom: theme.spacing.medium,
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                        ⚡ Special Cards Power-Up!
                    </h2>
                    <p style={{
                        fontSize: '18px',
                        color: theme.colors.text,
                        margin: 0,
                        maxWidth: '600px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }}>
                        Meet the 5 special cards that will transform your Crazy 8's strategy. 
                        {animationPhase === 'interactive' ? ' Click each card to learn its power!' : ' Watch them reveal...'}
                    </p>
                </div>
                
                {/* Cards Grid */}
                <div
                    className="cards-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '20px',
                        justifyContent: 'center',
                        marginBottom: theme.spacing.xlarge,
                        maxWidth: '700px',
                        margin: '0 auto'
                    }}
                >
                    {specialCards.map((card, index) => renderSpecialCard(card, index))}
                </div>
                
                {/* Progress */}
                <div style={{
                    marginBottom: theme.spacing.large
                }}>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.1)',
                        borderRadius: '10px',
                        height: '8px',
                        width: '300px',
                        margin: '0 auto',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            background: theme.colors.success,
                            height: '100%',
                            width: `${(completedOverviews.size / specialCards.length) * 100}%`,
                            transition: 'width 0.5s ease-out',
                            borderRadius: '10px'
                        }} />
                    </div>
                    <div style={{
                        fontSize: '14px',
                        color: theme.colors.secondary,
                        marginTop: '8px'
                    }}>
                        {completedOverviews.size} of {specialCards.length} cards explored
                    </div>
                </div>
                
                {/* Complete Button */}
                {completedOverviews.size >= 3 && (
                    <button
                        onClick={handleComplete}
                        style={{
                            padding: '12px 24px',
                            background: theme.colors.success,
                            border: 'none',
                            borderRadius: theme.borderRadius,
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            animation: 'clickPrompt 2s infinite'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 4px 15px rgba(39, 174, 96, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        🚀 Ready to Practice!
                    </button>
                )}
                
                {/* Instructions */}
                {animationPhase === 'interactive' && completedOverviews.size < 3 && (
                    <div style={{
                        position: 'absolute',
                        bottom: theme.spacing.medium,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(52, 152, 219, 0.9)',
                        color: 'white',
                        padding: theme.spacing.medium,
                        borderRadius: theme.borderRadius,
                        fontSize: '16px',
                        maxWidth: '400px',
                        textAlign: 'center'
                    }}>
                        👆 Click on at least 3 different cards to learn their powers!
                    </div>
                )}
            </div>
            
            {/* Detailed View Modal */}
            {renderCardDetails()}
        </>
    );
};

export default SpecialCardIntro;