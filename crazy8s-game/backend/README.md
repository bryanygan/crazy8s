# Crazy 8's Game Backend

## Overview
This is the backend for the Crazy 8's game, built using Node.js, Express, and Socket.IO. The backend handles comprehensive game logic, advanced card play validation, player interactions, and real-time communication between players.

## Architecture Overview

### Core Components
- **Game Engine**: Complete rule implementation with advanced validation
- **Socket.IO Server**: Real-time multiplayer communication
- **REST API**: HTTP endpoints for game operations
- **Validation System**: Multi-stage card play validation
- **Testing Suite**: Comprehensive test coverage (95%+)

## Directory Structure
```
backend/
├── src/
│   ├── app.js                 # Express application setup
│   ├── server.js             # Socket.IO server with game logic
│   ├── models/               # Game logic and data structures
│   │   ├── game.js           # Main game engine
│   │   ├── cardPlayLogic.js  # Advanced validation system
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

### Advanced Game Engine
- **Complete Rule Implementation**: All Crazy 8's rules with edge cases
- **Card Stacking System**: Complex multi-card plays with validation
- **Special Card Effects**: Jack (skip), Queen (reverse), Ace (+4), 2 (+2), 8 (wild)
- **Turn Control Logic**: Sophisticated turn management for stacking
- **Draw Stack Management**: Accumulating penalties with counter mechanics

### Validation System (`cardPlayLogic.js`)
- **Multi-Stage Validation**: Basic requirements → Ownership → Stacking → Play rules
- **Turn Simulation**: Validates complex card chains using turn control logic
- **Detailed Error Messages**: Specific feedback for invalid plays
- **Performance Optimized**: Efficient validation for rapid gameplay

### Real-Time Communication
- **Socket.IO Integration**: Instant game state synchronization
- **Game State Broadcasting**: Automatic updates to all players
- **Chat System**: Real-time messaging with game action logs
- **Connection Management**: Handle player connects/disconnects/reconnects

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

# Verbose test output
npm run test:verbose
```

## API Documentation

### REST Endpoints

#### POST `/api/games/start`
Start a new game with specified players.

**Request Body:**
```json
{
  "playerIds": ["socket_id_1", "socket_id_2"],
  "playerNames": ["Alice", "Bob"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Game started",
  "gameId": "game_abc123",
  "gameState": { /* complete game state */ }
}
```

#### POST `/api/games/join`
Join an existing game.

**Request Body:**
```json
{
  "gameId": "game_abc123",
  "playerId": "socket_id_3",
  "playerName": "Charlie"
}
```

#### POST `/api/games/move`
Make a card play (supports single cards and stacking).

**Request Body:**
```json
{
  "gameId": "game_abc123",
  "playerId": "socket_id_1",
  "cards": [
    {"suit": "Hearts", "rank": "7"},
    {"suit": "Clubs", "rank": "7"}
  ],
  "declaredSuit": "Spades" // For wild cards (8s)
}
```

#### POST `/api/games/draw`
Draw cards from the deck.

**Request Body:**
```json
{
  "gameId": "game_abc123",
  "playerId": "socket_id_1",
  "count": 1 // Optional, defaults to 1 or draw stack amount
}
```

#### GET `/api/games/state/:gameId`
Get current game state.

**Response:**
```json
{
  "success": true,
  "gameState": {
    "gameId": "game_abc123",
    "gameState": "playing",
    "currentPlayer": "Alice",
    "currentPlayerId": "socket_id_1",
    "topCard": "7 of Hearts",
    "declaredSuit": null,
    "direction": 1,
    "drawStack": 0,
    "roundNumber": 1,
    "players": [/* player objects */],
    "drawPileSize": 35,
    "discardPileSize": 1
  }
}
```

### Socket.IO Events

#### Client → Server Events

**`createGame`**
```javascript
socket.emit('createGame', {
  playerName: "Alice"
});
```

**`joinGame`**
```javascript
socket.emit('joinGame', {
  gameId: "game_abc123",
  playerName: "Bob"
});
```

**`startGame`**
```javascript
socket.emit('startGame', {
  gameId: "game_abc123"
});
```

**`playCard`**
```javascript
socket.emit('playCard', {
  gameId: "game_abc123",
  cards: [
    {"suit": "Hearts", "rank": "King"},
    {"suit": "Clubs", "rank": "King"}
  ],
  declaredSuit: "Spades" // For wild cards
});
```

**`drawCard`**
```javascript
socket.emit('drawCard', {
  gameId: "game_abc123"
});
```

**`chat message`**
```javascript
socket.emit('chat message', "Hello everyone!");
```

#### Server → Client Events

**`gameUpdate`**
- Broadcast to all players when game state changes
- Contains complete game state object

