# Crazy 8's Backend

🎮 **Node.js/Express backend for the Crazy 8's multiplayer card game with Socket.IO, MongoDB/PostgreSQL support, and comprehensive user management.**

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm 8+
- MongoDB 4.4+ OR PostgreSQL 12+
- Git

### Installation

1. **Clone and navigate to backend**:
   ```bash
   git clone https://github.com/bryanygan/crazy8s.git
   cd crazy8s/crazy8s-game/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your database settings
   ```

4. **Set up database** (choose one):
   
   **For MongoDB:**
   ```bash
   export DB_TYPE=mongodb
   export MONGODB_URI=mongodb://localhost:27017/crazy8s
   npm run db:setup:mongodb
   ```
   
   **For PostgreSQL:**
   ```bash
   export DB_TYPE=postgresql
   export DB_HOST=localhost
   export DB_NAME=crazy8s
   export DB_USER=postgres
   export DB_PASSWORD=your_password
   npm run db:setup:postgresql
   ```

5. **Start the server**:
   ```bash
   npm run dev  # Development with auto-reload
   npm start    # Production
   ```

## 🏗️ Architecture

### Core Technologies
- **Express.js** - Web framework with security middleware
- **Socket.IO** - Real-time multiplayer communication with session persistence
- **MongoDB + Mongoose** OR **PostgreSQL + Sequelize** - Database layer
- **Winston** - Structured logging
- **bcrypt** - Password hashing (12 rounds)
- **JWT** - Authentication tokens
- **Session Store** - In-memory session persistence for reconnection handling

## Overview
This is the backend for the Crazy 8's game, built using Node.js, Express, and Socket.IO. The backend now includes **database integration**, **user management**, **persistent game history**, and **advanced sequential card stacking logic** with sophisticated turn control simulation and multi-stage validation.

## Architecture Overview

### Core Components
- **Advanced Game Engine**: Sequential stacking with turn control simulation
- **Multi-Stage Validation System**: Ownership → Stacking → Play rules → Turn control
- **Socket.IO Server**: Real-time multiplayer communication with debugging
- **Session Persistence**: Robust session management for reconnection scenarios
- **Connection Handler**: Advanced reconnection logic with automatic session recovery
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
│   ├── stores/               # Data storage systems
│   │   ├── SessionStore.js   # In-memory session management
│   │   └── UserStore.js      # User data management
│   └── utils/                # Utility functions
│       ├── deck.js           # Deck creation and shuffling
│       ├── sessionPersistence.js # Session persistence utilities
│       ├── connectionHandler.js  # Connection and reconnection logic
│       └── logger.js         # Structured logging utilities
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

### Session Persistence & Reconnection

#### Session Management System
The backend implements a robust session persistence system that maintains player connections across network interruptions, browser refreshes, and temporary disconnections.

**Key Features:**
- **Automatic Session Recovery**: Players automatically reconnect to their games
- **Cross-Device Support**: Sessions persist across different devices using auth tokens
- **Session Migration**: Seamless transition between socket connections
- **Connection State Management**: Tracks player connection status and handles timeouts

#### Session Store Architecture (`SessionStore.js`)
```javascript
class SessionStore {
    createSession(sessionId, socketId, playerName, gameId, authId = null) {
        // Creates new session with automatic expiration
        const session = {
            sessionId, socketId, playerName, gameId, authId,
            lastActivity: Date.now(),
            reconnectionCount: 0,
            isValid: true
        };
        
        this.sessions.set(sessionId, session);
        this.scheduleCleanup(); // Automatic cleanup of expired sessions
    }
    
    getReconnectionData(identifier, gameId = null) {
        // Supports multiple reconnection scenarios:
        // - Session ID based (guest users)
        // - Auth ID based (authenticated users)
        // - Player name + game ID (fallback)
    }
}
```

#### Session Persistence Utilities (`sessionPersistence.js`)
```javascript
class SessionPersistence {
    static loadSessionData(sessionId) {
        // Loads and validates session data
        // Returns complete session info or null if invalid
    }
    
    static migrateSession(sessionId, newSocketId) {
        // Migrates session to new socket connection
        // Updates connection tracking and maintains game state
    }
    
    static getReconnectionData(identifier, gameId) {
        // Retrieves reconnection data for various player types
        // Handles authenticated and guest user scenarios
    }
}
```

