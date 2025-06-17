# 🎴 Crazy 8's Multiplayer Game

A real-time multiplayer implementation of the classic Crazy 8's card game with advanced stacking mechanics, comprehensive rule validation, and a polished user interface.

## 🎮 Game Overview

Crazy 8's is a strategic card game similar to Uno, played with a standard 52-card deck. Players compete to be the first to empty their hand while navigating special card effects and complex stacking combinations.

### Key Features
- **Real-time multiplayer** (2-4 players)
- **Advanced card stacking** with comprehensive validation logic
- **Tournament elimination** format across multiple rounds
- **Complex special card interactions** (Jack, Queen, Ace, 2, 8)
- **Intelligent card organization** (sort by rank/suit, grouping options)
- **Customizable settings** (experienced mode, visual preferences)
- **Responsive design** with mobile support
- **Real-time chat** and game notifications
- **Comprehensive test suite** with 95%+ coverage

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+ recommended)
- npm or yarn

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bryanygan/crazy8s.git
   cd crazy8s-game
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the backend server**
   ```bash
   cd ../backend
   npm start
   # Server runs on http://localhost:3001
   ```

5. **Start the frontend application**
   ```bash
   cd ../frontend
   npm start
   # App runs on http://localhost:3000
   ```

6. **Play the game**
   - Open your browser to `http://localhost:3000`
   - Create or join a game
   - Start playing!

## 🎯 How to Play

### Basic Gameplay

1. **Starting**: Each player receives 8 cards, with one card face-up as the discard pile
2. **Playing**: On your turn, play a card that matches the top card's **suit** or **rank**
3. **Drawing**: If you can't play, draw a card from the deck
4. **Winning**: First player to empty their hand is "safe" and advances to the next round
5. **Elimination**: Last player with cards is eliminated from the tournament

### Special Cards

| Card | Effect |
|------|--------|
| **Jack** | Skip next player |
| **Queen** | Reverse direction (Skip in 2-player) |
| **Ace** | Next player draws 4 cards |
| **2** | Next player draws 2 cards |
| **8** | Wild card - declare new suit |

### Advanced Stacking System

**Same Rank Stacking**: Play multiple cards of the same rank in one turn
- Example: `7♥ + 7♣ + 7♠` (any combination of suits)

**Turn Chain Stacking**: Special cards can chain together when they maintain turn control
- Example: `Jack♦ → Queen♦ → Queen♣ → King♣` (valid in 1v1)
- Logic: Jack skips opponent, 2 Queens reverse twice (back to you), King ends turn

**Draw Effect Stacking**: Aces and 2s accumulate draw penalties
- Example: `Ace♠ + 2♠ = +6 cards` to next player
- Counter with matching Ace/2 or draw the penalty

### Stacking Rules

✅ **Valid Stacking**:
- Same rank: `5♦ → 5♣ → 5♠`
- Same suit: `5♦ → Queen♦ → 8♦`
- Special counters: `Ace♠ → 2♠` (cross-countering)

❌ **Invalid Stacking**:
- Different rank/suit: `5♦ → King♣` (no connection)
- Wrong suit for specials: `Ace♠ → 2♦` (different suits)

## 🎮 New Features

### User Interface Enhancements
- **Card Selection**: Visual indicators for playable cards and stacking order
- **Smart Organization**: Sort by rank, group by suit, or both
- **Experienced Mode**: Clean view without visual hints for experienced players
- **Real-time Notifications**: Toast messages for all game actions
- **Settings Persistence**: User preferences saved between sessions

### Game Mechanics
- **Comprehensive Validation**: Advanced rule checking with detailed error messages
- **Turn Simulation**: Stack validation uses turn control logic
- **Counter Mechanics**: Ace/2 cross-countering with suit matching
- **Chat System**: Real-time communication with game action logs

## 🏗️ Project Structure

```
crazy8s-game/
├── backend/
│   ├── src/
│   │   ├── models/           # Game logic & data structures
│   │   │   ├── game.js       # Main game engine
│   │   │   ├── cardPlayLogic.js # Advanced validation system
│   │   │   ├── Card.js       # Card entity
│   │   │   ├── Deck.js       # Deck management
│   │   │   └── Player.js     # Player entity
│   │   ├── controllers/      # API request handlers
│   │   │   └── gameController.js
│   │   ├── routes/           # Express route definitions
│   │   │   └── gameRoutes.js
│   │   ├── utils/            # Utility functions
│   │   │   └── deck.js       # Deck operations
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Socket.IO server
│   ├── tests/               # Comprehensive test suites
│   │   ├── game.test.js     # Core game logic tests
│   │   ├── cardPlayLogic.test.js # Validation system tests
│   │   └── crazy8.test.js   # Integration tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   └── App.js       # Complete game interface
│   │   ├── styles/          # CSS styling
│   │   └── index.js         # React entry point
│   ├── public/
│   └── package.json
└── README.md
```

