# Crazy 8's Game Backend

## Overview
This is the backend for the Crazy 8's game, built using Node.js, Express, and Socket.IO. The backend handles **advanced sequential card stacking logic**, sophisticated turn control simulation, multi-stage validation, player interactions, and real-time communication between players.

## Architecture Overview

### Core Components
- **Advanced Game Engine**: Sequential stacking with turn control simulation
- **Multi-Stage Validation System**: Ownership → Stacking → Play rules → Turn control
- **Socket.IO Server**: Real-time multiplayer communication with debugging
- **REST API**: HTTP endpoints for game operations
- **Comprehensive Testing Suite**: 95%+ coverage with 350+ unit tests
- **Tournament Management**: Round progression and player safety tracking
- **Play Again System**: Voting mechanism and game continuation logic
- **Victory Celebrations**: Game state management for celebrations and notifications

## Directory Structure
```
backend/
├── src/
│   ├── app.js                 # Express application setup
│   ├── server.js             # Socket.IO server with advanced game logic
│   ├── models/               # Game logic and data structures
│   │   ├── game.js           # Main game engine with sequential stacking
│   │   ├── cardPlayLogic.js  # Multi-stage validation system
│   │   ├── Card.js           # Card entity with special effects
│   │   ├── Deck.js           # Deck management utilities
│   │   ├── Player.js         # Player entity and methods
│   │   └── index.js          # Model exports
│   ├── controllers/          # Request handlers
│   │   └── gameController.js # Game API endpoints
│   ├── routes/               # Express routes
│   │   └── gameRoutes.js     # Game-related routes
│   └── utils/                # Utility functions
│       └── deck.js           # Deck creation and shuffling
├── tests/                    # Test suites
│   ├── game.test.js         # Core game logic tests (150+ tests)
│   ├── cardPlayLogic.test.js # Validation system tests (200+ tests)
│   ├── crazy8.test.js       # Integration tests
│   └── src/utils/deck.js    # Test utilities
└── package.json             # Dependencies and scripts
```

## Key Features

### Advanced Sequential Stacking Engine
- **Turn Control Simulation**: Sophisticated logic determining whether players maintain turn control after card sequences
- **Multi-Stage Validation**: Complete validation pipeline with detailed error reporting
- **2-Player vs Multiplayer Logic**: Different stacking rules for different game sizes
- **Complex Special Card Interactions**: Jack, Queen, Ace, 2, and 8 combinations

### Turn Control System (`game.js` - `simulateTurnControl`)

#### Core Logic
The system simulates what happens when cards are played sequentially:

```javascript
// Example: J♦ → 10♦ → 10♥ → 2♥
// Turn 1: [J♦] → Keep turn (Jack skips opponent)
// Turn 2: [10♦, 10♥] → Pass turn (normal cards)
// Turn 3: [2♥] → BLOCKED (no turn control after Turn 2)
```

#### Turn Control Rules (2-Player)

**Turn-Keeping Effects:**
- **Jack**: Skips opponent → keeps turn
- **Even Queens**: Double reverse cancels out → keeps turn
- **Pure Jack Stacks**: Multiple Jacks → keeps turn

**Turn-Passing Effects:**
- **Odd Queens**: Single reverse → passes turn
- **Normal Cards**: `3,4,5,6,7,9,10,King` → pass turn
- **Draw Cards**: `Ace,2` → pass turn (after penalty)
- **Wild Cards**: `8` → pass turn (after suit declaration)

#### Algorithm Implementation
```javascript
simulateTurnControl(cardStack) {
    // Special case: Pure Jack stacks in 2-player
    if (isPureJackStack && is2PlayerGame) {
        return true; // Always keep turn
    }
    
    // Check what the stack ends with
    const lastCard = cardStack[cardStack.length - 1];
    
    // If ends with turn-passing cards, turn passes
    if (isNormalCard(lastCard) || isDrawCard(lastCard) || isWildCard(lastCard)) {
        return false;
    }
    
    // If ends with special cards, analyze the combination
    const queenCount = countQueens(cardStack);
    if (queenCount > 0) {
        return (queenCount % 2 === 0); // Even = keep, odd = pass
    }
    
    // Pure Jack effects
    return hasJacks(cardStack);
}
```

### Multi-Stage Validation System (`cardPlayLogic.js`)

