/**
 * WelcomeLesson.js - Animated intro to Crazy 8's
 * Provides an engaging introduction to the game with animated explanations
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Welcome lesson component for introducing Crazy 8's game basics
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback when lesson is completed
 * @param {Function} props.onProgress - Callback for progress updates
 * @param {Object} props.tutorialEngine - Tutorial engine instance
 * @param {Object} props.theme - Theme configuration
 */
const WelcomeLesson = ({
    onComplete,
    onProgress,
    tutorialEngine,
    theme
}) => {
    // State management
    const [currentStep, setCurrentStep] = useState(0);
    const [animationPhase, setAnimationPhase] = useState('intro');
    const [cardsVisible, setCardsVisible] = useState(false);
    const [showGoal, setShowGoal] = useState(false);
    const [completedSteps, setCompletedSteps] = useState(new Set());
    const [isReady, setIsReady] = useState(false);
    
    // Refs
    const containerRef = useRef(null);
    const cardAnimationRef = useRef(null);
    
    // Lesson configuration
    const lessonData = {
        id: 'welcome-crazy8s',
        title: 'Welcome to Crazy 8\'s!',
        description: 'Learn the exciting world of Crazy 8\'s card game',
        estimatedTime: '2 minutes',
        difficulty: 'beginner',
        objectives: [
            {
                id: 'understand-goal',
                description: 'Understand the main goal of Crazy 8\'s',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'learn-cards',
                description: 'Learn about the deck and card types',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'ready-to-play',
                description: 'Feel ready to start playing',
                type: 'engagement',
                completed: false
            }
        ],
        steps: [
            {
                id: 'welcome',
                title: '🎉 Welcome to Crazy 8\'s!',
                content: 'Get ready to learn one of the most exciting card games! Crazy 8\'s is fast-paced, strategic, and tons of fun.',
                animation: 'welcome',
                duration: 3000
            },
            {
                id: 'game-overview',
                title: '🎯 The Goal',
                content: 'Your mission is simple: be the first player to play all your cards! But don\'t worry - we\'ll show you exactly how.',
                animation: 'goal',
                duration: 4000
            },
            {
                id: 'deck-intro',
                title: '🃏 The Cards',
                content: 'We use a standard 52-card deck. Each card has a suit (♠♥♣♦) and a rank (A,2,3...J,Q,K).',
                animation: 'cards',
                duration: 5000
            },
            {
                id: 'special-cards',
                title: '🎱 Special: The 8s',
                content: 'The 8s are special! They\'re wild cards that can be played anytime and let you choose the next suit.',
                animation: 'eights',
                duration: 4000
            },
            {
                id: 'ready-check',
                title: '✨ Ready to Start?',
                content: 'You\'re about to become a Crazy 8\'s expert! Let\'s start with the basics of card matching.',
                animation: 'ready',
                duration: 3000
            }
        ]
    };
    
    /**
     * Initialize lesson
     */
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true);
            startLesson();
        }, 500);
        
        return () => clearTimeout(timer);
    }, []);
    
    /**
     * Start the lesson sequence
     */
    const startLesson = () => {
        setAnimationPhase('welcome');
        setCurrentStep(0);
        onProgress({
            lessonId: lessonData.id,
            progress: 0,
            step: lessonData.steps[0]
        });
    };
    
    /**
     * Handle step progression
     */
    useEffect(() => {
        if (!isReady || currentStep >= lessonData.steps.length) return;
        
        const step = lessonData.steps[currentStep];
        setAnimationPhase(step.animation);
        
        // Auto-advance after step duration
        const timer = setTimeout(() => {
            nextStep();
        }, step.duration);
        
        return () => clearTimeout(timer);
    }, [currentStep, isReady]);
    
    /**
     * Progress to next step
     */
    const nextStep = () => {
        const newCompleted = new Set(completedSteps);
        newCompleted.add(currentStep);
        setCompletedSteps(newCompleted);
        
        if (currentStep < lessonData.steps.length - 1) {
            const nextStepIndex = currentStep + 1;
            setCurrentStep(nextStepIndex);
            
            onProgress({
                lessonId: lessonData.id,
                progress: ((nextStepIndex + 1) / lessonData.steps.length) * 100,
                step: lessonData.steps[nextStepIndex],
                completedSteps: Array.from(newCompleted)
            });
        } else {
            completeLesson();
        }
    };
    
    /**
     * Complete the lesson
     */
    const completeLesson = () => {
        const completedObjectives = lessonData.objectives.map(obj => ({
            ...obj,
            completed: true
        }));
        
        onComplete({
            lessonId: lessonData.id,
            completed: true,
            objectives: completedObjectives,
            score: 100,
            timeSpent: Date.now() - (Date.now() - 120000) // Simulate 2 minutes
        });
    };
    
    /**
     * Skip to next step manually
     */
    const handleSkip = () => {
        nextStep();
    };
    
    /**
     * Replay current step
     */
    const handleReplay = () => {
        const step = lessonData.steps[currentStep];
        setAnimationPhase(step.animation);
    };
    
    /**
     * Render animated cards for demonstrations
     */
    const renderAnimatedCards = () => {
        const cards = [
            { rank: 'A', suit: '♠', color: 'black' },
            { rank: '5', suit: '♥', color: 'red' },
            { rank: 'Q', suit: '♣', color: 'black' },
            { rank: '8', suit: '♦', color: 'red', special: true },
            { rank: '3', suit: '♠', color: 'black' },
            { rank: 'K', suit: '♥', color: 'red' },
            { rank: '8', suit: '♠', color: 'black', special: true },
            { rank: '7', suit: '♦', color: 'red' }
        ];
        
        return (
            <div 
                ref={cardAnimationRef}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    margin: `${theme.spacing.large} 0`,
                    minHeight: '120px',
                    perspective: '1000px'
                }}
            >
                {cards.map((card, index) => (
                    <div
                        key={`${card.rank}-${card.suit}`}
                        style={{
                            width: '60px',
                            height: '84px',
                            background: 'white',
                            border: card.special ? '3px solid #f39c12' : '2px solid #ddd',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: card.color,
                            boxShadow: card.special ? 
                                '0 4px 15px rgba(243, 156, 18, 0.3)' : 
                                '0 2px 8px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            animation: cardsVisible ? 
                                `cardDealIn 0.5s ease-out ${index * 0.1}s both` : 
                                'none',
                            transform: animationPhase === 'eights' && card.special ? 
                                'scale(1.2) rotateY(15deg)' : 
                                'scale(1)',
                            zIndex: card.special && animationPhase === 'eights' ? 10 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!card.special || animationPhase !== 'eights') {
                                e.target.style.transform = 'translateY(-5px) scale(1.05)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!card.special || animationPhase !== 'eights') {
                                e.target.style.transform = 'translateY(0) scale(1)';
                            }
                        }}
                    >
                        <div style={{ fontSize: '12px' }}>{card.rank}</div>
                        <div style={{ fontSize: '20px' }}>{card.suit}</div>
                        <div style={{ fontSize: '12px', transform: 'rotate(180deg)' }}>
                            {card.rank}
                        </div>
                        
                        {/* Special glow for 8s */}
                        {card.special && animationPhase === 'eights' && (
                            <div style={{
                                position: 'absolute',
                                top: '-3px',
                                left: '-3px',
                                right: '-3px',
                                bottom: '-3px',
                                background: 'linear-gradient(45deg, #f39c12, #e67e22)',
                                borderRadius: '8px',
                                zIndex: -1,
                                animation: 'cardGlow 2s infinite alternate'
                            }} />
                        )}
                    </div>
                ))}
            </div>
        );
    };
    
    /**
     * Render step content with animations
     */
    const renderStepContent = () => {
        if (currentStep >= lessonData.steps.length) return null;
        
        const step = lessonData.steps[currentStep];
        
        return (
            <div style={{
                textAlign: 'center',
                animation: 'stepFadeIn 0.8s ease-out'
            }}>
                <h2 style={{
                    fontSize: '28px',
                    margin: `0 0 ${theme.spacing.medium} 0`,
                    color: theme.colors.primary,
                    animation: animationPhase === 'welcome' ? 
                        'titleBounce 1s ease-out' : 
                        'titleSlideIn 0.6s ease-out'
                }}>
                    {step.title}
                </h2>
                
                <p style={{
                    fontSize: '18px',
                    lineHeight: 1.6,
                    color: theme.colors.text,
                    margin: `0 0 ${theme.spacing.large} 0`,
                    maxWidth: '600px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                }}>
                    {step.content}
                </p>
                
                {/* Show cards for relevant steps */}
                {(['cards', 'eights'].includes(animationPhase)) && (
                    <div>
                        {renderAnimatedCards()}
                        
                        {animationPhase === 'eights' && (
                            <div style={{
                                background: 'rgba(243, 156, 18, 0.1)',
                                border: `2px solid ${theme.colors.warning}`,
                                borderRadius: theme.borderRadius,
                                padding: theme.spacing.medium,
                                margin: `${theme.spacing.medium} auto`,
                                maxWidth: '500px',
                                animation: 'highlightPulse 2s infinite'
                            }}>
                                <div style={{
                                    fontWeight: 'bold',
                                    color: theme.colors.warning,
                                    marginBottom: '8px'
                                }}>
                                    🎱 Wild Card Power!
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    color: theme.colors.text
                                }}>
                                    The golden cards above are 8s - they can be played on any card 
                                    and let you change the suit to whatever you want!
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Goal visualization */}
                {animationPhase === 'goal' && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: theme.spacing.large,
                        margin: `${theme.spacing.large} 0`
                    }}>
                        <div style={{
                            padding: theme.spacing.medium,
                            background: 'rgba(231, 76, 60, 0.1)',
                            border: `2px solid ${theme.colors.error}`,
                            borderRadius: theme.borderRadius,
                            textAlign: 'center',
                            animation: 'goalPulse 3s infinite'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>📚</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Start: 8 Cards</div>
                        </div>
                        
                        <div style={{
                            fontSize: '30px',
                            animation: 'arrowFloat 2s infinite'
                        }}>
                            ➡️
                        </div>
                        
                        <div style={{
                            padding: theme.spacing.medium,
                            background: 'rgba(39, 174, 96, 0.1)',
                            border: `2px solid ${theme.colors.success}`,
                            borderRadius: theme.borderRadius,
                            textAlign: 'center',
                            animation: 'goalPulse 3s infinite 1s'
                        }}>
                            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Win: 0 Cards!</div>
                        </div>
                    </div>
                )}
            </div>
        );
    };
    
    /**
     * Trigger cards animation
     */
    useEffect(() => {
        if (animationPhase === 'cards' || animationPhase === 'eights') {
            setCardsVisible(true);
        }
    }, [animationPhase]);
    
    if (!isReady) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '400px',
                fontSize: '18px',
                color: theme.colors.secondary
            }}>
                Preparing your Crazy 8's adventure...
            </div>
        );
    }
    
    return (
        <>
            {/* CSS Animations */}
            <style jsx>{`
                @keyframes stepFadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes titleBounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
                
                @keyframes titleSlideIn {
                    from { transform: translateX(-30px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes cardDealIn {
                    from { 
                        transform: translateY(-100px) rotateY(180deg); 
                        opacity: 0; 
                    }
                    to { 
                        transform: translateY(0) rotateY(0deg); 
                        opacity: 1; 
                    }
                }
                
                @keyframes cardGlow {
                    from { 
                        box-shadow: 0 0 10px rgba(243, 156, 18, 0.5);
                        transform: scale(1);
                    }
                    to { 
                        box-shadow: 0 0 20px rgba(243, 156, 18, 0.8);
                        transform: scale(1.05);
                    }
                }
                
                @keyframes highlightPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                
                @keyframes goalPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                @keyframes arrowFloat {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(10px); }
                }
                
                .welcome-lesson {
                    animation: stepFadeIn 1s ease-out;
                }
                
                @media (max-width: 768px) {
                    .card-container {
                        gap: 5px !important;
                    }
                    
                    .animated-card {
                        width: 45px !important;
                        height: 63px !important;
                        font-size: 12px !important;
                    }
                }
                
                @media (prefers-reduced-motion: reduce) {
                    * {
                        animation-duration: 0.1s !important;
                    }
                }
            `}</style>
            
            {/* Main Lesson Container */}
            <div
                ref={containerRef}
                className="welcome-lesson"
                style={{
                    padding: theme.spacing.xlarge,
                    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(39, 174, 96, 0.1))',
                    borderRadius: theme.borderRadius,
                    minHeight: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background Pattern */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: `
                        radial-gradient(circle at 20% 50%, rgba(52, 152, 219, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(39, 174, 96, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 40% 80%, rgba(243, 156, 18, 0.1) 0%, transparent 50%)
                    `,
                    zIndex: 0
                }} />
                
                {/* Content */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    {renderStepContent()}
                </div>
                
                {/* Progress Indicator */}
                <div style={{
                    position: 'absolute',
                    bottom: theme.spacing.medium,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: '8px'
                }}>
                    {lessonData.steps.map((_, index) => (
                        <div
                            key={index}
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: index <= currentStep ? 
                                    theme.colors.success : 
                                    'rgba(255, 255, 255, 0.3)',
                                transition: 'all 0.3s ease',
                                animation: index === currentStep ? 
                                    'highlightPulse 2s infinite' : 
                                    'none'
                            }}
                        />
                    ))}
                </div>
                
                {/* Control Buttons */}
                <div style={{
                    position: 'absolute',
                    top: theme.spacing.medium,
                    right: theme.spacing.medium,
                    display: 'flex',
                    gap: theme.spacing.small
                }}>
                    <button
                        onClick={handleReplay}
                        style={{
                            padding: '8px 12px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: `1px solid ${theme.colors.info}`,
                            borderRadius: '6px',
                            color: theme.colors.text,
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                        }}
                        title="Replay current step"
                    >
                        🔄 Replay
                    </button>
                    
                    <button
                        onClick={handleSkip}
                        style={{
                            padding: '8px 12px',
                            background: theme.colors.info,
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.2s ease'
                        }}
                        title="Skip to next step"
                    >
                        ⏭️ Next
                    </button>
                </div>
            </div>
        </>
    );
};

export default WelcomeLesson;