## 🔧 Technical Implementation

### Backend Architecture
- **Express.js** for RESTful API endpoints
- **Socket.IO** for real-time multiplayer communication
- **Advanced Game Engine** with comprehensive rule validation
- **Modular Design** with separate validation system
- **In-memory storage** for game state (easily extensible to database)

### Frontend Architecture
- **React** with modern hooks and state management
- **Socket.IO Client** for real-time server communication
- **Local Storage** for user settings persistence
- **Responsive CSS** with mobile-first design
- **Component-based UI** for maintainable code

### Key Technical Features

#### Advanced Card Play Validation
- **Multi-stage validation** (ownership, stacking, play rules)
- **Turn simulation** for complex stacking scenarios
- **Detailed error messages** with specific feedback
- **Performance optimized** for rapid play validation

#### Real-time Multiplayer
- **Instant game state synchronization**
- **Live player actions and chat**
- **Automatic reconnection handling**
- **Player disconnect/reconnect support**
- **Debug information** for troubleshooting

#### User Experience
- **Visual card selection** with stacking indicators
- **Customizable card organization**
- **Settings modal** with persistent preferences
- **Toast notifications** for all actions
- **Responsive design** for all screen sizes

## ⚙️ Game Settings

Access via the ⚙️ Settings button:

### Card Display
- **Sort by Rank**: Order cards 2→3→4...→Jack→Queen→King→Ace
- **Group by Suit**: Organize cards by suit (♥♦♣♠)

### Gameplay
- **Experienced Mode**: Remove visual hints, show all cards clearly

## 🎯 API Documentation

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/games/start` | Start a new game |
| POST | `/api/games/join` | Join existing game |
| POST | `/api/games/move` | Make a card play |
| POST | `/api/games/draw` | Draw cards |
| GET | `/api/games/state/:id` | Get game state |

### Socket.IO Events

#### Client → Server
- `createGame` - Create new game room
- `joinGame` - Join game by ID
- `startGame` - Begin gameplay
- `playCard` - Play card(s)
- `drawCard` - Draw from deck
- `chat message` - Send chat message

#### Server → Client
- `gameUpdate` - Game state changes
- `handUpdate` - Player hand updates
- `cardPlayed` - Card play notifications
- `success/error` - Action feedback
- `playerDrewCards` - Draw notifications

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:verbose       # Detailed output
```

### Test Coverage
- **Game logic validation** (95%+ coverage)
- **Card stacking mechanics** with edge cases
- **Special card effects** and interactions
- **API endpoint functionality**
- **Integration tests** for full game flow
- **Performance and stress tests**

### Test Suites
- `game.test.js` - Core game mechanics (150+ tests)
- `cardPlayLogic.test.js` - Advanced validation (200+ tests)
- `crazy8.test.js` - End-to-end integration tests

## 🚧 Development Roadmap

### Current Features ✅
- [x] Core game mechanics with advanced validation
- [x] Real-time multiplayer with chat
- [x] Advanced card stacking system
- [x] Complete special card effects
- [x] User settings and preferences
- [x] Comprehensive test coverage
- [x] Responsive UI with mobile support
- [x] Debug tools and logging

### Planned Features 🔄
- [ ] Tournament format completion
- [ ] User accounts & authentication
- [ ] Game statistics & leaderboards
- [ ] Custom game rules
- [ ] Spectator mode
- [ ] Mobile app (React Native)
- [ ] AI opponents
- [ ] Replay system
- [ ] Database persistence

### Known Issues 🐛
- Tournament elimination needs refinement
- Reconnection during mid-game needs improvement
- Performance optimization for large hands

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add comprehensive tests for new features
- Update documentation and README files
- Test multiplayer scenarios thoroughly
- Use meaningful commit messages

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Classic Crazy 8's card game rules
- Socket.IO for real-time communication
- React community for excellent documentation
- Jest testing framework
- Contributors and beta testers

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check existing documentation
- Review test files for implementation examples
- Test with multiple players for multiplayer issues

---

**Enjoy playing Crazy 8's!** 🎴✨

## 📋 Quick Reference

### Game Controls
- **Select Cards**: Click to select/deselect cards for stacking
- **Play Cards**: Click "Play Cards" button after selection
- **Draw Card**: Click "Draw Card" when you can't play
- **Settings**: Click ⚙️ to access game preferences
- **Chat**: Use bottom-right chat panel for communication

### Visual Indicators
- **Green Border**: Playable cards
- **Blue Highlight**: Selected cards
- **Numbers**: Stacking order for multiple cards
- **Red Badge**: Bottom card in stack
- **Grayed Out**: Unplayable cards (unless experienced mode)

### Keyboard Shortcuts
- **Enter**: Send chat message
- **Escape**: Cancel suit selection or close modals