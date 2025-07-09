/**
 * AceLesson.js - Draw 4 mechanics and counter introduction
 * Teaches Ace card mechanics, draw 4 effects, and basic counter concepts
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Ace lesson component for learning draw 4 mechanics
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback when lesson is completed
 * @param {Function} props.onProgress - Callback for progress updates
 * @param {Object} props.tutorialEngine - Tutorial engine instance
 * @param {Object} props.theme - Theme configuration
 */
const AceLesson = ({
    onComplete,
    onProgress,
    tutorialEngine,
    theme
}) => {
    // State management
    const [currentScenario, setCurrentScenario] = useState(0);
    const [gamePhase, setGamePhase] = useState('explanation');
    const [drawStack, setDrawStack] = useState(0);
    const [players, setPlayers] = useState([]);
    const [gameActions, setGameActions] = useState([]);
    const [animatingDraw, setAnimatingDraw] = useState(false);
    const [practiceProgress, setPracticeProgress] = useState({});
    const [showCounterDemo, setShowCounterDemo] = useState(false);
    const [isStacking, setIsStacking] = useState(false);
    
    // Refs
    const containerRef = useRef(null);
    const playersRef = useRef([]);
    
    // Lesson configuration
    const lessonData = {
        id: 'ace-lesson',
        title: 'Ace: Draw 4 Power',
        description: 'Master the Ace card and its draw 4 mechanics',
        estimatedTime: '4 minutes',
        difficulty: 'beginner',
        objectives: [
            {
                id: 'understand-draw4',
                description: 'Understand how Ace forces drawing 4 cards',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'learn-countering',
                description: 'Learn how to counter Aces with other Aces',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'practice-ace-strategy',
                description: 'Practice strategic Ace timing',
                type: 'practical',
                completed: false
            }
        ]
    };
    
    // Game scenarios for demonstration
    const scenarios = [
        {
            id: 'basic-ace',
            title: 'Basic Ace: Draw 4 Effect',
            description: 'See how Ace forces the next player to draw 4 cards',
            players: [
                { id: 'you', name: 'You', position: { x: 50, y: 80 }, isActive: true, cards: 5 },
                { id: 'alice', name: 'Alice', position: { x: 20, y: 40 }, isActive: false, cards: 6 },
                { id: 'bob', name: 'Bob', position: { x: 50, y: 20 }, isActive: false, cards: 4 },
                { id: 'carol', name: 'Carol', position: { x: 80, y: 40 }, isActive: false, cards: 7 }
            ],
            acePlayer: 0,
            targetPlayer: 1,
            drawAmount: 4,
            explanation: 'Alice must draw 4 cards and lose her turn'
        },
        {
            id: 'ace-counter',
            title: 'Ace Counter: Stack the Draw!',
            description: 'See how another Ace can counter and stack the draw amount',
            players: [
                { id: 'you', name: 'You', position: { x: 50, y: 80 }, isActive: true, cards: 5 },
                { id: 'alice', name: 'Alice', position: { x: 20, y: 40 }, isActive: false, cards: 6 },
                { id: 'bob', name: 'Bob', position: { x: 50, y: 20 }, isActive: false, cards: 4 },
                { id: 'carol', name: 'Carol', position: { x: 80, y: 40 }, isActive: false, cards: 7 }
            ],
            acePlayer: 0,
            counterPlayer: 1,
            finalTarget: 2,
            drawAmount: 8,
            explanation: 'Alice counters with another Ace, now Bob draws 8 cards!'
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
            isActive: index === scenario.acePlayer,
            playedAce: false,
            mustDraw: false,
            cardsDrawn: 0
        }));
        
        setPlayers(initialPlayers);
        setDrawStack(0);
        setGameActions([]);
        setAnimatingDraw(false);
        setIsStacking(false);
        
        // Start the demonstration after a brief delay
        setTimeout(() => {
            if (scenario.id === 'ace-counter') {
                demonstrateAceCounter(scenario);
            } else {
                demonstrateBasicAce(scenario);
            }
        }, 1500);
    };
    
    /**
     * Demonstrate basic Ace play
     */
    const demonstrateBasicAce = async (scenario) => {
        const aceSuits = ['♠', '♥', '♣', '♦'];
        const aceSuit = aceSuits[Math.floor(Math.random() * aceSuits.length)];
        
        // 1. Show Ace being played
        const playAction = {
            id: Date.now(),
            player: scenario.players[scenario.acePlayer].name,
            action: `played A${aceSuit}`,
            type: 'ace',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions([playAction]);
        
        // Mark player as having played Ace
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            playedAce: index === scenario.acePlayer
        })));
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 2. Show draw stack building
        setDrawStack(4);
        setAnimatingDraw(true);
        
        const drawAction = {
            id: Date.now() + 1,
            player: scenario.players[scenario.targetPlayer].name,
            action: 'must draw 4 cards!',
            type: 'draw-penalty',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, drawAction]);
        
        // Mark target player as must draw
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            mustDraw: index === scenario.targetPlayer,
            isActive: false
        })));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Show cards being drawn
        for (let i = 1; i <= 4; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setPlayers(prev => prev.map((player, index) => {
                if (index === scenario.targetPlayer) {
                    return {
                        ...player,
                        cards: player.cards + 1,
                        cardsDrawn: i
                    };
                }
                return player;
            }));
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 4. Show turn skip and reset
        setDrawStack(0);
        setAnimatingDraw(false);
        
        const skipAction = {
            id: Date.now() + 2,
            player: scenario.players[scenario.targetPlayer].name,
            action: 'turn skipped after drawing',
            type: 'skip',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, skipAction]);
        
        // Move to next player (after target)
        const nextPlayer = (scenario.targetPlayer + 1) % scenario.players.length;
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            isActive: index === nextPlayer,
            playedAce: false,
            mustDraw: false
        })));
        
        const nextAction = {
            id: Date.now() + 3,
            player: scenario.players[nextPlayer].name,
            action: 'begins turn',
            type: 'next-turn',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, nextAction]);
        
        // Mark scenario progress
        setPracticeProgress(prev => ({
            ...prev,
            [scenario.id]: true
        }));
        
        // Auto-advance
        setTimeout(() => {
            if (scenarioIndex < scenarios.length - 1) {
                initializeScenario(scenarioIndex + 1);
            } else {
                setGamePhase('summary');
                setShowCounterDemo(true);
            }
        }, 3000);
    };
    
    /**
     * Demonstrate Ace counter mechanics
     */
    const demonstrateAceCounter = async (scenario) => {
        const aceSuits = ['♠', '♥', '♣', '♦'];
        const firstAceSuit = aceSuits[Math.floor(Math.random() * aceSuits.length)];
        const secondAceSuit = aceSuits[Math.floor(Math.random() * aceSuits.length)];
        
        // 1. First Ace played
        const firstAceAction = {
            id: Date.now(),
            player: scenario.players[scenario.acePlayer].name,
            action: `played A${firstAceSuit}`,
            type: 'ace',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions([firstAceAction]);
        setDrawStack(4);
        
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            playedAce: index === scenario.acePlayer
        })));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 2. Show counter opportunity
        const counterOpportunityAction = {
            id: Date.now() + 1,
            player: scenario.players[scenario.counterPlayer].name,
            action: 'can counter with another Ace!',
            type: 'counter-opportunity',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, counterOpportunityAction]);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Counter Ace played
        setIsStacking(true);
        const counterAction = {
            id: Date.now() + 2,
            player: scenario.players[scenario.counterPlayer].name,
            action: `countered with A${secondAceSuit}!`,
            type: 'ace-counter',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, counterAction]);
        setDrawStack(8); // Stack increases
        
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            playedAce: index === scenario.counterPlayer,
            isActive: index === scenario.counterPlayer
        })));
        
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // 4. Show final target
        setAnimatingDraw(true);
        const finalDrawAction = {
            id: Date.now() + 3,
            player: scenario.players[scenario.finalTarget].name,
            action: 'must draw 8 cards!',
            type: 'draw-penalty',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, finalDrawAction]);
        
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            mustDraw: index === scenario.finalTarget,
            isActive: false,
            playedAce: false
        })));
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 5. Draw cards animation
        for (let i = 1; i <= 8; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            
            setPlayers(prev => prev.map((player, index) => {
                if (index === scenario.finalTarget) {
                    return {
                        ...player,
                        cards: player.cards + 1,
                        cardsDrawn: i
                    };
                }
                return player;
            }));
        }
        
        // 6. Reset and continue
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setDrawStack(0);
        setAnimatingDraw(false);
        setIsStacking(false);
        
        const completeAction = {
            id: Date.now() + 4,
            player: 'Penalty',
            action: 'complete! Game continues.',
            type: 'complete',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, completeAction]);
        
        // Mark scenario progress
        setPracticeProgress(prev => ({
            ...prev,
            [scenario.id]: true
        }));
        
        // Show summary
        setTimeout(() => {
            setGamePhase('summary');
            setShowCounterDemo(true);
        }, 2000);
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
        const playedAce = player.playedAce;
        const mustDraw = player.mustDraw;
        const cardsDrawn = player.cardsDrawn;
        
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
                    width: '120px',
                    height: '120px',
                    background: playerColor,
                    borderRadius: '50%',
                    border: isActive ? '4px solid #fff' :
                           mustDraw ? '4px solid #e74c3c' :
                           '2px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'all 0.4s ease',
                    boxShadow: isActive ? 
                        `0 0 20px ${playerColor}, 0 0 40px rgba(255, 255, 255, 0.5)` :
                        mustDraw ?
                        '0 0 20px #e74c3c, 0 0 40px rgba(231, 76, 60, 0.5)' :
                        `0 4px 15px rgba(0, 0, 0, 0.2)`,
                    animation: isActive ? 'playerActive 2s infinite' :
                              mustDraw ? 'playerPenalty 1s infinite' :
                              'none',
                    zIndex: isActive || mustDraw ? 10 : 1
                }}
            >
                <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                    {player.name}
                </div>
                <div style={{ 
                    fontSize: '12px', 
                    opacity: 0.9,
                    marginTop: '2px'
                }}>
                    {player.cards} cards
                </div>
                
                {/* Ace indicator */}
                {playedAce && (
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#e74c3c',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        animation: 'acePlayed 0.8s ease-out'
                    }}>
                        A♠ Played!
                    </div>
                )}
                
                {/* Draw cards animation */}
                {mustDraw && animatingDraw && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '24px',
                        animation: 'drawCards 1s infinite',
                        zIndex: 20,
                        pointerEvents: 'none'
                    }}>
                        📚
                    </div>
                )}
                
                {/* Cards drawn counter */}
                {cardsDrawn > 0 && (
                    <div style={{
                        position: 'absolute',
                        bottom: '-25px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#e74c3c',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                    }}>
                        +{cardsDrawn} cards
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
     * Render draw stack indicator
     */
    const renderDrawStack = () => {
        if (drawStack === 0) return null;
        
        return (
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: isStacking ? 
                    'linear-gradient(45deg, #e74c3c, #c0392b)' : 
                    '#e74c3c',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '20px',
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
                animation: isStacking ? 'stackPulse 1s infinite' : 'drawStackPulse 2s infinite',
                zIndex: 15
            }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📚</div>
                <div>Draw {drawStack}</div>
                {isStacking && (
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        STACKING!
                    </div>
                )}
            </div>
        );
    };
    
    /**
     * Render summary view
     */
    const renderSummary = () => {
        if (!showCounterDemo) return null;
        
        return (
            <div style={{
                background: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                padding: theme.spacing.xlarge,
                borderRadius: theme.borderRadius,
                textAlign: 'center',
                animation: 'summarySlideIn 0.6s ease-out'
            }}>
                <h3 style={{
                    fontSize: '24px',
                    marginBottom: theme.spacing.large,
                    color: '#e74c3c'
                }}>
                    📚 Ace Card Mastery
                </h3>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: theme.spacing.large,
                    marginBottom: theme.spacing.large
                }}>
                    {/* Basic Ace */}
                    <div style={{
                        background: 'rgba(231, 76, 60, 0.2)',
                        border: '2px solid #e74c3c',
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium
                    }}>
                        <h4 style={{ color: '#e74c3c', marginBottom: theme.spacing.small }}>
                            📚 Basic Ace Effect
                        </h4>
                        <ul style={{
                            textAlign: 'left',
                            paddingLeft: '20px',
                            margin: 0
                        }}>
                            <li>Next player draws 4 cards</li>
                            <li>Target player's turn is skipped</li>
                            <li>Powerful disruption tool</li>
                            <li>Can't be ignored!</li>
                        </ul>
                    </div>
                    
                    {/* Counter Mechanics */}
                    <div style={{
                        background: 'rgba(243, 156, 18, 0.2)',
                        border: '2px solid #f39c12',
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium
                    }}>
                        <h4 style={{ color: '#f39c12', marginBottom: theme.spacing.small }}>
                            🛡️ Counter Defense
                        </h4>
                        <ul style={{
                            textAlign: 'left',
                            paddingLeft: '20px',
                            margin: 0
                        }}>
                            <li>Play another Ace to counter</li>
                            <li>Draw amount stacks (4 + 4 = 8)</li>
                            <li>Passes penalty to next player</li>
                            <li>Strategic defense mechanism</li>
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
                        💡 Advanced Strategy
                    </h4>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                        • Hold Aces as defensive cards to counter opponents' Aces<br/>
                        • Use Aces offensively when opponents have many cards<br/>
                        • Multiple Aces can create devastating draw stacks<br/>
                        • Same-suit 2s can also counter Aces (advanced concept!)
                    </p>
                </div>
                
                <button
                    onClick={handleComplete}
                    style={{
                        padding: '12px 24px',
                        background: '#e74c3c',
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
                    ✅ Master the Ace!
                </button>
            </div>
        );
    };
    
    if (gamePhase === 'explanation') {
        return (
            <div style={{
                padding: theme.spacing.xlarge,
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(192, 57, 43, 0.1))',
                borderRadius: theme.borderRadius,
                minHeight: '500px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <div style={{ fontSize: '72px', marginBottom: theme.spacing.medium }}>
                    📚
                </div>
                <h2 style={{
                    fontSize: '32px',
                    color: '#e74c3c',
                    marginBottom: theme.spacing.medium
                }}>
                    Ace: The Draw 4 Destroyer
                </h2>
                <p style={{
                    fontSize: '18px',
                    color: theme.colors.text,
                    maxWidth: '600px',
                    margin: '0 auto',
                    lineHeight: 1.6
                }}>
                    The Ace is the most powerful offensive card in Crazy 8's. It forces opponents to draw 4 cards 
                    and skip their turn - unless they have an Ace to counter with!
                </p>
            </div>
        );
    }
    
    if (gamePhase === 'summary') {
        return renderSummary();
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
                
                @keyframes playerPenalty {
                    0%, 100% { 
                        box-shadow: 0 0 20px #e74c3c, 0 0 40px rgba(231, 76, 60, 0.5);
                    }
                    50% { 
                        box-shadow: 0 0 30px #e74c3c, 0 0 60px rgba(231, 76, 60, 0.8);
                    }
                }
                
                @keyframes drawCards {
                    0%, 100% { 
                        transform: translate(-50%, -50%) scale(1) rotate(0deg);
                    }
                    25% { 
                        transform: translate(-50%, -50%) scale(1.2) rotate(5deg);
                    }
                    75% { 
                        transform: translate(-50%, -50%) scale(1.2) rotate(-5deg);
                    }
                }
                
                @keyframes acePlayed {
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
                
                @keyframes drawStackPulse {
                    0%, 100% { transform: translateX(-50%) scale(1); }
                    50% { transform: translateX(-50%) scale(1.1); }
                }
                
                @keyframes stackPulse {
                    0%, 100% { 
                        transform: translateX(-50%) scale(1);
                        background: linear-gradient(45deg, #e74c3c, #c0392b);
                    }
                    50% { 
                        transform: translateX(-50%) scale(1.15);
                        background: linear-gradient(45deg, #c0392b, #e74c3c);
                    }
                }
                
                @keyframes summarySlideIn {
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
                    0% { background-color: rgba(231, 76, 60, 0.8); }
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
                    background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.1), rgba(192, 57, 43, 0.1))',
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
                        color: '#e74c3c',
                        marginBottom: theme.spacing.small
                    }}>
                        📚 {scenario.title}
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
                        borderRadius: '50%',
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
                            <div style={{ fontSize: '20px', marginBottom: '5px' }}>📚</div>
                            <div style={{ fontWeight: 'bold' }}>Ace Draw 4</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                {scenario.id === 'ace-counter' ? 'Counter Demo' : 'Basic Demo'}
                            </div>
                        </div>
                    </div>
                    
                    {/* Draw Stack */}
                    {renderDrawStack()}
                    
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
                        color: '#e74c3c'
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
                            Watch the Ace in action...
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
                    background: 'rgba(231, 76, 60, 0.1)',
                    border: `2px solid #e74c3c`,
                    borderRadius: theme.borderRadius,
                    padding: theme.spacing.medium,
                    textAlign: 'center',
                    marginBottom: theme.spacing.large
                }}>
                    <h4 style={{ 
                        color: '#e74c3c', 
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
                            background: '#e74c3c',
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
                                background: index === currentScenario ? '#e74c3c' : 
                                           practiceProgress[s.id] ? theme.colors.success : 
                                           theme.colors.secondary,
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            {s.id === 'ace-counter' ? '🛡️ Counter' : '📚 Basic'}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default AceLesson;