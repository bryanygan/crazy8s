/**
 * QueenLesson.js - Reverse mechanics and 2-player behavior
 * Teaches Queen card mechanics and how direction reversal works in different player counts
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Queen lesson component for learning reverse mechanics
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback when lesson is completed
 * @param {Function} props.onProgress - Callback for progress updates
 * @param {Object} props.tutorialEngine - Tutorial engine instance
 * @param {Object} props.theme - Theme configuration
 */
const QueenLesson = ({
    onComplete,
    onProgress,
    tutorialEngine,
    theme
}) => {
    // State management
    const [currentScenario, setCurrentScenario] = useState(0);
    const [gamePhase, setGamePhase] = useState('explanation');
    const [currentTurn, setCurrentTurn] = useState(0);
    const [turnDirection, setTurnDirection] = useState(1); // 1 for clockwise, -1 for counter-clockwise
    const [players, setPlayers] = useState([]);
    const [gameActions, setGameActions] = useState([]);
    const [animatingReverse, setAnimatingReverse] = useState(false);
    const [practiceProgress, setPracticeProgress] = useState({});
    const [showComparison, setShowComparison] = useState(false);
    const [turnHistory, setTurnHistory] = useState([]);
    
    // Refs
    const containerRef = useRef(null);
    const playersRef = useRef([]);
    
    // Lesson configuration
    const lessonData = {
        id: 'queen-lesson',
        title: 'Queen: Reverse Power',
        description: 'Master the Queen card and direction reversal',
        estimatedTime: '3 minutes',
        difficulty: 'beginner',
        objectives: [
            {
                id: 'understand-reverse',
                description: 'Understand how Queen reverses turn direction',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'learn-2player-skip',
                description: 'Learn how Queen acts as skip in 2-player games',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'practice-direction-control',
                description: 'Practice strategic direction control',
                type: 'practical',
                completed: false
            }
        ]
    };
    
    // Game scenarios for demonstration
    const scenarios = [
        {
            id: 'multiplayer-reverse',
            title: 'Multiplayer Reverse (4 Players)',
            description: 'See how Queen changes direction in a 4-player game',
            playerCount: 4,
            players: [
                { id: 'you', name: 'You', position: { x: 50, y: 80 }, isActive: true, cards: 5 },
                { id: 'alice', name: 'Alice', position: { x: 20, y: 40 }, isActive: false, cards: 6 },
                { id: 'bob', name: 'Bob', position: { x: 50, y: 20 }, isActive: false, cards: 4 },
                { id: 'carol', name: 'Carol', position: { x: 80, y: 40 }, isActive: false, cards: 7 }
            ],
            queenPlayer: 0,
            normalNext: 1, // Alice (clockwise)
            reversedNext: 3, // Carol (counter-clockwise)
            explanation: 'Direction reverses! Instead of Alice, turn goes to Carol'
        },
        {
            id: 'twoplayer-reverse',
            title: '2-Player Reverse (Acts as Skip!)',
            description: 'See how Queen lets you play again in 2-player games',
            playerCount: 2,
            players: [
                { id: 'you', name: 'You', position: { x: 30, y: 60 }, isActive: true, cards: 5 },
                { id: 'opponent', name: 'Opponent', position: { x: 70, y: 60 }, isActive: false, cards: 6 }
            ],
            queenPlayer: 0,
            normalNext: 1,
            reversedNext: 0, // You play again!
            explanation: 'In 2-player, reverse = skip! You play again immediately!'
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
            isActive: index === scenario.queenPlayer,
            playedQueen: false,
            nextInLine: false
        }));
        
        setPlayers(initialPlayers);
        setCurrentTurn(scenario.queenPlayer);
        setTurnDirection(1); // Start clockwise
        setGameActions([]);
        setAnimatingReverse(false);
        setTurnHistory([scenario.queenPlayer]);
        
        // Start the demonstration after a brief delay
        setTimeout(() => {
            demonstrateQueenPlay(scenario);
        }, 1500);
    };
    
    /**
     * Demonstrate Queen card play
     */
    const demonstrateQueenPlay = async (scenario) => {
        const queenSuits = ['♠', '♥', '♣', '♦'];
        const queenSuit = queenSuits[Math.floor(Math.random() * queenSuits.length)];
        
        // 1. Show normal turn progression first (briefly)
        if (scenario.playerCount > 2) {
            const normalAction = {
                id: Date.now(),
                player: 'Next would be',
                action: `${scenario.players[scenario.normalNext].name} (clockwise)`,
                type: 'normal-flow',
                timestamp: new Date().toLocaleTimeString()
            };
            
            setGameActions([normalAction]);
            
            // Highlight normal next player briefly
            setPlayers(prev => prev.map((player, index) => ({
                ...player,
                nextInLine: index === scenario.normalNext
            })));
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // 2. Show Queen being played
        const playAction = {
            id: Date.now() + 1,
            player: scenario.players[scenario.queenPlayer].name,
            action: `played Q${queenSuit}`,
            type: 'queen',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, playAction]);
        
        // Mark player as having played Queen
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            playedQueen: index === scenario.queenPlayer,
            nextInLine: false
        })));
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 3. Show reverse animation
        setAnimatingReverse(true);
        
        const reverseAction = {
            id: Date.now() + 2,
            player: 'Direction',
            action: scenario.playerCount === 2 ? 
                'reverses (acts as skip!)' : 
                'reverses to counter-clockwise!',
            type: 'reverse',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, reverseAction]);
        
        // Animate direction change
        if (scenario.playerCount > 2) {
            setTurnDirection(-1); // Counter-clockwise
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 4. Show next player becoming active
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            isActive: index === scenario.reversedNext,
            playedQueen: false
        })));
        
        setCurrentTurn(scenario.reversedNext);
        setAnimatingReverse(false);
        setTurnHistory(prev => [...prev, scenario.reversedNext]);
        
        const nextAction = {
            id: Date.now() + 3,
            player: scenario.players[scenario.reversedNext].name,
            action: scenario.reversedNext === scenario.queenPlayer ? 
                'plays again!' : 'begins turn',
            type: 'next-turn',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, nextAction]);
        
        // Continue demonstration with a few more turns to show the reverse effect
        if (scenario.playerCount > 2) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            await demonstrateReversedFlow(scenario);
        }
        
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
     * Demonstrate continued play in reversed direction
     */
    const demonstrateReversedFlow = async (scenario) => {
        // Show one more turn in reversed direction
        const currentPlayer = scenario.reversedNext;
        const nextPlayer = getNextPlayer(currentPlayer, scenario.players.length, -1);
        
        const continueAction = {
            id: Date.now(),
            player: scenario.players[currentPlayer].name,
            action: 'plays a card',
            type: 'normal-play',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, continueAction]);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Move to next player (still counter-clockwise)
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            isActive: index === nextPlayer
        })));
        
        setCurrentTurn(nextPlayer);
        setTurnHistory(prev => [...prev, nextPlayer]);
        
        const nextTurnAction = {
            id: Date.now() + 1,
            player: scenario.players[nextPlayer].name,
            action: 'begins turn (counter-clockwise)',
            type: 'next-turn',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, nextTurnAction]);
    };
    
    /**
     * Get next player index based on direction
     */
    const getNextPlayer = (currentPlayer, playerCount, direction) => {
        if (direction === 1) {
            return (currentPlayer + 1) % playerCount;
        } else {
            return (currentPlayer - 1 + playerCount) % playerCount;
        }
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
        const isActive = player.isActive;
        const playedQueen = player.playedQueen;
        const nextInLine = player.nextInLine;
        
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
                           nextInLine ? '4px solid #f39c12' :
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
                        nextInLine ?
                        '0 0 20px #f39c12, 0 0 40px rgba(243, 156, 18, 0.5)' :
                        `0 4px 15px rgba(0, 0, 0, 0.2)`,
                    animation: isActive ? 'playerActive 2s infinite' :
                              nextInLine ? 'playerNextInLine 1s infinite' :
                              'none',
                    zIndex: isActive || nextInLine ? 10 : 1
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
                
                {/* Queen indicator */}
                {playedQueen && (
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#9b59b6',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        animation: 'queenPlayed 0.8s ease-out'
                    }}>
                        Q♠ Played!
                    </div>
                )}
                
                {/* Reverse indicator */}
                {animatingReverse && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '48px',
                        animation: 'reverseEffect 2s ease-out',
                        zIndex: 20,
                        pointerEvents: 'none'
                    }}>
                        🔄
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
                
                {/* Next in line indicator */}
                {nextInLine && (
                    <div style={{
                        position: 'absolute',
                        bottom: '-30px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#f39c12',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}>
                        Normal Next
                    </div>
                )}
            </div>
        );
    };
    
    /**
     * Render turn direction indicator
     */
    const renderDirectionIndicator = (scenario) => {
        const isClockwise = turnDirection === 1;
        
        if (scenario.playerCount === 2) {
            return (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '32px',
                    color: '#9b59b6',
                    animation: animatingReverse ? 'directionChange 2s ease-out' : 'none'
                }}>
                    {animatingReverse ? '🔄' : '↺'}
                </div>
            );
        }
        
        return (
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '220px',
                height: '220px',
                border: `3px dashed ${isClockwise ? '#3498db' : '#9b59b6'}`,
                borderRadius: '50%',
                animation: isClockwise ? 
                    'clockwiseRotate 8s linear infinite' : 
                    'counterClockwiseRotate 8s linear infinite'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-15px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '24px',
                    color: isClockwise ? '#3498db' : '#9b59b6'
                }}>
                    {isClockwise ? '➡️' : '⬅️'}
                </div>
                
                {/* Direction label */}
                <div style={{
                    position: 'absolute',
                    bottom: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: isClockwise ? '#3498db' : '#9b59b6',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap'
                }}>
                    {isClockwise ? 'Clockwise' : 'Counter-Clockwise'}
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
                    color: '#9b59b6'
                }}>
                    🔍 Queen Card Comparison
                </h3>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: theme.spacing.large,
                    marginBottom: theme.spacing.large
                }}>
                    {/* Multiplayer */}
                    <div style={{
                        background: 'rgba(155, 89, 182, 0.2)',
                        border: '2px solid #9b59b6',
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium
                    }}>
                        <h4 style={{ color: '#9b59b6', marginBottom: theme.spacing.small }}>
                            👥 Multiplayer (3+ players)
                        </h4>
                        <ul style={{
                            textAlign: 'left',
                            paddingLeft: '20px',
                            margin: 0
                        }}>
                            <li>Reverses turn direction</li>
                            <li>Clockwise ↔ Counter-clockwise</li>
                            <li>Changes entire game flow</li>
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
                            <li>Acts exactly like Jack (skip)</li>
                            <li>You play again immediately</li>
                            <li>Reversal = back to you</li>
                            <li>Double the power!</li>
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
                        • In multiplayer: Use Queen to skip dangerous players by reversing past them<br/>
                        • In 2-player: Queen = Jack, use for momentum like any skip card<br/>
                        • Multiple Queens can reverse back and forth - watch the direction!
                    </p>
                </div>
                
                <button
                    onClick={handleComplete}
                    style={{
                        padding: '12px 24px',
                        background: '#9b59b6',
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
                    ✅ Master the Queen!
                </button>
            </div>
        );
    };
    
    if (gamePhase === 'explanation') {
        return (
            <div style={{
                padding: theme.spacing.xlarge,
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.1), rgba(142, 68, 173, 0.1))',
                borderRadius: theme.borderRadius,
                minHeight: '500px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <div style={{ fontSize: '72px', marginBottom: theme.spacing.medium }}>
                    🔄
                </div>
                <h2 style={{
                    fontSize: '32px',
                    color: '#9b59b6',
                    marginBottom: theme.spacing.medium
                }}>
                    Queen: The Direction Changer
                </h2>
                <p style={{
                    fontSize: '18px',
                    color: theme.colors.text,
                    maxWidth: '600px',
                    margin: '0 auto',
                    lineHeight: 1.6
                }}>
                    The Queen is all about changing the flow of the game by reversing turn direction. 
                    But in 2-player games, it becomes something even more powerful!
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
                
                @keyframes playerNextInLine {
                    0%, 100% { 
                        box-shadow: 0 0 15px #f39c12, 0 0 30px rgba(243, 156, 18, 0.5);
                    }
                    50% { 
                        box-shadow: 0 0 25px #f39c12, 0 0 50px rgba(243, 156, 18, 0.8);
                    }
                }
                
                @keyframes reverseEffect {
                    0% { 
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.5) rotate(0deg);
                    }
                    50% { 
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
                    }
                    100% { 
                        opacity: 0;
                        transform: translate(-50%, -50%) scale(0.8) rotate(360deg);
                    }
                }
                
                @keyframes queenPlayed {
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
                
                @keyframes counterClockwiseRotate {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(-360deg); }
                }
                
                @keyframes directionChange {
                    0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                    50% { transform: translate(-50%, -50%) scale(1.3) rotate(180deg); }
                    100% { transform: translate(-50%, -50%) scale(1) rotate(360deg); }
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
                
                @keyframes actionHighlight {
                    0% { background-color: rgba(155, 89, 182, 0.8); }
                    100% { background-color: rgba(255, 255, 255, 0.1); }
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
                    background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.1), rgba(142, 68, 173, 0.1))',
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
                        color: '#9b59b6',
                        marginBottom: theme.spacing.small
                    }}>
                        🔄 {scenario.title}
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
                            <div style={{ fontSize: '20px', marginBottom: '5px' }}>🔄</div>
                            <div style={{ fontWeight: 'bold' }}>Queen Reverse</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                {scenario.playerCount} Players
                            </div>
                        </div>
                        
                        {/* Direction Indicator */}
                        {renderDirectionIndicator(scenario)}
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
                        color: '#9b59b6'
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
                            Watch the Queen reverse the flow...
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
                    background: 'rgba(155, 89, 182, 0.1)',
                    border: `2px solid #9b59b6`,
                    borderRadius: theme.borderRadius,
                    padding: theme.spacing.medium,
                    textAlign: 'center',
                    marginBottom: theme.spacing.large
                }}>
                    <h4 style={{ 
                        color: '#9b59b6', 
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
                            background: '#9b59b6',
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
                                background: index === currentScenario ? '#9b59b6' : 
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

export default QueenLesson;