#### Connection Handler (`connectionHandler.js`)
Advanced reconnection logic with automatic session recovery:

```javascript
function handleReconnection(socket, reconnectionData) {
    const { sessionId, gameId, playerName, authId } = reconnectionData;
    
    // 1. Validate reconnection request
    if (!validateReconnectionData(reconnectionData)) {
        return { success: false, error: 'Invalid reconnection data' };
    }
    
    // 2. Migrate session to new socket
    const newSessionId = SessionPersistence.migrateSession(sessionId, socket.id);
    
    // 3. Restore game state and player connection
    const game = games.get(gameId);
    if (game) {
        game.reconnectPlayer(playerName, socket.id);
        socket.join(gameId);
        
        // 4. Broadcast reconnection to other players
        socket.to(gameId).emit('playerReconnected', {
            playerName,
            message: `${playerName} has reconnected`
        });
    }
    
    return { success: true, sessionId: newSessionId };
}
```

#### Reconnection Scenarios Supported

**1. Browser Refresh (Guest Users)**
- Session ID stored in localStorage
- Automatic reconnection on page reload
- Game state fully restored

**2. Network Interruption**
- Socket automatically attempts reconnection
- Session migrated to new socket ID
- No game state loss

**3. Cross-Device Reconnection (Authenticated Users)**
- Auth token enables device switching
- Session lookup by auth ID
- Maintains player identity across devices

**4. Multiple Disconnection/Reconnection Cycles**
- Reconnection counter tracks multiple attempts
- Session expiration prevents infinite reconnections
- Cleanup of abandoned sessions

#### Edge Case Handling

**Race Conditions:**
- Session update locks prevent concurrent modifications
- Atomic session migration operations
- Proper cleanup of orphaned sessions

**Memory Management:**
- Automatic cleanup of expired sessions (30-minute timeout)
- Periodic garbage collection of invalid sessions
- Connection state monitoring and cleanup

**Error Recovery:**
- Graceful handling of invalid reconnection attempts
- Fallback mechanisms for corrupted session data
- Comprehensive error logging and debugging

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

## ⏱️ Timeout Configuration & Optimization

### Centralized Timeout Management

The backend uses a centralized timeout configuration system (`src/config/timeouts.js`) optimized for 8-player games with complex card stacking scenarios. All timeout values are configurable via environment variables.

#### Key Timeout Categories

**Socket.IO Configuration:**
```javascript
SOCKET_PING_TIMEOUT=120000      # 120s (increased from 60s for stability)
SOCKET_PING_INTERVAL=30000      # 30s (matches frontend, reduced ping frequency)
SOCKET_CONNECTION_TIMEOUT=30000 # 30s for initial connection
SOCKET_UPGRADE_TIMEOUT=15000    # 15s for WebSocket upgrade
SOCKET_DISCONNECTION_GRACE=5000 # 5s grace period for false reconnection prevention
```

**Database Configuration:**
```javascript
DB_QUERY_TIMEOUT=60000          # 60s (increased from 30s for complex 8-player queries)
DB_ACQUIRE_TIMEOUT=45000        # 45s (increased from 30s for connection pool pressure)
DB_IDLE_TIMEOUT=30000           # 30s (increased from 10s to reduce connection churn)
DB_CONNECT_TIMEOUT=20000        # 20s for initial database connection
```

**Game Timing Configuration:**
```javascript
GAME_TIMER_DEFAULT=60           # 60s base turn timeout
GAME_TIMER_PER_PLAYER=5         # 5s additional time per player
GAME_MAX_TIMER=180              # 3min maximum turn timeout
GAME_MIN_TIMER=15               # 15s minimum turn timeout
GAME_ACTION_THROTTLE=500        # 500ms between card actions
GAME_STACKING_THROTTLE=250      # 250ms for rapid stacking prevention
```

**Session Management:**
```javascript
SESSION_TIMEOUT=1800000         # 30min session expiration
SESSION_VALIDATION_TIMEOUT=10000 # 10s for session validation
SESSION_CHECK_INTERVAL=300000   # 5min session cleanup interval
SESSION_CLEANUP_INTERVAL=600000 # 10min garbage collection
```

