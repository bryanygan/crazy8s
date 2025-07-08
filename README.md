# 🎴 Crazy 8's Multiplayer Game

A real-time multiplayer implementation of the classic Crazy 8's card game with **advanced sequential stacking mechanics**, comprehensive rule validation, and a polished user interface.

## 🎮 Game Overview

Crazy 8's is a strategic card game similar to Uno, played with a standard 52-card deck. Players compete to be the first to empty their hand while navigating special card effects and **complex sequential stacking combinations** that simulate multiple turns played at once.

### Key Features
- **Real-time multiplayer** (2-4 players)
- **Advanced sequential stacking** with sophisticated turn control simulation
- **Tournament elimination** format across multiple rounds
- **Complex special card interactions** with turn control logic (Jack, Queen, Ace, 2, 8)
- **Intelligent card organization** (sort by rank/suit, grouping options)
- **Customizable settings** (experienced mode, visual preferences)
- **Responsive design** with mobile support
- **Real-time chat** and game notifications
- **Confetti celebrations** for player safety and game wins
- **Play again voting system** for seamless game continuation
- **Tournament progress tracking** with round management
- **Player safety notifications** and status displays
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

| Card | Effect | 2-Player Behavior |
|------|--------|-------------------|
| **Jack** | Skip next player | Keep turn (opponent skipped) |
| **Queen** | Reverse direction | Pass turn (reverses back to opponent) |
| **Ace** | Next player draws 4 cards | Pass turn + penalty |
| **2** | Next player draws 2 cards | Pass turn + penalty |
| **8** | Wild card - declare new suit | Pass turn after declaration |

### Advanced Sequential Stacking System

This implementation features a sophisticated stacking system that simulates playing multiple "turns" in sequence:

#### Basic Stacking Rules
✅ **Same Rank Stacking**: Always allowed
- Example: `7♥ → 7♣ → 7♠` (any combination of suits)

✅ **Same Suit Stacking**: Only if you maintain turn control
- Example: `J♦ → Q♦` (Jack keeps turn, so Queen can be stacked)

#### Turn Control Logic (2-Player)

**Turn-Keeping Cards:**
- **Jack**: Skips opponent → keeps turn
- **Even Queens**: `Q♦ → Q♥` (2 Queens cancel out) → keeps turn
- **Pure Jack Stacks**: `J♦ → J♥` → keeps turn

**Turn-Passing Cards:**
- **Odd Queens**: `Q♦` (single Queen reverses) → passes turn
- **Normal Cards**: `3, 4, 5, 6, 7, 9, 10, King` → pass turn
- **Draw Cards**: `Ace, 2` → pass turn (after penalty)
- **Wild Cards**: `8` → pass turn (after suit declaration)

#### Sequential Stacking Examples

**✅ Valid Complex Stacks:**
```
J♦ → Q♦         // Jack keeps turn → Queen allowed
Q♦ → Q♥ → 10♥   // 2 Queens keep turn → normal card allowed
J♦ → 10♦ → 10♥  // Jack keeps turn → same rank allowed
```

**❌ Invalid Complex Stacks:**
```
Q♦ → J♦         // Queen passes turn → cannot stack Jack
J♦ → 10♦ → 2♥   // Normal cards end turn → cannot stack different rank
9♣ → 9♠ → J♠    // Normal cards pass turn → cannot stack Jack
```

#### Stacking Validation Process

The game validates stacks by simulating sequential turns:

1. **Turn 1**: Play first group of matching cards
   - Does this maintain turn control?
2. **Turn 2**: Play next group (if turn control maintained)
   - Continue until stack is complete
3. **Validation**: Each transition checks previous turn control

**Example**: `J♦ → 10♦ → 10♥ → 2♥`
- Turn 1: `J♦` → Keep turn ✅
- Turn 2: `10♦ → 10♥` → Pass turn (normal cards)
- Turn 3: `2♥` → ❌ **BLOCKED** (no turn control after Turn 2)

### Penalty Card System

When you draw penalty cards (from Aces/2s):
1. **Draw all penalty cards** (no choice to counter with insufficient cards)
2. **Penalty cleared** (draw stack reset to 0)
3. **Normal play resumes** (can play any matching cards including newly drawn ones)

**Counter Cards:**
- **Aces counter**: Other Aces or same-suit 2s
- **2s counter**: Other 2s or same-suit Aces

## 🏗️ Project Structure

