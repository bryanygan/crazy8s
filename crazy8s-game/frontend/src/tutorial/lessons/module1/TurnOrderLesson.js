/**
 * TurnOrderLesson.js - Understand turn progression
 * Teaches players how turns work, turn order, and what happens on each turn
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Turn order lesson component for understanding game flow and turn mechanics
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback when lesson is completed
 * @param {Function} props.onProgress - Callback for progress updates
 * @param {Object} props.tutorialEngine - Tutorial engine instance
 * @param {Object} props.theme - Theme configuration
 */
const TurnOrderLesson = ({
    onComplete,
    onProgress,
    tutorialEngine,
    theme
}) => {
    // State management
    const [currentTurn, setCurrentTurn] = useState(0);
    const [gamePhase, setGamePhase] = useState('setup');
    const [turnCount, setTurnCount] = useState(0);
    const [players, setPlayers] = useState([]);
    const [gameActions, setGameActions] = useState([]);
    const [showTurnIndicator, setShowTurnIndicator] = useState(false);
    const [animatingAction, setAnimatingAction] = useState(false);
    const [completedCycles, setCompletedCycles] = useState(0);
    const [playerInteractionCount, setPlayerInteractionCount] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    
    // Refs
    const containerRef = useRef(null);
    const playersRef = useRef([]);
    const actionLogRef = useRef(null);
    
    // Lesson configuration
    const lessonData = {
        id: 'turn-order',
        title: 'Turn Order & Game Flow',
        description: 'Learn how turns work in Crazy 8\'s',
        estimatedTime: '3 minutes',
        difficulty: 'beginner',
        objectives: [
            {
                id: 'understand-clockwise',
                description: 'Understand clockwise turn progression',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'recognize-turn-actions',
                description: 'Recognize possible actions on each turn',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'experience-full-cycle',
                description: 'Experience a complete turn cycle',
                type: 'practical',
                completed: false
            }
        ]
    };
    
    // Player setup for demonstration
    const playerSetup = [
        {
            id: 'player',
            name: 'You',
            type: 'human',
            position: { x: 50, y: 80 },
            cards: 6,
            isActive: false,
            color: '#3498db'
        },
        {
            id: 'ai1',
            name: 'Alice',
            type: 'ai',
            position: { x: 20, y: 40 },
            cards: 7,
            isActive: false,
            color: '#e74c3c'
        },
        {
            id: 'ai2',
            name: 'Bob',
            type: 'ai',
            position: { x: 50, y: 20 },
            cards: 5,
            isActive: false,
            color: '#f39c12'
        },
        {
            id: 'ai3',
            name: 'Carol',
            type: 'ai',
            position: { x: 80, y: 40 },
            cards: 8,
            isActive: false,
            color: '#27ae60'
        }
    ];
    
    // Possible turn actions for demonstration
    const turnActions = [
        { type: 'play', text: 'played 7♠', duration: 1500 },
        { type: 'draw', text: 'drew a card', duration: 1200 },
        { type: 'play', text: 'played Q♠', duration: 1500 },
        { type: 'play_multiple', text: 'played 3♥ + 3♠', duration: 2000 },
        { type: 'draw', text: 'drew a card', duration: 1200 },
        { type: 'pass', text: 'passed turn', duration: 1000 },
        { type: 'play_wild', text: 'played 8♣ (wild)', duration: 2000 },
        { type: 'play', text: 'played A♦', duration: 1500 }
    ];
    
    /**
     * Initialize lesson
     */
    useEffect(() => {
        initializeGame();
        onProgress({
            lessonId: lessonData.id,
            progress: 0,
            phase: 'setup'
        });
    }, []);
    
    /**
     * Initialize the game demonstration
     */
    const initializeGame = () => {
        const initialPlayers = playerSetup.map(player => ({
            ...player,
            isActive: player.id === 'player'
        }));
        
        setPlayers(initialPlayers);
        setCurrentTurn(0);
        setGamePhase('playing');
        setShowTurnIndicator(true);
        
        // Start the turn cycle after a brief delay
        setTimeout(() => {
            startTurnCycle();
        }, 2000);
    };
    
    /**
     * Start the automatic turn cycle demonstration
     */
    const startTurnCycle = () => {
        setGamePhase('auto_play');
        processTurns();
    };
    
    /**
     * Process turns automatically for demonstration
     */
    const processTurns = async () => {
        for (let cycle = 0; cycle < 2; cycle++) {
            for (let i = 0; i < players.length; i++) {
                await processSingleTurn(i);
                
                if (i === 0) { // Player's turn
                    setPlayerInteractionCount(prev => prev + 1);
                }
            }
            setCompletedCycles(prev => prev + 1);
        }
        
        completeLesson();
    };
    
    /**
     * Process a single player's turn
     */
    const processSingleTurn = async (playerIndex) => {
        return new Promise((resolve) => {
            // Update active player
            setPlayers(prev => prev.map((player, index) => ({
                ...player,
                isActive: index === playerIndex
            })));
            
            setCurrentTurn(playerIndex);
            setAnimatingAction(true);
            
            // Simulate turn action
            const action = turnActions[turnCount % turnActions.length];
            const currentPlayer = playerSetup[playerIndex];
            
            const newAction = {
                id: Date.now(),
                player: currentPlayer.name,
                playerId: currentPlayer.id,
                action: action.text,
                type: action.type,
                timestamp: new Date().toLocaleTimeString()
            };
            
            setGameActions(prev => [...prev.slice(-5), newAction]);
            setTurnCount(prev => prev + 1);
            
            // Show feedback for player turns
            if (playerIndex === 0) {
                setFeedbackMessage(`🎯 It's your turn! You ${action.text}.`);
                setShowFeedback(true);
                setTimeout(() => setShowFeedback(false), 2500);
            }
            
            // Complete turn after action duration
            setTimeout(() => {
                setAnimatingAction(false);
                resolve();
            }, action.duration);
        });
    };
    
    /**
     * Handle manual turn advance (when player clicks)
     */
    const handlePlayerAction = () => {
        if (gamePhase === 'playing' && currentTurn === 0) {
            const action = turnActions[0];
            const newAction = {
                id: Date.now(),
                player: 'You',
                playerId: 'player',
                action: action.text,
                type: action.type,
                timestamp: new Date().toLocaleTimeString()
            };
            
            setGameActions(prev => [...prev, newAction]);
            setPlayerInteractionCount(prev => prev + 1);
            
            // Advance to next player
            advanceToNextPlayer();
        }
    };
    
    /**
     * Advance to the next player
     */
    const advanceToNextPlayer = () => {
        const nextTurn = (currentTurn + 1) % players.length;
        setCurrentTurn(nextTurn);
        
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            isActive: index === nextTurn
        })));
    };
    
    /**
     * Complete the lesson
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
            turnsObserved: turnCount,
            playerInteractions: playerInteractionCount,
            cyclesCompleted: completedCycles
        });
    };
    
    /**
     * Calculate lesson score
     */
    const calculateScore = () => {
        const baseScore = 100;
        const interactionBonus = playerInteractionCount * 10;
        return Math.min(100, baseScore + interactionBonus);
    };
    
    /**
     * Render a player avatar
     */
    const renderPlayer = (player, index) => {
        const isCurrentTurn = player.isActive;
        const position = player.position;
        
        return (
            <div
                key={player.id}
                ref={el => playersRef.current[index] = el}
                style={{
                    position: 'absolute',
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '100px',
                    height: '100px',
                    background: player.color,
                    borderRadius: '50%',
                    border: isCurrentTurn ? '4px solid #fff' : '2px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: player.id === 'player' && gamePhase === 'playing' ? 'pointer' : 'default',
                    transition: 'all 0.4s ease',
                    boxShadow: isCurrentTurn ? 
                        `0 0 20px ${player.color}, 0 0 40px rgba(255, 255, 255, 0.5)` : 
                        `0 4px 15px rgba(0, 0, 0, 0.2)`,
                    animation: isCurrentTurn ? 'turnIndicator 2s infinite' : 'none',
                    zIndex: isCurrentTurn ? 10 : 1
                }}
                onClick={() => player.id === 'player' && handlePlayerAction()}
                title={player.id === 'player' ? 'Click when it\'s your turn!' : `${player.name}'s turn`}
            >
                <div style={{ fontSize: '14px', textAlign: 'center' }}>
                    {player.name}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    {player.cards} cards
                </div>
                
                {/* Turn indicator arrow */}
                {isCurrentTurn && (
                    <div style={{
                        position: 'absolute',
                        top: '-30px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '20px',
                        animation: 'arrowBounce 1s infinite'
                    }}>
                        👆
                    </div>
                )}
                
                {/* Player type indicator */}
                <div style={{
                    position: 'absolute',
                    bottom: '-25px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '12px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    whiteSpace: 'nowrap'
                }}>
                    {player.type === 'human' ? '👤 You' : '🤖 AI'}
                </div>
            </div>
        );
    };
    
    /**
     * Render turn order visualization
     */
    const renderTurnOrderGuide = () => {
        return (
            <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: theme.spacing.medium,
                borderRadius: theme.borderRadius,
                fontSize: '14px',
                zIndex: 20
            }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#3498db' }}>
                    🔄 Turn Order (Clockwise)
                </h4>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                    {playerSetup.map((player, index) => (
                        <li 
                            key={player.id}
                            style={{
                                marginBottom: '5px',
                                fontWeight: currentTurn === index ? 'bold' : 'normal',
                                color: currentTurn === index ? player.color : 'white'
                            }}
                        >
                            {player.name} {currentTurn === index && '← Current'}
                        </li>
                    ))}
                </ol>
            </div>
        );
    };
    
    /**
     * Render action log
     */
    const renderActionLog = () => {
        return (
            <div style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                width: '300px',
                maxHeight: '200px',
                background: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                borderRadius: theme.borderRadius,
                overflow: 'hidden',
                zIndex: 20
            }}>
                <div style={{
                    padding: theme.spacing.small,
                    background: '#3498db',
                    fontWeight: 'bold',
                    fontSize: '14px'
                }}>
                    📝 Recent Actions
                </div>
                <div 
                    ref={actionLogRef}
                    style={{
                        maxHeight: '150px',
                        overflowY: 'auto',
                        padding: theme.spacing.small
                    }}
                >
                    {gameActions.length === 0 ? (
                        <div style={{ 
                            fontStyle: 'italic', 
                            color: '#bdc3c7',
                            textAlign: 'center',
                            padding: '20px'
                        }}>
                            Game actions will appear here...
                        </div>
                    ) : (
                        gameActions.map((action, index) => (
                            <div 
                                key={action.id}
                                style={{
                                    padding: '8px',
                                    marginBottom: '4px',
                                    background: action.playerId === 'player' ? 
                                        'rgba(52, 152, 219, 0.2)' : 
                                        'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    borderLeft: `3px solid ${
                                        playerSetup.find(p => p.id === action.playerId)?.color || '#fff'
                                    }`,
                                    animation: index === gameActions.length - 1 ? 
                                        'newActionHighlight 1s ease-out' : 'none'
                                }}
                            >
                                <div style={{ fontWeight: 'bold' }}>
                                    {action.player}
                                </div>
                                <div style={{ color: '#ecf0f1' }}>
                                    {action.action}
                                </div>
                                <div style={{ 
                                    fontSize: '11px', 
                                    color: '#95a5a6',
                                    marginTop: '2px'
                                }}>
                                    {action.timestamp}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };
    
    return (
        <>
            {/* CSS Animations */}
            <style jsx>{`
                @keyframes turnIndicator {
                    0%, 100% { 
                        box-shadow: 0 0 20px currentColor, 0 0 40px rgba(255, 255, 255, 0.5);
                        transform: translate(-50%, -50%) scale(1);
                    }
                    50% { 
                        box-shadow: 0 0 30px currentColor, 0 0 60px rgba(255, 255, 255, 0.8);
                        transform: translate(-50%, -50%) scale(1.05);
                    }
                }
                
                @keyframes arrowBounce {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(-5px); }
                }
                
                @keyframes newActionHighlight {
                    0% { background-color: rgba(46, 204, 113, 0.8); }
                    100% { background-color: rgba(255, 255, 255, 0.1); }
                }
                
                @keyframes gameTableSpin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes lessonFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                .turn-lesson {
                    animation: lessonFadeIn 0.8s ease-out;
                }
                
                .table-surface {
                    background: radial-gradient(circle at center, #27ae60, #229954);
                    border: 8px solid #8B4513;
                    border-radius: 50%;
                    position: relative;
                }
                
                .table-surface::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 60%;
                    height: 60%;
                    border: 2px dashed rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    animation: gameTableSpin 20s linear infinite;
                }
                
                @media (max-width: 768px) {
                    .player-avatar {
                        width: 80px !important;
                        height: 80px !important;
                        font-size: 12px !important;
                    }
                    
                    .action-log {
                        width: calc(100% - 20px) !important;
                        bottom: 10px !important;
                        left: 10px !important;
                        right: 10px !important;
                    }
                    
                    .turn-order-guide {
                        position: relative !important;
                        top: auto !important;
                        left: auto !important;
                        margin-bottom: 20px !important;
                    }
                }
            `}</style>
            
            {/* Main Container */}
            <div
                ref={containerRef}
                className="turn-lesson"
                style={{
                    padding: theme.spacing.large,
                    background: 'linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(52, 152, 219, 0.1))',
                    borderRadius: theme.borderRadius,
                    minHeight: '700px',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: theme.spacing.large,
                    zIndex: 20,
                    position: 'relative'
                }}>
                    <h2 style={{
                        fontSize: '28px',
                        color: theme.colors.primary,
                        marginBottom: theme.spacing.small
                    }}>
                        🔄 Turn Order & Game Flow
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: theme.colors.text,
                        margin: 0,
                        maxWidth: '600px',
                        marginLeft: 'auto',
                        marginRight: 'auto'
                    }}>
                        Watch how turns progress clockwise around the table. 
                        {gamePhase === 'playing' && ' Click on yourself when it\'s your turn!'}
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
                    <div className="table-surface" style={{
                        width: '100%',
                        height: '100%'
                    }}>
                        {/* Center Game Info */}
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            padding: theme.spacing.medium,
                            borderRadius: '50%',
                            width: '120px',
                            height: '120px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            zIndex: 5
                        }}>
                            <div style={{ fontSize: '20px', marginBottom: '5px' }}>🃏</div>
                            <div style={{ fontWeight: 'bold' }}>Turn {turnCount + 1}</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                {gamePhase === 'auto_play' ? 'Auto Demo' : 'Interactive'}
                            </div>
                        </div>
                    </div>
                    
                    {/* Players */}
                    {players.map((player, index) => renderPlayer(player, index))}
                </div>
                
                {/* Turn Order Guide */}
                {renderTurnOrderGuide()}
                
                {/* Action Log */}
                {renderActionLog()}
                
                {/* Feedback */}
                {showFeedback && (
                    <div style={{
                        position: 'absolute',
                        top: '100px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(52, 152, 219, 0.95)',
                        color: 'white',
                        padding: theme.spacing.medium,
                        borderRadius: theme.borderRadius,
                        fontSize: '16px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        boxShadow: theme.boxShadow,
                        zIndex: 1000,
                        animation: 'newActionHighlight 0.5s ease-out'
                    }}>
                        {feedbackMessage}
                    </div>
                )}
                
                {/* Progress Indicator */}
                <div style={{
                    position: 'absolute',
                    top: theme.spacing.medium,
                    right: theme.spacing.medium,
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: theme.spacing.small,
                    borderRadius: theme.borderRadius,
                    fontSize: '14px',
                    zIndex: 20
                }}>
                    <div>Cycles: {completedCycles}/2</div>
                    <div>Your turns: {playerInteractionCount}</div>
                </div>
                
                {/* Instructions */}
                {gamePhase === 'playing' && (
                    <div style={{
                        position: 'absolute',
                        bottom: theme.spacing.large,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(243, 156, 18, 0.9)',
                        color: 'white',
                        padding: theme.spacing.medium,
                        borderRadius: theme.borderRadius,
                        fontSize: '16px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        animation: 'arrowBounce 2s infinite',
                        zIndex: 20
                    }}>
                        👆 Click on your avatar when it's highlighted to take your turn!
                    </div>
                )}
            </div>
        </>
    );
};

export default TurnOrderLesson;