**Reconnection Configuration:**
```javascript
RECONNECTION_INITIAL_DELAY=2000      # 2s initial reconnection delay
RECONNECTION_MAX_DELAY=30000         # 30s maximum delay
RECONNECTION_MAX_ATTEMPTS=5          # 5 reconnection attempts
RECONNECTION_BACKOFF_MULTIPLIER=1.5  # 1.5x exponential backoff
AUTO_RECONNECTION_TIMEOUT=15000      # 15s auto-reconnection timeout
```

### Adaptive Timeout Calculations

#### Turn Timer Adaptation
The backend automatically adjusts turn timeouts based on game complexity:

```javascript
function calculateAdaptiveTurnTimeout(playerCount, gameState = {}) {
    const baseTimeout = 60000; // 60s base
    const perPlayerTimeout = 5000; // 5s per player
    
    // Base calculation: base + (players * per-player-time)
    let adaptiveTimeout = baseTimeout + (playerCount * perPlayerTimeout);
    
    // Adjust for game complexity
    if (gameState.stackedCards && gameState.stackedCards.length > 3) {
        // Extra time for complex stacking (up to 15s)
        adaptiveTimeout += Math.min(gameState.stackedCards.length * 2000, 15000);
    }
    
    if (gameState.activeEffects && gameState.activeEffects.length > 0) {
        // Extra time for active card effects (3s per effect)
        adaptiveTimeout += gameState.activeEffects.length * 3000;
    }
    
    // Ensure within bounds (15s min, 180s max)
    return Math.max(15000, Math.min(adaptiveTimeout, 180000));
}
```

#### Database Operation Adaptation
Database timeouts adapt based on operation complexity and player count:

```javascript
function calculateAdaptiveDbTimeout(operation, playerCount = 1, options = {}) {
    const baseTimeout = 60000; // 60s base query timeout
    
    const operationMultipliers = {
        'simple_select': 1.0,
        'complex_join': 1.5,
        'game_state_update': 2.0,
        'card_validation': 1.2,
        'player_statistics': 1.8,
        'tournament_calculation': 3.0
    };
    
    const multiplier = operationMultipliers[operation] || 1.0;
    const playerMultiplier = 1 + (playerCount - 1) * 0.1; // 10% per player
    
    let adaptiveTimeout = baseTimeout * multiplier * playerMultiplier;
    
    if (options.highComplexity) {
        adaptiveTimeout *= 1.5;
    }
    
    return Math.min(adaptiveTimeout, 300000); // Cap at 5 minutes
}
```

#### Network Quality Adjustments
Timeouts automatically adjust based on detected network quality:

```javascript
function applyNetworkQualityAdjustment(timeout, networkQuality) {
    switch (networkQuality) {
        case 'poor':
            return Math.floor(timeout * 1.5); // 50% increase for poor networks
        case 'fair':
            return Math.floor(timeout * 1.2); // 20% increase for fair networks
        case 'good':
        default:
            return timeout; // Standard timeouts for good networks
    }
}
```

### Timeout Validation & Monitoring

#### Configuration Validation
On startup, the server validates timeout configurations to prevent conflicts:

```javascript
function validateTimeoutConfig() {
    const errors = [];
    
    // Critical relationships
    if (SOCKET_PING_TIMEOUT <= SOCKET_PING_INTERVAL) {
        errors.push('Socket pingTimeout must be greater than pingInterval');
    }
    
    if (GAME_MAX_TIMER <= GAME_MIN_TIMER) {
        errors.push('Game maxTurnTimeout must be greater than minTurnTimeout');
    }
    
    if (errors.length > 0) {
        throw new Error(`Invalid timeout configuration: ${errors.join(', ')}`);
    }
}
```

#### Performance Monitoring
Track timeout performance and adjust automatically:

