/**
 * EightLesson.js - Wild card mechanics and suit selection
 * Teaches 8 card mechanics, wild card power, and strategic suit selection
 */

import React, { useState, useEffect, useRef } from 'react';

/**
 * Eight lesson component for learning wild card mechanics
 * @param {Object} props - Component props
 * @param {Function} props.onComplete - Callback when lesson is completed
 * @param {Function} props.onProgress - Callback for progress updates
 * @param {Object} props.tutorialEngine - Tutorial engine instance
 * @param {Object} props.theme - Theme configuration
 */
const EightLesson = ({
    onComplete,
    onProgress,
    tutorialEngine,
    theme
}) => {
    // State management
    const [currentScenario, setCurrentScenario] = useState(0);
    const [gamePhase, setGamePhase] = useState('explanation');
    const [players, setPlayers] = useState([]);
    const [gameActions, setGameActions] = useState([]);
    const [practiceProgress, setPracticeProgress] = useState({});
    const [showSuitSelection, setShowSuitSelection] = useState(false);
    const [selectedSuit, setSelectedSuit] = useState(null);
    const [currentDiscard, setCurrentDiscard] = useState(null);
    const [animatingWild, setAnimatingWild] = useState(false);
    const [interactiveMode, setInteractiveMode] = useState(false);
    const [playerScore, setPlayerScore] = useState(0);
    
    // Refs
    const containerRef = useRef(null);
    const playersRef = useRef([]);
    
    // Lesson configuration
    const lessonData = {
        id: 'eight-lesson',
        title: 'Eight: Wild Card Power',
        description: 'Master the 8 card and strategic suit selection',
        estimatedTime: '5 minutes',
        difficulty: 'intermediate',
        objectives: [
            {
                id: 'understand-wild',
                description: 'Understand how 8 works as a wild card',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'learn-suit-selection',
                description: 'Learn strategic suit selection',
                type: 'comprehension',
                completed: false
            },
            {
                id: 'practice-wild-timing',
                description: 'Practice optimal wild card timing',
                type: 'practical',
                completed: false
            }
        ]
    };
    
    // Game scenarios for demonstration
    const scenarios = [
        {
            id: 'basic-wild',
            title: 'Basic Wild: Universal Power',
            description: 'See how 8 can be played on any card',
            players: [
                { id: 'you', name: 'You', position: { x: 50, y: 80 }, isActive: true, cards: ['8♠', '5♦', '3♣'] },
                { id: 'alice', name: 'Alice', position: { x: 20, y: 40 }, isActive: false, cards: 6 },
                { id: 'bob', name: 'Bob', position: { x: 50, y: 20 }, isActive: false, cards: 4 },
                { id: 'carol', name: 'Carol', position: { x: 80, y: 40 }, isActive: false, cards: 7 }
            ],
            discardCard: { suit: 'Hearts', rank: 'King' },
            wildPlayer: 0,
            explanation: 'The 8 can be played on any card, regardless of suit or rank'
        },
        {
            id: 'strategic-suit',
            title: 'Strategic Suit Selection',
            description: 'Learn how to choose the best suit for your hand',
            players: [
                { id: 'you', name: 'You', position: { x: 50, y: 80 }, isActive: true, cards: ['8♠', '5♦', '3♦', '7♦'] },
                { id: 'alice', name: 'Alice', position: { x: 20, y: 40 }, isActive: false, cards: 6 },
                { id: 'bob', name: 'Bob', position: { x: 50, y: 20 }, isActive: false, cards: 4 },
                { id: 'carol', name: 'Carol', position: { x: 80, y: 40 }, isActive: false, cards: 7 }
            ],
            discardCard: { suit: 'Spades', rank: 'Queen' },
            wildPlayer: 0,
            explanation: 'Choose Diamonds to help play your other cards next turn'
        },
        {
            id: 'interactive-practice',
            title: 'Interactive Practice',
            description: 'Practice choosing the best suit for different hands',
            players: [
                { id: 'you', name: 'You', position: { x: 50, y: 80 }, isActive: true, cards: [] },
                { id: 'alice', name: 'Alice', position: { x: 20, y: 40 }, isActive: false, cards: 6 },
                { id: 'bob', name: 'Bob', position: { x: 50, y: 20 }, isActive: false, cards: 4 },
                { id: 'carol', name: 'Carol', position: { x: 80, y: 40 }, isActive: false, cards: 7 }
            ],
            discardCard: { suit: 'Clubs', rank: 'Jack' },
            wildPlayer: 0,
            explanation: 'Choose the best suit based on your hand composition'
        }
    ];
    
    // Suits data for selection
    const suits = [
        { name: 'Hearts', symbol: '♥', color: '#e74c3c' },
        { name: 'Diamonds', symbol: '♦', color: '#e74c3c' },
        { name: 'Clubs', symbol: '♣', color: '#2c3e50' },
        { name: 'Spades', symbol: '♠', color: '#2c3e50' }
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
            isActive: index === scenario.wildPlayer,
            playedEight: false,
            hand: Array.isArray(player.cards) ? player.cards : []
        }));
        
        setPlayers(initialPlayers);
        setCurrentDiscard(scenario.discardCard);
        setGameActions([]);
        setShowSuitSelection(false);
        setSelectedSuit(null);
        setAnimatingWild(false);
        setInteractiveMode(scenario.id === 'interactive-practice');
        setPlayerScore(0);
        
        // Generate random hand for interactive practice
        if (scenario.id === 'interactive-practice') {
            const randomHand = generateRandomHand();
            setPlayers(prev => prev.map((player, index) => 
                index === 0 ? { ...player, hand: randomHand } : player
            ));
        }
        
        // Start the demonstration after a brief delay
        setTimeout(() => {
            if (scenario.id === 'interactive-practice') {
                startInteractivePractice();
            } else {
                demonstrateWildCard(scenario);
            }
        }, 1500);
    };
    
    /**
     * Generate a random hand for practice
     */
    const generateRandomHand = () => {
        const allSuits = ['♥', '♦', '♣', '♠'];
        const ranks = ['2', '3', '4', '5', '6', '7', '9', '10', 'J', 'Q', 'K', 'A'];
        const hand = ['8♠']; // Always include an 8
        
        // Add 4-6 random cards with some suit clustering
        const handSize = 4 + Math.floor(Math.random() * 3);
        const dominantSuit = allSuits[Math.floor(Math.random() * allSuits.length)];
        
        for (let i = 0; i < handSize; i++) {
            const suit = Math.random() < 0.6 ? dominantSuit : allSuits[Math.floor(Math.random() * allSuits.length)];
            const rank = ranks[Math.floor(Math.random() * ranks.length)];
            hand.push(`${rank}${suit}`);
        }
        
        return hand;
    };
    
    /**
     * Start interactive practice mode
     */
    const startInteractivePractice = () => {
        const practiceAction = {
            id: Date.now(),
            player: 'Tutorial',
            action: 'Choose the best suit for your hand!',
            type: 'instruction',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions([practiceAction]);
        setShowSuitSelection(true);
    };
    
    /**
     * Demonstrate wild card play
     */
    const demonstrateWildCard = async (scenario) => {
        // 1. Show the current discard and explain wild power
        const discardAction = {
            id: Date.now(),
            player: 'Table',
            action: `Current discard: ${scenario.discardCard.rank} of ${scenario.discardCard.suit}`,
            type: 'discard',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions([discardAction]);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 2. Show 8 being played
        const eightAction = {
            id: Date.now() + 1,
            player: scenario.players[scenario.wildPlayer].name,
            action: 'played 8♠ (Wild Card!)',
            type: 'eight',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, eightAction]);
        
        // Mark player as having played 8
        setPlayers(prev => prev.map((player, index) => ({
            ...player,
            playedEight: index === scenario.wildPlayer
        })));
        
        setAnimatingWild(true);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Show suit selection
        setShowSuitSelection(true);
        
        const suitAction = {
            id: Date.now() + 2,
            player: scenario.players[scenario.wildPlayer].name,
            action: 'choosing new suit...',
            type: 'suit-selection',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, suitAction]);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 4. Auto-select optimal suit for demo
        const optimalSuit = getOptimalSuitForDemo(scenario);
        handleSuitSelection(optimalSuit, true);
    };
    
    /**
     * Get optimal suit for demo
     */
    const getOptimalSuitForDemo = (scenario) => {
        if (scenario.id === 'strategic-suit') {
            return 'Diamonds'; // Most cards in hand are Diamonds
        }
        return 'Hearts'; // Default
    };
    
    /**
     * Handle suit selection
     */
    const handleSuitSelection = async (suitName, isDemo = false) => {
        setSelectedSuit(suitName);
        setShowSuitSelection(false);
        setAnimatingWild(false);
        
        const suit = suits.find(s => s.name === suitName);
        
        // Update discard pile
        setCurrentDiscard({ suit: suitName, rank: '8' });
        
        const selectionAction = {
            id: Date.now(),
            player: players[0].name,
            action: `declared ${suitName} ${suit.symbol}`,
            type: 'suit-declared',
            timestamp: new Date().toLocaleTimeString()
        };
        
        setGameActions(prev => [...prev, selectionAction]);
        
        if (interactiveMode && !isDemo) {
            // Calculate score for interactive mode
            const score = calculateSuitScore(suitName);
            setPlayerScore(score);
            
            const scoreAction = {
                id: Date.now() + 1,
                player: 'Score',
                action: `${score}/100 points! ${getScoreMessage(score)}`,
                type: 'score',
                timestamp: new Date().toLocaleTimeString()
            };
            
            setGameActions(prev => [...prev, scoreAction]);
            
            // Show next round or complete
            setTimeout(() => {
                if (practiceProgress['interactive-practice'] !== true) {
                    // Generate new hand for another round
                    const newHand = generateRandomHand();
                    setPlayers(prev => prev.map((player, index) => 
                        index === 0 ? { ...player, hand: newHand } : player
                    ));
                    
                    setTimeout(() => {
                        setShowSuitSelection(true);
                        const nextAction = {
                            id: Date.now(),
                            player: 'Tutorial',
                            action: 'Try another hand!',
                            type: 'instruction',
                            timestamp: new Date().toLocaleTimeString()
                        };
                        setGameActions(prev => [...prev, nextAction]);
                    }, 1000);
                } else {
                    // Complete interactive practice
                    setTimeout(() => {
                        setGamePhase('summary');
                    }, 2000);
                }
            }, 2000);
        }
        
        // Mark scenario progress
        setPracticeProgress(prev => ({
            ...prev,
            [scenarios[currentScenario].id]: true
        }));
        
        if (isDemo) {
            // Auto-advance for demo scenarios
            setTimeout(() => {
                if (currentScenario < scenarios.length - 1) {
                    initializeScenario(currentScenario + 1);
                } else {
                    setGamePhase('summary');
                }
            }, 3000);
        }
    };
    
    /**
     * Calculate score for suit selection
     */
    const calculateSuitScore = (selectedSuit) => {
        const hand = players[0].hand;
        const suitCounts = {};
        
        // Count cards by suit
        hand.forEach(card => {
            const suit = getSuitNameFromSymbol(card.slice(-1));
            suitCounts[suit] = (suitCounts[suit] || 0) + 1;
        });
        
        // Remove the 8 from count
        suitCounts[getSuitNameFromSymbol('♠')] -= 1;
        
        // Calculate score based on matching cards
        const matchingCards = suitCounts[selectedSuit] || 0;
        const maxPossibleMatches = Math.max(...Object.values(suitCounts));
        const score = Math.round((matchingCards / maxPossibleMatches) * 100);
        
        return Math.max(20, score); // Minimum 20 points
    };
    
    /**
     * Get suit name from symbol
     */
    const getSuitNameFromSymbol = (symbol) => {
        const suitMap = { '♥': 'Hearts', '♦': 'Diamonds', '♣': 'Clubs', '♠': 'Spades' };
        return suitMap[symbol] || 'Hearts';
    };
    
    /**
     * Get score message
     */
    const getScoreMessage = (score) => {
        if (score >= 80) return 'Excellent choice!';
        if (score >= 60) return 'Good strategy!';
        if (score >= 40) return 'Decent choice.';
        return 'Consider your hand composition.';
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
            scenariosViewed: Object.keys(practiceProgress).length,
            practiceScore: playerScore
        });
    };
    
    /**
     * Calculate lesson score
     */
    const calculateScore = () => {
        const baseScore = 80;
        const scenarioBonus = (Object.keys(practiceProgress).length / scenarios.length) * 15;
        const practiceBonus = Math.min(playerScore * 0.05, 5);
        return Math.min(100, Math.round(baseScore + scenarioBonus + practiceBonus));
    };
    
    /**
     * Render a player
     */
    const renderPlayer = (player, index, scenario) => {
        const isActive = player.isActive;
        const playedEight = player.playedEight;
        
        const position = player.position;
        const colors = ['#27ae60', '#e74c3c', '#f39c12', '#3498db'];
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
                    border: isActive ? '4px solid #fff' : '2px solid rgba(255, 255, 255, 0.3)',
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
                        `0 4px 15px rgba(0, 0, 0, 0.2)`,
                    animation: isActive ? 'playerActive 2s infinite' : 'none',
                    zIndex: isActive ? 10 : 1
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
                    {Array.isArray(player.cards) ? player.cards.length : player.cards} cards
                </div>
                
                {/* Eight indicator */}
                {playedEight && (
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#27ae60',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        animation: 'eightPlayed 0.8s ease-out'
                    }}>
                        8♠ Wild!
                    </div>
                )}
                
                {/* Wild animation */}
                {animatingWild && isActive && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '32px',
                        animation: 'wildEffect 2s infinite',
                        zIndex: 20,
                        pointerEvents: 'none'
                    }}>
                        🎱
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
     * Render discard pile
     */
    const renderDiscardPile = () => {
        if (!currentDiscard) return null;
        
        const suitColors = {
            'Hearts': '#e74c3c',
            'Diamonds': '#e74c3c',
            'Clubs': '#2c3e50',
            'Spades': '#2c3e50'
        };
        
        const suitSymbols = {
            'Hearts': '♥',
            'Diamonds': '♦',
            'Clubs': '♣',
            'Spades': '♠'
        };
        
        return (
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80px',
                height: '120px',
                background: 'white',
                border: '2px solid #ddd',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                color: suitColors[currentDiscard.suit],
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                zIndex: 5
            }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                    {currentDiscard.rank}
                </div>
                <div style={{ fontSize: '24px' }}>
                    {suitSymbols[currentDiscard.suit]}
                </div>
            </div>
        );
    };
    
    /**
     * Render player hand (for interactive mode)
     */
    const renderPlayerHand = () => {
        if (!interactiveMode) return null;
        
        const hand = players[0]?.hand || [];
        
        return (
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.8)',
                padding: '12px',
                borderRadius: '12px',
                zIndex: 20
            }}>
                {hand.map((card, index) => (
                    <div
                        key={index}
                        style={{
                            width: '40px',
                            height: '60px',
                            background: 'white',
                            borderRadius: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            color: card.slice(-1) === '♥' || card.slice(-1) === '♦' ? '#e74c3c' : '#2c3e50',
                            border: card.startsWith('8') ? '2px solid #27ae60' : '1px solid #ddd'
                        }}
                    >
                        <div>{card.slice(0, -1)}</div>
                        <div style={{ fontSize: '14px' }}>{card.slice(-1)}</div>
                    </div>
                ))}
            </div>
        );
    };
    
    /**
     * Render suit selection modal
     */
    const renderSuitSelection = () => {
        if (!showSuitSelection) return null;
        
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
                animation: 'suitSelectionSlideIn 0.4s ease-out'
            }}>
                <div style={{
                    background: 'white',
                    borderRadius: theme.borderRadius,
                    padding: theme.spacing.xlarge,
                    textAlign: 'center',
                    border: '4px solid #27ae60'
                }}>
                    <h3 style={{
                        fontSize: '24px',
                        color: '#27ae60',
                        marginBottom: theme.spacing.large
                    }}>
                        🎱 Choose New Suit
                    </h3>
                    
                    {interactiveMode && (
                        <div style={{
                            background: 'rgba(39, 174, 96, 0.1)',
                            padding: theme.spacing.medium,
                            borderRadius: theme.borderRadius,
                            marginBottom: theme.spacing.large,
                            fontSize: '14px',
                            color: theme.colors.text
                        }}>
                            💡 Tip: Choose the suit you have the most cards of!
                        </div>
                    )}
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: theme.spacing.medium,
                        marginBottom: theme.spacing.large
                    }}>
                        {suits.map(suit => (
                            <button
                                key={suit.name}
                                onClick={() => handleSuitSelection(suit.name)}
                                style={{
                                    padding: theme.spacing.medium,
                                    background: suit.color,
                                    border: 'none',
                                    borderRadius: theme.borderRadius,
                                    color: 'white',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    minHeight: '60px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.transform = 'scale(1.05)';
                                    e.target.style.boxShadow = `0 4px 15px ${suit.color}`;
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.transform = 'scale(1)';
                                    e.target.style.boxShadow = 'none';
                                }}
                            >
                                <span style={{ fontSize: '28px' }}>{suit.symbol}</span>
                                <span>{suit.name}</span>
                            </button>
                        ))}
                    </div>
                    
                    <div style={{
                        fontSize: '14px',
                        color: theme.colors.secondary,
                        fontStyle: 'italic'
                    }}>
                        The suit you choose will be the new requirement for the next player
                    </div>
                </div>
            </div>
        );
    };
    
    /**
     * Render summary view
     */
    const renderSummary = () => {
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
                    color: '#27ae60'
                }}>
                    🎱 Eight Card Mastery
                </h3>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: theme.spacing.large,
                    marginBottom: theme.spacing.large
                }}>
                    {/* Wild Power */}
                    <div style={{
                        background: 'rgba(39, 174, 96, 0.2)',
                        border: '2px solid #27ae60',
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium
                    }}>
                        <h4 style={{ color: '#27ae60', marginBottom: theme.spacing.small }}>
                            🎱 Wild Power
                        </h4>
                        <ul style={{
                            textAlign: 'left',
                            paddingLeft: '20px',
                            margin: 0
                        }}>
                            <li>Play on any card</li>
                            <li>Always playable</li>
                            <li>Game-changing power</li>
                            <li>Strategic timing crucial</li>
                        </ul>
                    </div>
                    
                    {/* Suit Selection */}
                    <div style={{
                        background: 'rgba(52, 152, 219, 0.2)',
                        border: '2px solid #3498db',
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium
                    }}>
                        <h4 style={{ color: '#3498db', marginBottom: theme.spacing.small }}>
                            🎯 Suit Selection
                        </h4>
                        <ul style={{
                            textAlign: 'left',
                            paddingLeft: '20px',
                            margin: 0
                        }}>
                            <li>Choose from 4 suits</li>
                            <li>Match your hand</li>
                            <li>Think strategically</li>
                            <li>Control the game flow</li>
                        </ul>
                    </div>
                </div>
                
                <div style={{
                    background: 'rgba(243, 156, 18, 0.2)',
                    border: '2px solid #f39c12',
                    borderRadius: theme.borderRadius,
                    padding: theme.spacing.medium,
                    marginBottom: theme.spacing.large
                }}>
                    <h4 style={{ color: '#f39c12', marginBottom: theme.spacing.small }}>
                        💡 Master Strategy
                    </h4>
                    <p style={{ margin: 0, lineHeight: 1.6 }}>
                        • Save 8s for when you're stuck - they're your escape card<br/>
                        • Choose suits that match most of your remaining cards<br/>
                        • Use 8s to disrupt opponents when they're close to winning<br/>
                        • Remember: 8s are powerful but limited - use them wisely!
                    </p>
                </div>
                
                {playerScore > 0 && (
                    <div style={{
                        background: 'rgba(155, 89, 182, 0.2)',
                        border: '2px solid #9b59b6',
                        borderRadius: theme.borderRadius,
                        padding: theme.spacing.medium,
                        marginBottom: theme.spacing.large
                    }}>
                        <h4 style={{ color: '#9b59b6', marginBottom: theme.spacing.small }}>
                            🏆 Your Practice Score
                        </h4>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                            {playerScore}/100
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.8 }}>
                            {getScoreMessage(playerScore)}
                        </div>
                    </div>
                )}
                
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
                    ✅ Master the Wild Card!
                </button>
            </div>
        );
    };
    
    if (gamePhase === 'explanation') {
        return (
            <div style={{
                padding: theme.spacing.xlarge,
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(46, 204, 113, 0.1))',
                borderRadius: theme.borderRadius,
                minHeight: '500px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <div style={{ fontSize: '72px', marginBottom: theme.spacing.medium }}>
                    🎱
                </div>
                <h2 style={{
                    fontSize: '32px',
                    color: '#27ae60',
                    marginBottom: theme.spacing.medium
                }}>
                    Eight: The Wild Card Master
                </h2>
                <p style={{
                    fontSize: '18px',
                    color: theme.colors.text,
                    maxWidth: '600px',
                    margin: '0 auto',
                    lineHeight: 1.6
                }}>
                    The 8 is the most powerful card in Crazy 8's - it can be played on any card and lets you 
                    choose the new suit. Master this card and you'll control the game!
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
                
                @keyframes wildEffect {
                    0%, 100% { 
                        transform: translate(-50%, -50%) scale(1) rotate(0deg);
                        opacity: 0.8;
                    }
                    50% { 
                        transform: translate(-50%, -50%) scale(1.3) rotate(180deg);
                        opacity: 1;
                    }
                }
                
                @keyframes eightPlayed {
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
                
                @keyframes suitSelectionSlideIn {
                    from { 
                        opacity: 0;
                        transform: scale(0.8);
                    }
                    to { 
                        opacity: 1;
                        transform: scale(1);
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
                    0% { background-color: rgba(39, 174, 96, 0.8); }
                    100% { background-color: rgba(255, 255, 255, 0.1); }
                }
                
                @media (max-width: 768px) {
                    .suit-selection-grid {
                        grid-template-columns: 1fr 1fr !important;
                    }
                    
                    .player-hand {
                        gap: 4px !important;
                    }
                    
                    .player-hand .card {
                        width: 30px !important;
                        height: 45px !important;
                        font-size: 8px !important;
                    }
                }
            `}</style>
            
            {/* Main Container */}
            <div
                ref={containerRef}
                style={{
                    padding: theme.spacing.xlarge,
                    background: 'linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(46, 204, 113, 0.1))',
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
                        color: '#27ae60',
                        marginBottom: theme.spacing.small
                    }}>
                        🎱 {scenario.title}
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
                        {/* Discard Pile */}
                        {renderDiscardPile()}
                    </div>
                    
                    {/* Players */}
                    {players.map((player, index) => renderPlayer(player, index, scenario))}
                </div>
                
                {/* Player Hand */}
                {renderPlayerHand()}
                
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
                        color: '#27ae60'
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
                            Watch the 8 card magic...
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
                    background: 'rgba(39, 174, 96, 0.1)',
                    border: `2px solid #27ae60`,
                    borderRadius: theme.borderRadius,
                    padding: theme.spacing.medium,
                    textAlign: 'center',
                    marginBottom: theme.spacing.large
                }}>
                    <h4 style={{ 
                        color: '#27ae60', 
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
                            background: '#27ae60',
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
                                background: index === currentScenario ? '#27ae60' : 
                                           practiceProgress[s.id] ? theme.colors.success : 
                                           theme.colors.secondary,
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            {s.id === 'basic-wild' ? '🎱 Basic' : 
                             s.id === 'strategic-suit' ? '🎯 Strategy' : '🎮 Practice'}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Suit Selection Modal */}
            {renderSuitSelection()}
        </>
    );
};

export default EightLesson;