```
crazy8s-game/
├── backend/
│   ├── src/
│   │   ├── models/           # Game logic & data structures
│   │   │   ├── game.js       # Main game engine with advanced stacking
│   │   │   ├── cardPlayLogic.js # Multi-stage validation system
│   │   │   ├── Card.js       # Card entity
│   │   │   ├── Deck.js       # Deck management
│   │   │   └── Player.js     # Player entity
│   │   ├── controllers/      # API request handlers
│   │   ├── routes/           # Express route definitions
│   │   ├── utils/            # Utility functions
│   │   ├── app.js           # Express app setup
│   │   └── server.js        # Socket.IO server with turn control logic
│   ├── tests/               # Comprehensive test suites
│   │   ├── game.test.js     # Core game logic tests (150+ tests)
│   │   ├── cardPlayLogic.test.js # Validation system tests (200+ tests)
│   │   └── crazy8.test.js   # Integration tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   └── App.js       # Complete game interface with stacking UI
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
- **Advanced Game Engine** with sequential turn simulation
- **Multi-stage Validation System** with detailed error feedback
- **In-memory storage** for game state (easily extensible to database)

### Frontend Architecture
- **React** with modern hooks and state management
- **Socket.IO Client** for real-time server communication
- **Local Storage** for user settings persistence
- **Responsive CSS** with mobile-first design
- **Advanced Card Selection UI** with visual stacking indicators

### Key Technical Features

#### Advanced Validation System
- **Sequential Turn Simulation**: Validates complex stacking by simulating multiple turns
- **Turn Control Logic**: Sophisticated rules for 2-player vs multiplayer games
- **Multi-stage Validation**: Ownership → Stacking → Play rules → Turn control
- **Detailed Error Messages**: Specific feedback for invalid stacking attempts

#### Real-time Multiplayer
- **Instant game state synchronization**
- **Live player actions and chat**
- **Automatic reconnection handling**
- **Advanced debugging tools** for turn control analysis

#### Card Stacking Interface
- **Visual Selection System**: Click cards to build complex stacks
- **Stacking Order Indicators**: Numbered badges show play sequence
- **Turn Control Feedback**: Real-time validation with error messages
- **Bottom Card Highlighting**: Special indicator for stack foundation

## 🎉 Enhanced Game Experience

### Victory Celebrations
- **Confetti Animations**: Celebrate when players become safe or win the game
- **Player Safety Notifications**: Visual feedback when players advance to the next round
- **Tournament Winner Celebrations**: Special animations for tournament victors

### Play Again System
- **Voting Mechanism**: Players can vote to play another game after completion
- **Validation Logic**: Ensures proper game start conditions before beginning new rounds
- **Seamless Continuation**: Quick transition between games without losing player connections

### Tournament Features
- **Progress Tracking**: Monitor advancement through tournament rounds
- **Round Management**: Automatic handling of player eliminations and round transitions
- **Status Displays**: Real-time tournament status and player safety indicators
- **End-of-Round Modals**: Clear information about round results and next steps

## ⚙️ Game Settings

Access via the ⚙️ Settings button:

### Card Display
- **Sort by Rank**: Order cards 2→3→4...→Jack→Queen→King→Ace
- **Group by Suit**: Organize cards by suit (♥♦♣♠)

### Gameplay
- **Experienced Mode**: Remove visual hints, show all cards clearly

### Timer System
- **Turn Timer**: Configurable countdown with auto-draw
- **Warning System**: Visual alerts for time running out
- **Persistent Settings**: Timer preferences saved per player

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Test Coverage
- **Sequential Stacking Logic** (200+ test cases)
- **Turn Control Simulation** with edge cases
- **Multi-player vs 2-player** rule differences
- **Penalty Card Mechanics** and counter validation
- **Real-time Synchronization** testing
- **Performance and stress tests**

### Key Test Categories
- `game.test.js` - Core game mechanics (150+ tests)
- `cardPlayLogic.test.js` - Advanced stacking validation (200+ tests) 
- `crazy8.test.js` - End-to-end integration tests

## 🚧 Development Roadmap

### Current Features ✅
- [x] Advanced sequential stacking system
- [x] Sophisticated turn control simulation
- [x] Multi-stage validation with detailed feedback
- [x] Real-time multiplayer with comprehensive debugging
- [x] Advanced UI with visual stacking indicators
- [x] Penalty card system with counter mechanics
- [x] Comprehensive test coverage (95%+)
- [x] Responsive design with mobile support
- [x] Confetti celebrations for victories and player safety
- [x] Play again voting system with validation
- [x] Tournament progress tracking and round management
- [x] Player safety notifications and status displays

### Planned Features 🔄
- [ ] 3+ player specific stacking rules
- [ ] Tournament bracket visualization
- [ ] Advanced AI opponents with stacking strategy
- [ ] Replay system for game analysis
- [ ] Custom rule variations
- [ ] Performance optimization for complex stacks

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. **Test stacking mechanics thoroughly** (both 2-player and multiplayer)
4. Add comprehensive tests for new validation rules
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

### Development Guidelines
- **Test with multiple stacking scenarios** before submitting
- **Follow the sequential turn logic** for new stacking rules
- **Add debug logging** for complex validation paths
- **Verify frontend/backend validation consistency**
- **Test edge cases** thoroughly (especially turn control logic)

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Classic Crazy 8's card game rules
- Socket.IO for real-time communication
- React community for excellent documentation
- Jest testing framework for comprehensive testing
- Contributors and beta testers who helped refine the stacking logic

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check existing documentation for stacking rules
- Review test files for implementation examples
- Test with multiple players for multiplayer-specific issues

---

**Master the Art of Sequential Stacking!** 🎴✨

## 📋 Quick Reference

### Stacking Quick Guide
- **Same Rank**: Always stackable
- **Same Suit**: Only if you maintain turn control
- **Turn Control**: Determined by special card effects
- **Validation**: Each transition checks previous turn control

### Visual Indicators
- **Green Border**: Playable cards
- **Blue Highlight**: Selected cards  
- **Numbers**: Stacking order for multiple cards
- **Red Badge**: Bottom card in stack (foundation)
- **Error Messages**: Detailed feedback for invalid stacks


### Debug Information
- **Turn Control Logs**: Shows simulation results
- **Validation Steps**: Detailed breakdown of stack checking
- **Card Analysis**: Counts of special cards in stacks
- **Player State**: Current turn and game state information

Start your engines, gather your friends, and enjoy this comprehensive implementation of the classic card game with modern multiplayer features!

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/bryanygan/crazy8s?utm_source=oss&utm_medium=github&utm_campaign=bryanygan%2Fcrazy8s&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