```javascript
// Monitor database query performance
const dbQueryMonitor = new Map();

function trackDbQuery(operation, duration, playerCount) {
    const key = `${operation}_${playerCount}p`;
    if (!dbQueryMonitor.has(key)) {
        dbQueryMonitor.set(key, { count: 0, totalTime: 0, timeouts: 0 });
    }
    
    const stats = dbQueryMonitor.get(key);
    stats.count++;
    stats.totalTime += duration;
    
    // Track if query exceeded expected time
    const expectedTime = calculateAdaptiveDbTimeout(operation, playerCount);
    if (duration > expectedTime) {
        stats.timeouts++;
        
        // Adjust future timeouts if timeout rate is high
        if (stats.timeouts / stats.count > 0.1) { // 10% timeout rate
            logger.warn(`High timeout rate for ${key}: ${stats.timeouts}/${stats.count}`);
        }
    }
}
```

### Environment Configuration Examples

#### Development Environment
```bash
# Shorter timeouts for faster development cycles
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=15000
DB_QUERY_TIMEOUT=30000
GAME_TIMER_DEFAULT=30
```

#### Production Environment
```bash
# Optimized for stability and 8-player games
SOCKET_PING_TIMEOUT=120000
SOCKET_PING_INTERVAL=30000
DB_QUERY_TIMEOUT=60000
GAME_TIMER_DEFAULT=60
GAME_TIMER_PER_PLAYER=5
```

#### High-Latency Networks
```bash
# Extended timeouts for poor network conditions
SOCKET_PING_TIMEOUT=180000
SOCKET_CONNECTION_TIMEOUT=45000
RECONNECTION_MAX_DELAY=45000
AUTO_RECONNECTION_TIMEOUT=30000
```

### Best Practices

#### Timeout Configuration Guidelines

1. **Socket Timeouts**: 
   - Ping timeout should be 4x ping interval minimum
   - Connection timeout should allow for network handshake completion
   - Consider client-side timeout synchronization

2. **Database Timeouts**:
   - Query timeout should exceed expected query time by 100%
   - Acquire timeout should be longer than query timeout
   - Consider connection pool size vs. timeout values

3. **Game Timeouts**:
   - Base timer should accommodate thoughtful play
   - Per-player scaling prevents unfair disadvantages in large games
   - Maximum timeout prevents games from stalling indefinitely

4. **Reconnection Timeouts**:
   - Initial delay should be short for quick recovery
   - Maximum delay prevents infinite retry cycles
   - Backoff multiplier balances speed vs. server load

#### Monitoring & Alerting
```javascript
// Set up timeout monitoring
const timeoutMonitor = {
    socketTimeouts: 0,
    dbTimeouts: 0,
    gameTimeouts: 0,
    lastAlert: 0
};

function checkTimeoutHealth() {
    const now = Date.now();
    const alertThreshold = 5 * 60 * 1000; // 5 minutes
    
    if (now - timeoutMonitor.lastAlert > alertThreshold) {
        const totalTimeouts = timeoutMonitor.socketTimeouts + 
                             timeoutMonitor.dbTimeouts + 
                             timeoutMonitor.gameTimeouts;
        
        if (totalTimeouts > 10) {
            logger.warn('High timeout rate detected', {
                socket: timeoutMonitor.socketTimeouts,
                database: timeoutMonitor.dbTimeouts,
                game: timeoutMonitor.gameTimeouts,
                total: totalTimeouts
            });
            
            timeoutMonitor.lastAlert = now;
        }
    }
}
```

### Troubleshooting Common Timeout Issues

#### High Socket Disconnection Rate
**Symptoms**: Frequent 'ping timeout' events, player reconnections
**Solutions**:
- Increase `SOCKET_PING_TIMEOUT` to 120-180 seconds
- Reduce `SOCKET_PING_INTERVAL` to 20-25 seconds
- Check network infrastructure for packet loss

#### Database Query Timeouts
**Symptoms**: 'Query timeout' errors, delayed game updates
**Solutions**:
- Increase `DB_QUERY_TIMEOUT` based on query complexity
- Optimize database indexes for game queries
- Consider connection pool sizing

#### Game Turn Timeouts
**Symptoms**: Players timing out during complex turns
**Solutions**:
- Increase `GAME_TIMER_PER_PLAYER` for larger games
- Implement adaptive timing based on card stack complexity
- Consider separate timeouts for different action types

#### Session Persistence Issues
**Symptoms**: Players unable to reconnect, lost sessions
**Solutions**:
- Extend `SESSION_TIMEOUT` for longer games
- Reduce `SESSION_CHECK_INTERVAL` for faster cleanup
- Monitor session store memory usage

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