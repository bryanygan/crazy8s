/**
 * TwoLesson.js - Draw 2 mechanics and stacking preview
 * Teaches 2 card mechanics, draw 2 effects, and advanced stacking concepts
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Two lesson component for learning draw 2 mechanics
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback when lesson is completed
 * @param {Function} props.onProgress - Callback for progress updates
 * @param {Object} props.tutorialEngine - Tutorial engine instance
 * @param {Object} props.theme - Theme configuration
 */
const TwoLesson = ({
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
    const [showAdvancedDemo, setShowAdvancedDemo] = useState(false);
    const [stackingChain, setStackingChain] = useState([]);
    const [isMultiStacking, setIsMultiStacking] = useState(false);
    
    // Refs
    const containerRef = useRef(null);
    const playersRef = useRef([]);
    
    // Lesson configuration
    const lessonData = {
        id: 'two-lesson',
        title: 'Two: Draw 2 Power',
        description: 'Master the 2 card and its stacking mechanics',
        estimatedTime: '4 minutes',
        difficulty: 'intermediate',
        objectives: [
            {
                id: 'understand-draw2',
                description: 'Understand how 2 forces drawing 2 cards',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'learn-stacking',
                description: 'Learn how 2s can stack together',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'practice-ace-cross-counter',
                description: 'Practice Ace-2 cross-countering',
                type: 'practical',
                completed: false
            }
        ]
    };
    
    // Game scenarios for demonstration
    const scenarios = [
        {
            id: 'basic-two',
            title: 'Basic 2: Draw 2 Effect',
            description: 'See how 2 forces the next player to draw 2 cards',
            players: [
                { id: 'you', name: 'You', position: { x: 50, y: 80 }, isActive: true, cards: 5 },
                { id: 'alice', name: 'Alice', position: { x: 20, y: 40 }, isActive: false, cards: 6 },
                { id: 'bob', name: 'Bob', position: { x: 50, y: 20 }, isActive: false, cards: 4 },
                { id: 'carol', name: 'Carol', position: { x: 80, y: 40 }, isActive: false, cards: 7 }
            ],
            twoPlayer: 0,
            targetPlayer: 1,
            drawAmount: 2,
            explanation: 'Alice must draw 2 cards and lose her turn'
        },
        {
            id: 'two-stacking',
            title: 'Two Stacking: Multiple 2s!',
            description: 'See how multiple 2s can stack the draw amount',
            players: [
                { id: 'you', name: 'You', position: { x: 50, y: 80 }, isActive: true, cards: 5 },
                { id: 'alice', name: 'Alice', position: { x: 20, y: 40 }, isActive: false, cards: 6 },
                { id: 'bob', name: 'Bob', position: { x: 50, y: 20 }, isActive: false, cards: 4 },
                { id: 'carol', name: 'Carol', position: { x: 80, y: 40 }, isActive: false, cards: 7 }
            ],
            twoPlayer: 0,
            stackPlayers: [1, 2], // Alice and Bob stack
            finalTarget: 3,
            drawAmount: 6,
            explanation: 'Alice and Bob stack 2s, Carol draws 6 cards!'
        },
        {
            id: 'ace-two-cross',
            title: 'Advanced: Ace-2 Cross Counter',
            description: 'See how Ace and 2 can counter each other (same suit)',
            players: [
                { id: 'you', name: 'You', position: { x: 50, y: 80 }, isActive: true, cards: 5 },
                { id: 'alice', name: 'Alice', position: { x: 20, y: 40 }, isActive: false, cards: 6 },
                { id: 'bob', name: 'Bob', position: { x: 50, y: 20 }, isActive: false, cards: 4 },
                { id: 'carol', name: 'Carol', position: { x: 80, y: 40 }, isActive: false, cards: 7 }
            ],
            acePlayer: 0,
            twoCounterPlayer: 1,
            finalTarget: 2,
            drawAmount: 6, // 4 (Ace) + 2 (Two)
            explanation: 'Alice counters Ace with same-suit 2, Bob draws 6 cards!'
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
            isActive: index === scenario.twoPlayer || index === scenario.acePlayer,
            playedCard: null,
            mustDraw: false,
            cardsDrawn: 0
        }));
        
        setPlayers(initialPlayers);
        setDrawStack(0);
        setGameActions([]);
        setAnimatingDraw(false);
        setStackingChain([]);
        setIsMultiStacking(false);
        
        // Start the demonstration after a brief delay
        setTimeout(() => {
            if (scenario.id === 'two-stacking') {
                demonstrateTwoStacking(scenario);
            } else if (scenario.id === 'ace-two-cross') {
                demonstrateAceTwoCross(scenario);
            } else {
                demonstrateBasicTwo(scenario);
            }
        }, 1500);
    };
    
    /**
     * Demonstrate basic 2 play
     */
    const demonstrateBasicTwo = async (scenario) => {
        const twoSuits = ['♠', '♥', '♣', '♦'];
        const twoSuit = twoSuits[Math.floor(Math.random() * twoSuits.length)];
        
        // 1. Show 2 being played
        const playAction = {
            id: Date.now(),
            player: scenario.players[scenario.twoPlayer].name,
            action: `played 2${twoSuit}`,
            type: 'two',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions([playAction]);
        
        // Mark player as having played 2
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            playedCard: index === scenario.twoPlayer ? '2' : null
        })));
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 2. Show draw stack building
        setDrawStack(2);
        setAnimatingDraw(true);
        
        const drawAction = {
            id: Date.now() + 1,
            player: scenario.players[scenario.targetPlayer].name,
            action: 'must draw 2 cards!',
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
        for (let i = 1; i <= 2; i++) {
            await new Promise(resolve => setTimeout(resolve, 600));
            
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
        
        // Move to next player
        const nextPlayer = (scenario.targetPlayer + 1) % scenario.players.length;
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            isActive: index === nextPlayer,
            playedCard: null,
            mustDraw: false
        })));
        
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
                setShowAdvancedDemo(true);
            }
        }, 3000);
    };
    
    /**
     * Demonstrate 2 stacking mechanics
     */
    const demonstrateTwoStacking = async (scenario) => {
        const twoSuits = ['♠', '♥', '♣', '♦'];
        const suits = twoSuits.slice(0, 3); // Use first 3 suits
        
        setIsMultiStacking(true);
        
        // 1. First 2 played
        const firstTwoAction = {
            id: Date.now(),
            player: scenario.players[scenario.twoPlayer].name,
            action: `played 2${suits[0]}`,
            type: 'two',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions([firstTwoAction]);
        setDrawStack(2);
        setStackingChain([{ player: scenario.twoPlayer, card: '2' }]);
        
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            playedCard: index === scenario.twoPlayer ? '2' : null
        })));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 2. Alice stacks another 2
        const aliceStackAction = {
            id: Date.now() + 1,
            player: scenario.players[scenario.stackPlayers[0]].name,
            action: `stacked 2${suits[1]}!`,
            type: 'two-stack',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, aliceStackAction]);
        setDrawStack(4);
        setStackingChain(prev => [...prev, { player: scenario.stackPlayers[0], card: '2' }]);
        
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            playedCard: index === scenario.stackPlayers[0] ? '2' : null,
            isActive: index === scenario.stackPlayers[0]
        })));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Bob stacks another 2
        const bobStackAction = {
            id: Date.now() + 2,
            player: scenario.players[scenario.stackPlayers[1]].name,
            action: `stacked 2${suits[2]}!`,
            type: 'two-stack',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, bobStackAction]);
        setDrawStack(6);
        setStackingChain(prev => [...prev, { player: scenario.stackPlayers[1], card: '2' }]);
        
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            playedCard: index === scenario.stackPlayers[1] ? '2' : null,
            isActive: index === scenario.stackPlayers[1]
        })));
        
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // 4. Carol must draw all 6 cards
        setAnimatingDraw(true);
        const finalDrawAction = {
            id: Date.now() + 3,
            player: scenario.players[scenario.finalTarget].name,
            action: 'must draw all 6 cards!',
            type: 'draw-penalty',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, finalDrawAction]);
        
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            mustDraw: index === scenario.finalTarget,
            isActive: false,
            playedCard: null
        })));
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 5. Draw cards animation
        for (let i = 1; i <= 6; i++) {
            await new Promise(resolve => setTimeout(resolve, 400));
            
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
        
        // 6. Reset
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setDrawStack(0);
        setAnimatingDraw(false);
        setIsMultiStacking(false);
        setStackingChain([]);
        
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
                setShowAdvancedDemo(true);
            }
        }, 2000);
    };
    
    /**
     * Demonstrate Ace-2 cross counter
     */
    const demonstrateAceTwoCross = async (scenario) => {
        const suit = '♠'; // Use spades for both
        
        // 1. Ace played
        const aceAction = {
            id: Date.now(),
            player: scenario.players[scenario.acePlayer].name,
            action: `played A${suit}`,
            type: 'ace',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions([aceAction]);
        setDrawStack(4);
        
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            playedCard: index === scenario.acePlayer ? 'A' : null
        })));
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 2. Show cross-counter opportunity
        const crossCounterAction = {
            id: Date.now() + 1,
            player: scenario.players[scenario.twoCounterPlayer].name,
            action: `can cross-counter with 2${suit}!`,
            type: 'cross-counter-opportunity',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, crossCounterAction]);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Cross-counter with 2
        const counterAction = {
            id: Date.now() + 2,
            player: scenario.players[scenario.twoCounterPlayer].name,
            action: `cross-countered with 2${suit}!`,
            type: 'cross-counter',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, counterAction]);
        setDrawStack(6); // 4 + 2
        
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            playedCard: index === scenario.twoCounterPlayer ? '2' : null,
            isActive: index === scenario.twoCounterPlayer
        })));
        
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        // 4. Final target draws
        setAnimatingDraw(true);
        const finalDrawAction = {
            id: Date.now() + 3,
            player: scenario.players[scenario.finalTarget].name,
            action: 'must draw 6 cards!',
            type: 'draw-penalty',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, finalDrawAction]);
        
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            mustDraw: index === scenario.finalTarget,
            isActive: false,
            playedCard: null
        })));
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 5. Draw animation
        for (let i = 1; i <= 6; i++) {
            await new Promise(resolve => setTimeout(resolve, 350));
            
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
        
        // 6. Reset
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setDrawStack(0);
        setAnimatingDraw(false);
        
        // Mark scenario progress
        setPracticeProgress(prev => ({
            ...prev,
            [scenario.id]: true
        }));
        
        // Show summary
        setTimeout(() => {
            setGamePhase('summary');
            setShowAdvancedDemo(true);
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
        const playedCard = player.playedCard;
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
                           mustDraw ? '4px solid #3498db' :
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
                        '0 0 20px #3498db, 0 0 40px rgba(52, 152, 219, 0.5)' :
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
                
                {/* Card played indicator */}
                {playedCard && (
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: playedCard === 'A' ? '#e74c3c' : '#3498db',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        animation: 'cardPlayed 0.8s ease-out'
                    }}>
                        {playedCard}♠ Played!
                    </div>
                )}
                
                {/* Draw animation */}
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
                        📖
                    </div>
                )}
                
                {/* Cards drawn counter */}
                {cardsDrawn > 0 && (
                    <div style={{
                        position: 'absolute',
                        bottom: '-25px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#3498db',
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
                background: isMultiStacking ? 
                    'linear-gradient(45deg, #3498db, #2980b9)' : 
                    '#3498db',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '20px',
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(52, 152, 219, 0.4)',
                animation: isMultiStacking ? 'stackPulse 1s infinite' : 'drawStackPulse 2s infinite',
                zIndex: 15
            }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📖</div>
                <div>Draw {drawStack}</div>
                {isMultiStacking && (
                    <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        STACKING!
                    </div>
                )}
            </div>
        );
    };
    
    /**
     * Render stacking chain indicator
     */
    const renderStackingChain = () => {
        if (stackingChain.length === 0) return null;
        
        return (
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 15
            }}>
                Chain: {stackingChain.map((item, index) => (
                    <span key={index}>
                        {item.card}
                        {index < stackingChain.length - 1 ? ' → ' : ''}
                    </span>
                ))}
            </div>
        );
    };
    
    /**
     * Render summary view
     */
    const renderSummary = () => {
        if (!showAdvancedDemo) return null;
        
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
                    color: '#3498db'
                }}>
                    📖 Two Card Mastery
                </h3>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: theme.spacing.medium,
                    marginBottom: theme.spacing.large
                }}>
                    {/* Basic Two */}
                    <div style={{
                        background: 'rgba(52, 152, 219, 0.2)',
                        border: '2px solid #3498db',
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium
                    }}>
                        <h4 style={{ color: '#3498db', marginBottom: theme.spacing.small }}>
                            📖 Basic Two
                        </h4>
                        <ul style={{
                            textAlign: 'left',
                            paddingLeft: '20px',
                            margin: 0,
                            fontSize: '14px'
                        }}>
                            <li>Draw 2 cards</li>
                            <li>Skip turn</li>
                            <li>Common card</li>
                            <li>Stackable</li>
                        </ul>
                    </div>
                    
                    {/* Two Stacking */}
                    <div style={{
                        background: 'rgba(243, 156, 18, 0.2)',
                        border: '2px solid #f39c12',
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium
                    }}>
                        <h4 style={{ color: '#f39c12', marginBottom: theme.spacing.small }}>
                            🔗 Two Stacking
                        </h4>
                        <ul style={{
                            textAlign: 'left',
                            paddingLeft: '20px',
                            margin: 0,
                            fontSize: '14px'
                        }}>
                            <li>2 + 2 = 4 cards</li>
                            <li>Multiple players</li>
                            <li>Builds up penalty</li>
                            <li>Chain reactions</li>
                        </ul>
                    </div>
                    
                    {/* Cross Counter */}
                    <div style={{
                        background: 'rgba(155, 89, 182, 0.2)',
                        border: '2px solid #9b59b6',
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium
                    }}>
                        <h4 style={{ color: '#9b59b6', marginBottom: theme.spacing.small }}>
                            ⚡ Cross Counter
                        </h4>
                        <ul style={{
                            textAlign: 'left',
                            paddingLeft: '20px',
                            margin: 0,
                            fontSize: '14px'
                        }}>
                            <li>Ace ↔ 2 (same suit)</li>
                            <li>Advanced defense</li>
                            <li>Stacks penalties</li>
                            <li>Strategic play</li>
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
                        💡 Advanced Strategies
                    </h4>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                        • Hold multiple 2s for devastating stacking chains<br/>
                        • Use 2s defensively to counter Aces (same suit only)<br/>
                        • Remember: 2♠ can counter A♠, but not A♥<br/>
                        • Stacking order matters - plan your chain carefully!
                    </p>
                </div>
                
                <button
                    onClick={handleComplete}
                    style={{
                        padding: '12px 24px',
                        background: '#3498db',
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
                    ✅ Master the Two!
                </button>
            </div>
        );
    };
    
    if (gamePhase === 'explanation') {
        return (
            <div style={{
                padding: theme.spacing.xlarge,
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(41, 128, 185, 0.1))',
                borderRadius: theme.borderRadius,
                minHeight: '500px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <div style={{ fontSize: '72px', marginBottom: theme.spacing.medium }}>
                    📖
                </div>
                <h2 style={{
                    fontSize: '32px',
                    color: '#3498db',
                    marginBottom: theme.spacing.medium
                }}>
                    Two: The Stacking Specialist
                </h2>
                <p style={{
                    fontSize: '18px',
                    color: theme.colors.text,
                    maxWidth: '600px',
                    margin: '0 auto',
                    lineHeight: 1.6
                }}>
                    The 2 card might seem simple, but it's actually the foundation of advanced stacking strategies. 
                    Learn how to chain multiple 2s together and even cross-counter with Aces!
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
                        box-shadow: 0 0 20px #3498db, 0 0 40px rgba(52, 152, 219, 0.5);
                    }
                    50% { 
                        box-shadow: 0 0 30px #3498db, 0 0 60px rgba(52, 152, 219, 0.8);
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
                
                @keyframes cardPlayed {
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
                        background: linear-gradient(45deg, #3498db, #2980b9);
                    }
                    50% { 
                        transform: translateX(-50%) scale(1.15);
                        background: linear-gradient(45deg, #2980b9, #3498db);
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
                    0% { background-color: rgba(52, 152, 219, 0.8); }
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
                    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(41, 128, 185, 0.1))',
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
                        color: '#3498db',
                        marginBottom: theme.spacing.small
                    }}>
                        📖 {scenario.title}
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
                            <div style={{ fontSize: '20px', marginBottom: '5px' }}>📖</div>
                            <div style={{ fontWeight: 'bold' }}>Two Draw 2</div>
                            <div style={{ fontSize: '12px', opacity: 0.8 }}>
                                {scenario.id.includes('stacking') ? 'Stacking Demo' : 
                                 scenario.id.includes('cross') ? 'Cross Counter' : 'Basic Demo'}
                            </div>
                        </div>
                    </div>
                    
                    {/* Draw Stack */}
                    {renderDrawStack()}
                    
                    {/* Stacking Chain */}
                    {renderStackingChain()}
                    
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
                        color: '#3498db'
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
                            Watch the 2 cards in action...
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
                    background: 'rgba(52, 152, 219, 0.1)',
                    border: `2px solid #3498db`,
                    borderRadius: theme.borderRadius,
                    padding: theme.spacing.medium,
                    textAlign: 'center',
                    marginBottom: theme.spacing.large
                }}>
                    <h4 style={{ 
                        color: '#3498db', 
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
                            background: '#3498db',
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
                                background: index === currentScenario ? '#3498db' : 
                                           practiceProgress[s.id] ? theme.colors.success : 
                                           theme.colors.secondary,
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            {s.id === 'two-stacking' ? '🔗 Stack' : 
                             s.id === 'ace-two-cross' ? '⚡ Cross' : '📖 Basic'}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default TwoLesson;