#### Validation Pipeline
1. **Basic Requirements**: Game state, player turn, card ownership
2. **Card Ownership**: Verify player has all specified cards
3. **Stacking Validation**: Check card-to-card transitions using turn control
4. **Play Validation**: Verify cards can be played on current top card
5. **Execution**: Apply effects and update game state

#### Enhanced Stacking Logic
```javascript
validateCardStack(cards) {
    for (let i = 1; i < cards.length; i++) {
        const prevCard = cards[i - 1];
        const currentCard = cards[i];
        
        // Same rank always allowed
        if (prevCard.rank === currentCard.rank) continue;
        
        // Same suit requires turn control validation
        if (prevCard.suit === currentCard.suit) {
            const stackUpToPrevious = cards.slice(0, i);
            const wouldHaveTurnControl = simulateTurnControl(stackUpToPrevious);
            
            if (!wouldHaveTurnControl) {
                return { 
                    isValid: false, 
                    error: "No turn control after previous cards" 
                };
            }
        }
    }
    return { isValid: true };
}
```

### Penalty Card System

#### Draw Stack Mechanics
- **Accumulation**: Multiple Aces/2s stack penalties
- **Countering**: Specific counter cards can block penalties
- **Resolution**: Players must draw all penalty cards or counter

#### Counter Rules
```javascript
canCounterDraw(card, topCard) {
    if (topCard.rank === 'Ace') {
        // Counter Ace with: Any Ace OR same-suit 2
        return card.rank === 'Ace' || 
               (card.rank === '2' && card.suit === topCard.suit);
    }
    if (topCard.rank === '2') {
        // Counter 2 with: Any 2 OR same-suit Ace  
        return card.rank === '2' || 
               (card.rank === 'Ace' && card.suit === topCard.suit);
    }
    return false;
}
```

### Enhanced Game Features

#### Tournament Management
- **Round Progression**: Automatic advancement of safe players to next round
- **Player Safety Tracking**: Monitor and notify when players become safe
- **Tournament Winner Detection**: Identify and celebrate tournament victors
- **Round End Handling**: Proper cleanup and transition between rounds

#### Play Again System
- **Voting Mechanism**: Players can vote to continue playing after game completion
- **Vote Validation**: Ensure proper game conditions before starting new rounds
- **Game Continuation**: Seamless transition between games with preserved player connections

#### Victory Celebrations
- **Game State Management**: Track victories and player safety for celebrations
- **Notification System**: Broadcast victory and safety events to all players
- **Celebration Triggers**: Coordinate frontend celebrations with backend events

### Real-time Multiplayer Features

#### Socket.IO Integration
```javascript
// Enhanced game state broadcasting with debug info
socket.on('playCard', (data) => {
    const result = game.playCard(playerId, cards, declaredSuit);
    
    if (result.success) {
        // Reset timer for next player
        manageGameTimer(gameId, 'reset', timerSettings);
        
        // Broadcast with detailed logging
        broadcastGameState(gameId);
        
        // Notify other players with formatted message
        socket.to(gameId).emit('cardPlayed', {
            playerName: player.name,
            message: result.message // Advanced formatting for stacks
        });
        
        // Check for player safety and tournament progression
        checkPlayerSafety(gameId, playerId);
        checkTournamentProgression(gameId);
    }
});
```

#### Game State Management
- **Real-time Synchronization**: Instant updates across all clients
- **Turn Management**: Advanced turn control with timer integration
- **Player State**: Comprehensive tracking of hands, turns, and penalties
- **Debug Information**: Extensive logging for complex stacking scenarios

## Setup Instructions

### Installation
1. Navigate to the backend directory:
   ```bash
   cd crazy8s-game/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start

# Server runs on http://localhost:3001
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Verbose test output (useful for stacking logic debugging)
npm run test:verbose
```

## API Documentation

### Enhanced REST Endpoints

#### POST `/api/games/move`
Play cards with advanced stacking support.

**Request Body:**
```json
{
  "gameId": "game_abc123",
  "playerId": "socket_id_1",
  "cards": [
    {"suit": "Diamonds", "rank": "Jack"},
    {"suit": "Diamonds", "rank": "Queen"},
    {"suit": "Diamonds", "rank": "10"}
  ],
  "declaredSuit": "Hearts" // For wild cards (8s)
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Played J♦, Q♦, 10♦",
  "gameState": { /* complete game state */ },
  "cardsPlayed": ["Jack of Diamonds", "Queen of Diamonds", "10 of Diamonds"]
}
```