**`handUpdate`**
- Sent to individual players with their current hand
- Array of card objects

**`cardPlayed`**
- Broadcast when a player makes a move
- Contains player name and cards played

**`playerDrewCards`**
- Broadcast when a player draws cards
- Contains player name and number of cards drawn

**`success` / `error`**
- Action feedback messages
- String messages for user notifications

**`playerDisconnected` / `playerReconnected`**
- Connection status updates
- Contains player name

## Game Logic Details

### Card Stacking Rules

1. **Same Rank Stacking**: Always allowed
   ```javascript
   // Valid: Multiple 7s of any suits
   ["7♥", "7♣", "7♠"]
   ```

2. **Same Suit Stacking**: Must maintain turn control
   ```javascript
   // Valid in 1v1: Jack skips, Queen reverses back
   ["Jack♥", "Queen♥"]
   ```

3. **Special Cross-Stacking**: Aces and 2s can cross-stack with same suit
   ```javascript
   // Valid: Same suit Ace + 2
   ["Ace♠", "2♠"]
   ```

### Special Card Effects

| Card | Effect | Implementation |
|------|--------|----------------|
| **Jack** | Skip next player | `nextPlayer()` called twice |
| **Queen** | Reverse direction | `direction *= -1` (or skip in 2-player) |
| **Ace** | +4 cards | `drawStack += 4` |
| **2** | +2 cards | `drawStack += 2` |
| **8** | Wild card | Set `declaredSuit` |

### Validation Flow

1. **Basic Requirements**: Game state, player turn, card count
2. **Card Ownership**: Verify player has all specified cards
3. **Stacking Validation**: Check multi-card play rules
4. **Play Validation**: Verify cards can be played on current top card
5. **Execution**: Remove from hand, add to discard pile, apply effects

## Testing Architecture

### Test Coverage
- **Core Game Logic**: 150+ tests covering all game mechanics
- **Validation System**: 200+ tests for card play validation
- **Integration Tests**: End-to-end gameplay scenarios
- **Error Handling**: Edge cases and invalid inputs
- **Performance Tests**: Stress testing with rapid operations

### Test Categories

**Unit Tests (`game.test.js`)**
- Game initialization and setup
- Turn management
- Card validation
- Special card effects
- Win conditions
- Error handling

**Validation Tests (`cardPlayLogic.test.js`)**
- Multi-stage validation process
- Card stacking logic
- Turn simulation
- Error message generation
- Performance testing

**Integration Tests (`crazy8.test.js`)**
- Complete game flow
- Multiplayer scenarios
- State consistency
- Real-time updates

### Running Specific Tests
```bash
# Run specific test file
npm test game.test.js

# Run tests matching pattern
npm test -- --testNamePattern="stacking"

# Run with coverage for specific file
npm test -- --collectCoverageFrom="src/models/game.js"
```

## Configuration

### Environment Variables
```bash
PORT=3001                    # Server port
NODE_ENV=development         # Environment mode
```

### Dependencies

**Production Dependencies:**
- `express`: Web framework
- `socket.io`: Real-time communication

**Development Dependencies:**
- `jest`: Testing framework
- `nodemon`: Development auto-restart
- `@types/jest`: TypeScript definitions for Jest

## Performance Considerations

### Optimizations
- **In-Memory Storage**: Fast game state access
- **Efficient Validation**: Optimized card checking algorithms
- **Minimal Broadcasting**: Only send necessary updates
- **Connection Pooling**: Efficient Socket.IO connection management

### Scalability
- **Stateless Design**: Easy to scale horizontally
- **Game Instance Isolation**: Independent game states
- **Memory Management**: Automatic cleanup of finished games
- **Database Ready**: Easy migration to persistent storage

## Debugging

### Debug Information
- **Socket Events**: Detailed logging of all socket communications
- **Game State Changes**: Comprehensive state transition logs
- **Validation Steps**: Step-by-step validation process logging
- **Error Tracking**: Detailed error messages with context

### Common Issues
1. **Turn Synchronization**: Check player ID matching
2. **Card Validation**: Verify card ownership and rules
3. **Socket Connections**: Monitor connection/disconnection events
4. **State Consistency**: Ensure proper game state updates

## Future Enhancements

### Planned Features
- **Database Integration**: Persistent game storage
- **User Authentication**: Account-based player management
- **Game Analytics**: Statistics and performance tracking
- **Load Balancing**: Multi-server deployment support
- **API Rate Limiting**: Protection against abuse

### Technical Debt
- **Tournament System**: Complete multi-round elimination
- **Reconnection Logic**: Improved mid-game reconnection
- **Memory Optimization**: Better large-scale performance
- **Error Recovery**: Graceful handling of edge cases

## License
MIT License - see main project README for details.