/**
 * JackLesson.js - Skip mechanics with 2-player differences
 * Teaches Jack card mechanics and how skip works differently in 2-player vs multiplayer games
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Jack lesson component for learning skip mechanics
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback when lesson is completed
 * @param {Function} props.onProgress - Callback for progress updates
 * @param {Object} props.tutorialEngine - Tutorial engine instance
 * @param {Object} props.theme - Theme configuration
 */
const JackLesson = ({
    onComplete,
    onProgress,
    tutorialEngine,
    theme
}) => {
    // State management
    const [currentScenario, setCurrentScenario] = useState(0);
    const [gamePhase, setGamePhase] = useState('explanation');
    const [currentTurn, setCurrentTurn] = useState(0);
    const [turnDirection, setTurnDirection] = useState(1); // 1 for clockwise
    const [players, setPlayers] = useState([]);
    const [gameActions, setGameActions] = useState([]);
    const [skipTargets, setSkipTargets] = useState([]);
    const [animatingSkip, setAnimatingSkip] = useState(false);
    const [practiceProgress, setPracticeProgress] = useState({});
    const [showComparison, setShowComparison] = useState(false);
    
    // Refs
    const containerRef = useRef(null);
    const playersRef = useRef([]);
    
    // Lesson configuration
    const lessonData = {
        id: 'jack-lesson',
        title: 'Jack: Skip Power',
        description: 'Master the Jack card and its skip mechanics',
        estimatedTime: '3 minutes',
        difficulty: 'beginner',
        objectives: [
            {
                id: 'understand-skip',
                description: 'Understand how Jack skips players',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'learn-2player-difference',
                description: 'Learn how Jack works differently in 2-player games',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'practice-jack-timing',
                description: 'Practice strategic Jack timing',
                type: 'practical',
                completed: false
            }
        ]
    };
    
    // Game scenarios for demonstration
    const scenarios = [
        {
            id: 'multiplayer-skip',
            title: 'Multiplayer Skip (4 Players)',
            description: 'See how Jack skips the next player in a 4-player game',
            playerCount: 4,
            players: [
                { id: 'you', name: 'You', position: { x: 50, y: 80 }, isActive: true, cards: 5 },
                { id: 'alice', name: 'Alice', position: { x: 20, y: 40 }, isActive: false, cards: 6 },
                { id: 'bob', name: 'Bob', position: { x: 50, y: 20 }, isActive: false, cards: 4 },
                { id: 'carol', name: 'Carol', position: { x: 80, y: 40 }, isActive: false, cards: 7 }
            ],
            jackPlayer: 0,
            skippedPlayer: 1,
            nextPlayer: 2,
            explanation: 'Alice gets skipped, turn goes directly to Bob'
        },
        {
            id: 'twoplayer-skip',
            title: '2-Player Skip (You Play Again!)',
            description: 'See how Jack lets you play again in 2-player games',
            playerCount: 2,
            players: [
                { id: 'you', name: 'You', position: { x: 30, y: 60 }, isActive: true, cards: 5 },
                { id: 'opponent', name: 'Opponent', position: { x: 70, y: 60 }, isActive: false, cards: 6 }
            ],
            jackPlayer: 0,
            skippedPlayer: 1,
            nextPlayer: 0,
            explanation: 'Opponent gets skipped, you play again immediately!'
        }
    ];
    
    /**
     * Initialize lesson
     */
    useEffect(() => {
        onProgress({
            lessonId: lessonData.id,
            progress: 0,
            phase: 'explanation'
        });
        
        // Start with explanation
        setTimeout(() => {
            setGamePhase('demo');
            initializeScenario(0);
        }, 2000);
    }, []);
    
    /**
     * Initialize a scenario
     */
    const initializeScenario = (scenarioIndex) => {
        const scenario = scenarios[scenarioIndex];
        setCurrentScenario(scenarioIndex);
        
        const initialPlayers = scenario.players.map((player, index) => ({
            ...player,
            isActive: index === scenario.jackPlayer,
            isSkipped: false,
            playedJack: false
        }));
        
        setPlayers(initialPlayers);
        setCurrentTurn(scenario.jackPlayer);
        setGameActions([]);
        setSkipTargets([]);
        setAnimatingSkip(false);
        
        // Start the demonstration after a brief delay
        setTimeout(() => {
            demonstrateJackPlay(scenario);
        }, 1500);
    };
    
    /**
     * Demonstrate Jack card play
     */
    const demonstrateJackPlay = async (scenario) => {
        const jackSuits = ['♠', '♥', '♣', '♦'];
        const jackSuit = jackSuits[Math.floor(Math.random() * jackSuits.length)];
        
        // 1. Show Jack being played
        const playAction = {
            id: Date.now(),
            player: scenario.players[scenario.jackPlayer].name,
            action: `played J${jackSuit}`,
            type: 'jack',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions([playAction]);
        
        // Mark player as having played Jack
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            playedJack: index === scenario.jackPlayer
        })));
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 2. Show skip animation
        setAnimatingSkip(true);
        setSkipTargets([scenario.skippedPlayer]);
        
        // Mark skipped player
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            isSkipped: index === scenario.skippedPlayer,
            isActive: false
        })));
        
        const skipAction = {
            id: Date.now() + 1,
            player: scenario.players[scenario.skippedPlayer].name,
            action: 'turn skipped!',
            type: 'skip',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, skipAction]);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Show next player becoming active
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            isActive: index === scenario.nextPlayer,
            playedJack: false
        })));
        
        setCurrentTurn(scenario.nextPlayer);
        setAnimatingSkip(false);
        
        const nextAction = {
            id: Date.now() + 2,
            player: scenario.players[scenario.nextPlayer].name,
            action: scenario.nextPlayer === scenario.jackPlayer ? 
                'plays again!' : 'begins turn',
            type: 'next-turn',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, nextAction]);
        
        // Mark scenario progress
        setPracticeProgress(prev => ({
            ...prev,
            [scenario.id]: true
        }));
        
        // Auto-advance or show comparison
        setTimeout(() => {
            if (scenarioIndex < scenarios.length - 1) {
                initializeScenario(scenarioIndex + 1);
            } else {
                setGamePhase('comparison');
                setShowComparison(true);
            }
        }, 3000);
    };
    
    /**
     * Handle manual scenario restart
     */
    const handleRestartScenario = () => {
        initializeScenario(currentScenario);
    };
    
    /**
     * Handle switching between scenarios
     */
    const handleSwitchScenario = (scenarioIndex) => {
        initializeScenario(scenarioIndex);
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
            scenariosViewed: Object.keys(practiceProgress).length
        });
    };
    
    /**
     * Calculate lesson score
     */
    const calculateScore = () => {
        const baseScore = 100;
        const scenarioBonus = (Object.keys(practiceProgress).length / scenarios.length) * 20;
        return Math.min(100, Math.round(baseScore + scenarioBonus));
    };
    
    /**
     * Render a player
     */
    const renderPlayer = (player, index, scenario) => {
        const isSkipped = player.isSkipped;
        const isActive = player.isActive;
        const playedJack = player.playedJack;
        
        const position = player.position;
        const colors = ['#3498db', '#e74c3c', '#f39c12', '#27ae60'];
        const playerColor = colors[index % colors.length];
        
        return (
            <div
                key={player.id}
                ref={el => playersRef.current[index] = el}
                style={{
                    position: 'absolute',
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: scenario.playerCount === 2 ? '120px' : '100px',
                    height: scenario.playerCount === 2 ? '120px' : '100px',
                    background: playerColor,
                    borderRadius: '50%',
                    border: isActive ? '4px solid #fff' :
                           isSkipped ? '4px solid #e74c3c' :
                           '2px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: scenario.playerCount === 2 ? '16px' : '14px',
                    transition: 'all 0.4s ease',
                    boxShadow: isActive ? 
                        `0 0 20px ${playerColor}, 0 0 40px rgba(255, 255, 255, 0.5)` :
                        isSkipped ?
                        '0 0 20px #e74c3c, 0 0 40px rgba(231, 76, 60, 0.5)' :
                        `0 4px 15px rgba(0, 0, 0, 0.2)`,
                    animation: isActive ? 'playerActive 2s infinite' :
                              isSkipped ? 'playerSkipped 1s ease-out' :
                              'none',
                    zIndex: isActive || isSkipped ? 10 : 1,
                    opacity: isSkipped ? 0.6 : 1
                }}
            >
                <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                    {player.name}
                </div>
                <div style={{ 
                    fontSize: scenario.playerCount === 2 ? '12px' : '10px', 
                    opacity: 0.9,
                    marginTop: '2px'
                }}>
                    {player.cards} cards
                </div>
                
                {/* Jack indicator */}
                {playedJack && (
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#f39c12',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        animation: 'jackPlayed 0.8s ease-out'
                    }}>
                        J♠ Played!
                    </div>
                )}
                
                {/* Skip indicator */}
                {isSkipped && animatingSkip && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '48px',
                        animation: 'skipEffect 2s ease-out',
                        zIndex: 20,
                        pointerEvents: 'none'
                    }}>
                        ⏭️
                    </div>
                )}
                
                {/* Active indicator */}
                {isActive && (
                    <div style={{
                        position: 'absolute',
                        top: '-35px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '20px',
                        animation: 'arrowBounce 1s infinite'
                    }}>
                        👆
                    </div>
                )}
            </div>
        );
    };
    
    /**
     * Render turn flow visualization
     */
    const renderTurnFlow = (scenario) => {
        if (scenario.playerCount === 2) {
            return (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '24px',
                    color: '#f39c12',
                    animation: animatingSkip ? 'flowPulse 1s infinite' : 'none'
                }}>
                    ↺
                </div>
            );
        }
        
        // For multiplayer, show clockwise arrows
        return (
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '200px',
                border: '2px dashed rgba(255, 255, 255, 0.3)',
                borderRadius: '50%',
                animation: 'clockwiseRotate 8s linear infinite'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '20px',
                    color: '#3498db'
                }}>
                    ➡️
                </div>
            </div>
        );
    };
    
    /**
     * Render comparison view
     */
    const renderComparison = () => {
        if (!showComparison) return null;
        
        return (
            <div style={{
                background: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                padding: theme.spacing.xlarge,
                borderRadius: theme.borderRadius,
                textAlign: 'center',
                animation: 'comparisonSlideIn 0.6s ease-out'
            }}>
                <h3 style={{
                    fontSize: '24px',
                    marginBottom: theme.spacing.large,
                    color: '#f39c12'
                }}>
                    🔍 Jack Card Comparison
                </h3>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: theme.spacing.large,
                    marginBottom: theme.spacing.large
                }}>
                    {/* Multiplayer */}
                    <div style={{
                        background: 'rgba(52, 152, 219, 0.2)',
                        border: '2px solid #3498db',
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium
                    }}>
                        <h4 style={{ color: '#3498db', marginBottom: theme.spacing.small }}>
                            👥 Multiplayer (3+ players)
                        </h4>
                        <ul style={{
                            textAlign: 'left',
                            paddingLeft: '20px',
                            margin: 0
                        }}>
                            <li>Next player is skipped</li>
                            <li>Turn goes to player after skipped</li>
                            <li>Normal turn progression continues</li>
                            <li>Strategic disruption tool</li>
                        </ul>
                    </div>
                    
                    {/* 2-Player */}
                    <div style={{
                        background: 'rgba(243, 156, 18, 0.2)',
                        border: '2px solid #f39c12',
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium
                    }}>
                        <h4 style={{ color: '#f39c12', marginBottom: theme.spacing.small }}>
                            👤👤 2-Player
                        </h4>
                        <ul style={{
                            textAlign: 'left',
                            paddingLeft: '20px',
                            margin: 0
                        }}>
                            <li>Opponent is skipped</li>
                            <li>You play again immediately</li>
                            <li>Like getting an extra turn</li>
                            <li>Powerful momentum builder</li>
                        </ul>
                    </div>
                </div>
                
                <div style={{
                    background: 'rgba(39, 174, 96, 0.2)',
                    border: '2px solid #27ae60',
                    borderRadius: theme.borderRadius,
                    padding: theme.spacing.medium,
                    marginBottom: theme.spacing.large
                }}>
                    <h4 style={{ color: '#27ae60', marginBottom: theme.spacing.small }}>
                        💡 Strategic Tips
                    </h4>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                        • Use Jack when opponent has few cards to prevent them from winning<br/>
                        • In 2-player, Jack gives you momentum to chain multiple plays<br/>
                        • Save Jacks for crucial moments when timing matters most
                    </p>
                </div>
                
                <button
                    onClick={handleComplete}
                    style={{
                        padding: '12px 24px',
                        background: '#27ae60',
                        border: 'none',
                        borderRadius: theme.borderRadius,
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        animation: 'completeButtonPulse 2s infinite'
                    }}
                >
                    ✅ Master the Jack!
                </button>
            </div>
        );
    };
    
    if (gamePhase === 'explanation') {
        return (
            <div style={{
                padding: theme.spacing.xlarge,
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.1), rgba(231, 76, 60, 0.1))',
                borderRadius: theme.borderRadius,
                minHeight: '500px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <div style={{ fontSize: '72px', marginBottom: theme.spacing.medium }}>
                    ⏭️
                </div>
                <h2 style={{
                    fontSize: '32px',
                    color: '#f39c12',
                    marginBottom: theme.spacing.medium
                }}>
                    Jack: The Skip Master
                </h2>
                <p style={{
                    fontSize: '18px',
                    color: theme.colors.text,
                    maxWidth: '600px',
                    margin: '0 auto',
                    lineHeight: 1.6
                }}>
                    The Jack is all about skipping players and controlling the flow of the game. 
                    But here's the twist - it works completely differently in 2-player vs multiplayer games!
                </p>
            </div>
        );
    }
    
    if (gamePhase === 'comparison') {
        return renderComparison();
    }
    
    const scenario = scenarios[currentScenario];
    
    return (
        <>
            {/* CSS Animations */}
            <style jsx>{`
                @keyframes playerActive {
                    0%, 100% { 
                        transform: translate(-50%, -50%) scale(1);
                        box-shadow: 0 0 20px currentColor, 0 0 40px rgba(255, 255, 255, 0.5);
                    }
                    50% { 
                        transform: translate(-50%, -50%) scale(1.05);
                        box-shadow: 0 0 30px currentColor, 0 0 60px rgba(255, 255, 255, 0.8);
                    }
                }
                
                @keyframes playerSkipped {
                    0% { transform: translate(-50%, -50%) scale(1); }
                    25% { transform: translate(-50%, -50%) scale(0.9) rotate(-5deg); }
                    50% { transform: translate(-50%, -50%) scale(1.1) rotate(5deg); }
                    75% { transform: translate(-50%, -50%) scale(0.95) rotate(-2deg); }
                    100% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                }
                
                @keyframes skipEffect {
                    0% { 
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.5);
                    }
                    50% { 
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.2);
                    }
                    100% { 
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8);
                    }
                }
                
                @keyframes jackPlayed {
                    0% { 
                        opacity: 0;
                        transform: translateX(-50%) translateY(-10px) scale(0.5);
                    }
                    100% { 
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                }
                
                @keyframes arrowBounce {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(-5px); }
                }
                
                @keyframes clockwiseRotate {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                
                @keyframes flowPulse {
                    0%, 100% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.2); }
                }
                
                @keyframes comparisonSlideIn {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes completeButtonPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                
                @media (max-width: 768px) {
                    .comparison-grid {
                        grid-template-columns: 1fr !important;
                    }
                    
                    .player-avatar {
                        width: 80px !important;
                        height: 80px !important;
                        font-size: 12px !important;
                    }
                }
            `}</style>
            
            {/* Main Container */}
            <div
                ref={containerRef}
                style={{
                    padding: theme.spacing.xlarge,
                    background: 'linear-gradient(135deg, rgba(243, 156, 18, 0.1), rgba(231, 76, 60, 0.1))',
                    borderRadius: theme.borderRadius,
                    minHeight: '700px',
                    position: 'relative'
                }}
            >
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: theme.spacing.xlarge
                }}>
                    <h2 style={{
                        fontSize: '28px',
                        color: '#f39c12',
                        marginBottom: theme.spacing.small
                    }}>
                        ⏭️ {scenario.title}
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: theme.colors.text,
                        margin: 0
                    }}>
                        {scenario.description}
                    </p>
                </div>
                
                {/* Game Table */}
                <div style={{
                    position: 'relative',
                    width: '500px',
                    height: '400px',
                    margin: '0 auto',
                    marginBottom: theme.spacing.xlarge
                }}>
                    {/* Table Surface */}
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'radial-gradient(circle at center, #27ae60, #229954)',
                        border: '8px solid #8B4513',
                        borderRadius: scenario.playerCount === 2 ? '20px' : '50%',
                        position: 'relative'
                    }}>
                        {/* Center Info */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            padding: theme.spacing.medium,
                            borderRadius: '10px',
                            fontSize: '14px',
                            zIndex: 5
                        }}>
                            <div style={{ fontSize: '20px', marginBottom: '5px' }}>⏭️</div>
                            <div style={{ fontWeight: 'bold' }}>Jack Skip</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                {scenario.playerCount} Players
                            </div>
                        </div>
                        
                        {/* Turn Flow */}
                        {renderTurnFlow(scenario)}
                    </div>
                    
                    {/* Players */}
                    {players.map((player, index) => renderPlayer(player, index, scenario))}
                </div>
                
                {/* Action Log */}
                <div style={{
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    borderRadius: theme.borderRadius,
                    padding: theme.spacing.medium,
                    marginBottom: theme.spacing.large,
                    maxWidth: '500px',
                    margin: '0 auto'
                }}>
                    <h4 style={{
                        margin: `0 0 ${theme.spacing.small} 0`,
                        color: '#f39c12'
                    }}>
                        📝 What's Happening:
                    </h4>
                    {gameActions.length === 0 ? (
                        <div style={{ 
                            fontStyle: 'italic', 
                            color: '#bdc3c7',
                            textAlign: 'center',
                            padding: '10px'
                        }}>
                            Watch the Jack in action...
                        </div>
                    ) : (
                        gameActions.map((action, index) => (
                            <div 
                                key={action.id}
                                style={{
                                    padding: '8px 0',
                                    borderBottom: index < gameActions.length - 1 ? 
                                        '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                                    animation: index === gameActions.length - 1 ? 
                                        'actionHighlight 1s ease-out' : 'none'
                                }}
                            >
                                <strong>{action.player}</strong> {action.action}
                            </div>
                        ))
                    )}
                </div>
                
                {/* Explanation */}
                <div style={{
                    background: 'rgba(243, 156, 18, 0.1)',
                    border: `2px solid #f39c12`,
                    borderRadius: theme.borderRadius,
                    padding: theme.spacing.medium,
                    textAlign: 'center',
                    marginBottom: theme.spacing.large
                }}>
                    <h4 style={{ 
                        color: '#f39c12', 
                        marginBottom: theme.spacing.small 
                    }}>
                        💡 Result: {scenario.explanation}
                    </h4>
                </div>
                
                {/* Controls */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: theme.spacing.medium,
                    flexWrap: 'wrap'
                }}>
                    <button
                        onClick={handleRestartScenario}
                        style={{
                            padding: '10px 16px',
                            background: theme.colors.info,
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        🔄 Replay
                    </button>
                    
                    {scenarios.map((s, index) => (
                        <button
                            key={s.id}
                            onClick={() => handleSwitchScenario(index)}
                            style={{
                                padding: '10px 16px',
                                background: index === currentScenario ? '#f39c12' : 
                                           practiceProgress[s.id] ? theme.colors.success : 
                                           theme.colors.secondary,
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            {s.playerCount === 2 ? '👤👤' : '👥'} {s.playerCount}P
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default JackLesson;