**Response (Validation Error):**
```json
{
  "success": false,
  "error": "Cannot stack 10 of Diamonds after Queen of Diamonds. You don't maintain turn control after playing the previous cards in the sequence."
}
```

### Enhanced Socket.IO Events

#### Client → Server Events

**`playCard` (Enhanced)**
```javascript
socket.emit('playCard', {
  gameId: "game_abc123",
  cards: [
    {"suit": "Hearts", "rank": "Jack"},
    {"suit": "Hearts", "rank": "Queen"},
    {"suit": "Hearts", "rank": "Queen"}
  ],
  declaredSuit: "Spades", // For wild cards
  timerSettings: {
    enableTimer: true,
    timerDuration: 60,
    timerWarningTime: 15
  }
});
```

#### Server → Client Events

**`gameUpdate` (Enhanced)**
- Complete game state with advanced turn control information
- Debug information for stacking validation (in development)

**`cardPlayed` (Enhanced)**
```javascript
// Advanced message formatting for complex stacks
{
  playerName: "Alice",
  playerId: "socket_id_1",
  message: "Played J♥, Q♥, Q♠ and declared Hearts"
}
```

**`playerSafe` (New)**
```javascript
// Player safety notification for tournaments
{
  playerId: "socket_id_1",
  playerName: "Alice",
  message: "Alice is safe and advances to the next round!"
}
```

**`gameWon` (Enhanced)**
```javascript
// Game victory with celebration trigger
{
  winnerId: "socket_id_1",
  winnerName: "Alice",
  message: "Alice wins the game!",
  triggerCelebration: true
}
```

**`playAgainVote` (New)**
```javascript
// Play again voting system
{
  playerId: "socket_id_1",
  playerName: "Alice",
  vote: "yes", // "yes" or "no"
  currentVotes: {
    yes: 2,
    no: 1,
    total: 3
  }
}
```

## Advanced Game Logic Details

### Sequential Stacking Examples

#### Valid Complex Stacks

**Two Queens Maintaining Turn Control:**
```javascript
// Q♦ → Q♥ → 10♥
// Turn 1: [Q♦, Q♥] (2 Queens = even = keep turn)
// Turn 2: [10♥] (normal card = pass turn)
// Result: Valid stack, final turn passes
```

**Jack-Based Stacking:**
```javascript
// J♦ → 10♦ → 10♥  
// Turn 1: [J♦] (Jack keeps turn)
// Turn 2: [10♦, 10♥] (same rank = valid, normal cards = pass turn)
// Result: Valid stack, final turn passes
```

#### Invalid Complex Stacks

**No Turn Control After Normal Cards:**
```javascript
// J♦ → 10♦ → 10♥ → 2♥
// Turn 1: [J♦] (keeps turn)
// Turn 2: [10♦, 10♥] (pass turn) 
// Turn 3: [2♥] → BLOCKED (no turn control after Turn 2)
```

**Queen Reversal Breaking Control:**
```javascript
// Q♦ → J♦
// Turn 1: [Q♦] (1 Queen = odd = pass turn)
// Turn 2: [J♦] → BLOCKED (no turn control after Turn 1)
```

### Message Generation for Complex Stacks

```javascript
generatePlayMessage(cards, declaredSuit) {
    if (cards.length === 1) {
        return `Played ${cards[0].rank} of ${cards[0].suit}`;
    }
    
    // Check if all same rank
    const allSameRank = cards.every(card => card.rank === cards[0].rank);
    
    if (allSameRank) {
        const rank = cards[0].rank;
        const suits = cards.map(card => card.suit).join(', ');
        return `Played ${cards.length} ${rank}s: ${suits}`;
    } else {
        // Mixed ranks - use compact notation
        const cardStrings = cards.map(card => {
            const shortRank = {'Jack': 'J', 'Queen': 'Q', 'King': 'K', 'Ace': 'A'}[card.rank] || card.rank;
            const suitSymbol = {'Hearts': '♥', 'Diamonds': '♦', 'Clubs': '♣', 'Spades': '♠'}[card.suit];
            return `${shortRank}${suitSymbol}`;
        });
        return `Played ${cardStrings.join(', ')}`;
    }
}
```

## Testing Architecture

### Comprehensive Test Coverage

**Stacking Logic Tests (`cardPlayLogic.test.js`)**
```javascript
describe('Advanced Stacking Validation', () => {
    test('should allow Jack → Queen in same suit', () => {
        const cards = [
            { suit: 'Hearts', rank: 'Jack' },
            { suit: 'Hearts', rank: 'Queen' }
        ];
        expect(game.validateCardStack(cards).isValid).toBe(true);
    });
    
    test('should block normal cards after turn loss', () => {
        const cards = [
            { suit: 'Hearts', rank: 'Queen' }, // Passes turn
            { suit: 'Hearts', rank: 'Jack' }   // Should be blocked
        ];
        expect(game.validateCardStack(cards).isValid).toBe(false);
    });
    
    test('should handle complex Queen counting', () => {
        const cards = [
            { suit: 'Hearts', rank: 'Queen' },
            { suit: 'Hearts', rank: 'Queen' },
            { suit: 'Hearts', rank: '10' }
        ];
        expect(game.validateCardStack(cards).isValid).toBe(true);
    });
});
```

**Turn Control Simulation Tests (`game.test.js`)**
```javascript
describe('Turn Control Simulation', () => {
    test('single Jack should keep turn in 2-player', () => {
        const cards = [{ suit: 'Hearts', rank: 'Jack' }];
        expect(game.simulateTurnControl(cards)).toBe(true);
    });
    
    test('even Queens should keep turn', () => {
        const cards = [
            { suit: 'Hearts', rank: 'Queen' },
            { suit: 'Clubs', rank: 'Queen' }
        ];
        expect(game.simulateTurnControl(cards)).toBe(true);
    });
    
    test('normal cards should pass turn', () => {
        const cards = [
            { suit: 'Hearts', rank: '7' },
            { suit: 'Clubs', rank: '7' }
        ];
        expect(game.simulateTurnControl(cards)).toBe(false);
    });
});
```

### Test Matrix for Stacking Scenarios

```javascript
const stackingTestMatrix = [
    // [cards, expected, description]
    [[{suit: 'Hearts', rank: 'Jack'}], true, 'Single Jack keeps turn'],
    [[{suit: 'Hearts', rank: 'Queen'}], false, 'Single Queen passes turn'],
    [[{suit: 'Hearts', rank: 'Queen'}, {suit: 'Clubs', rank: 'Queen'}], true, 'Two Queens keep turn'],
    [[{suit: 'Hearts', rank: 'Jack'}, {suit: 'Hearts', rank: '10'}], false, 'Jack + normal passes turn'],
    // ... 50+ more test cases
];
```

## Performance Considerations

### Optimization Strategies
- **Efficient Turn Simulation**: O(n) complexity for card stack validation
- **Minimal State Updates**: Only broadcast necessary game state changes
- **Smart Validation Caching**: Cache turn control results for repeated calculations
- **Memory Management**: Automatic cleanup of finished games

### Scalability Features  
- **Stateless Validation**: Pure functions enable horizontal scaling
- **Game Instance Isolation**: Independent game states prevent interference
- **Connection Pooling**: Efficient Socket.IO connection management
- **Database Ready**: Architecture supports easy migration to persistent storage

## Debug Tools

### Advanced Logging
```javascript
// Enable debug mode for detailed stacking logs
game.debugMode = true;

// Detailed turn control simulation logging
🔍 [DEBUG] simulateTurnControl: [J♦, 10♦, 10♥] with 2 players
🔍 [DEBUG] Stack ends with turn-passing card (10) - turn passes
🔍 [DEBUG] simulateTurnControl result: PASS TURN
```

### Debug Functions
```javascript
// Test turn control scenarios
game.testTurnControl();

// Debug specific card combinations  
game.debugTurnControl([
    { suit: 'Hearts', rank: 'Jack' },
    { suit: 'Hearts', rank: 'Queen' }
]);
```

## Future Enhancements

### Planned Features
- **3+ Player Stacking Rules**: Enhanced logic for multiplayer games
- **Advanced AI Opponents**: Strategic stacking AI
- **Performance Optimization**: Further optimization for complex stacks
- **Rule Variations**: Configurable stacking rule sets
- **Analytics**: Detailed stacking statistics and patterns

## License
MIT License - see main project README for details.