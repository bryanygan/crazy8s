# 🎴 Crazy 8's Multiplayer Game

A real-time multiplayer implementation of the classic Crazy 8's card game with **advanced sequential stacking mechanics**, comprehensive rule validation, and a polished user interface.

## 🎮 Game Overview

Crazy 8's is a strategic card game similar to Uno, played with a standard 52-card deck. Players compete to be the first to empty their hand while navigating special card effects and **complex sequential stacking combinations** that simulate multiple turns played at once.

### Key Features
- **Real-time multiplayer** (2-4 players)
- **30-second preparation phase** with optional skip voting system
- **Advanced sequential stacking** with sophisticated turn control simulation
- **Tournament elimination** format across multiple rounds
- **Complex special card interactions** with turn control logic (Jack, Queen, Ace, 2, 8)
- **Intelligent card organization** (sort by rank/suit, grouping options)
- **Customizable settings** (experienced mode, visual preferences)
- **Responsive design** with mobile support
- **Real-time chat** and game notifications
- **Robust disconnection/reconnection system** with session preservation
- **Comprehensive test suite** with 95%+ coverage
- **Duplicate game creation prevention** (frontend protection implemented)

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
2. **Preparation Phase**: 30-second period to review your cards and plan strategy
   - Players can vote to skip this phase if all agree
   - Use this time to sort your cards and identify key plays
3. **Playing**: On your turn, play a card that matches the top card's **suit** or **rank**
4. **Drawing**: If you can't play, draw a card from the deck
5. **Winning**: First player to empty their hand is "safe" and advances to the next round
6. **Elimination**: Last player with cards is eliminated from the tournament

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

## ⏰ Preparation Phase

The preparation phase is a 30-second strategic planning period that occurs at the start of each new game (not between tournament rounds). This feature helps players review their cards and plan their opening strategy.

### How It Works

1. **Automatic Start**: When a new game begins, players enter the preparation phase
2. **30-Second Timer**: A countdown timer shows the remaining preparation time
3. **Card Review**: Use this time to:
   - Sort and organize your hand
   - Identify potential stacking combinations
   - Plan your opening moves
   - Review the starting discard card

### Skip Voting System

Players can vote to skip the preparation phase if everyone agrees:

- **Unanimous Required**: All connected players must vote to skip
- **Real-time Updates**: Vote counts update instantly as players vote
- **Immediate Transition**: Game starts as soon as all players vote
- **Visual Feedback**: Progress indicator shows current vote status

### Player Connection Handling

- **Connected Players Only**: Only connected players can vote
- **Dynamic Recalculation**: Vote requirements adjust if players disconnect/reconnect
- **Session Preservation**: Previous votes are preserved if a player reconnects
- **Graceful Handling**: Disconnected players don't block the voting process

### User Interface

The preparation phase features a modal overlay with:
- **Large countdown timer** with color-coded urgency (blue → red)
- **Vote status display** showing current progress
- **Player badges** indicating who has voted
- **Skip/Remove vote buttons** for easy interaction
- **Smooth animations** and visual feedback

### When It Activates

- ✅ **New game start**: Fresh tournament or single game
- ❌ **Between rounds**: Tournament rounds transition directly to playing
- ❌ **Reconnection**: Players rejoining skip preparation phase

## 🔌 Disconnection/Reconnection System

The game features a sophisticated reconnection system that preserves your game session and allows seamless recovery from network interruptions.

### How It Works
- **Session Preservation**: Your game state is automatically saved for 30 minutes after disconnection
- **Automatic Reconnection**: The game attempts to reconnect automatically using exponential backoff
- **Game State Restoration**: Your hand, turn state, and game progress are fully restored
- **Visual Feedback**: Real-time connection status with latency monitoring

### Connection States
- 🟢 **Connected**: Stable connection with server
- 🟡 **Connecting**: Initial connection in progress
- 🟠 **Reconnecting**: Attempting to reconnect after interruption
- 🔴 **Disconnected**: No connection, but session preserved
- ❌ **Failed**: Connection failed after maximum attempts

### Reconnection Features
- **Network Blip Detection**: Brief disconnections (< 5 seconds) are handled gracefully
- **Mid-Turn Recovery**: If you disconnect during your turn, you can resume exactly where you left off
- **Guest & Authenticated Users**: Full support for both guest players and authenticated users
- **Multi-Player Coordination**: Other players see your connection status and receive notifications
- **Edge Case Handling**: Special handling for disconnections during round transitions, eliminations, etc.

### User Experience
- **Connection Status Indicator**: Always-visible indicator in the top-right corner
- **Smart Notifications**: Contextual messages about connection events
- **Latency Monitoring**: Real-time ping display with quality ratings
- **Progressive Reconnection**: Up to 5 automatic attempts with increasing delays
- **Manual Recovery**: Clear instructions if automatic reconnection fails

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
│   │   ├── controllers/      # API request handlers & authentication
│   │   ├── routes/           # Express route definitions
│   │   ├── stores/           # Session and state management
│   │   │   ├── SessionStore.js # Session persistence for reconnection
│   │   │   └── UserStore.js    # User management and authentication
│   │   ├── utils/            # Utility functions
│   │   │   ├── connectionHandler.js # Reconnection edge case handling
│   │   │   ├── eventEmitter.js # Standardized event emissions
│   │   │   ├── connectionLogger.js # Connection monitoring & analytics
│   │   │   └── socketValidator.js # Socket validation utilities
│   │   ├── middleware/       # Express middleware
│   │   ├── config/          # Database and configuration
│   │   ├── migrations/      # Database migrations
│   │   ├── app.js           # Express app setup with authentication
│   │   └── server.js        # Socket.IO server with enhanced reconnection
│   ├── tests/               # Comprehensive test suites
│   │   ├── game.test.js     # Core game logic tests (150+ tests)
│   │   ├── cardPlayLogic.test.js # Validation system tests (200+ tests)
│   │   ├── crazy8.test.js   # Integration tests
│   │   └── test-reconnection.js # Reconnection system tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (modular architecture)
│   │   │   ├── App.js       # Main application component
│   │   │   ├── auth/        # Authentication components
│   │   │   │   ├── AuthModal.js    # Login/register modal
│   │   │   │   ├── Login.js        # Login form
│   │   │   │   ├── Register.js     # Registration form
│   │   │   │   ├── Profile.js      # User profile
│   │   │   │   └── UserDashboard.js # User dashboard
│   │   │   ├── game/        # Game-specific components
│   │   │   │   └── Card.js         # Individual card component
│   │   │   ├── ui/          # Reusable UI components
│   │   │   │   ├── Toast.js        # Toast notification
│   │   │   │   ├── ToastContainer.js # Toast container
│   │   │   │   └── TurnTimer.js     # Turn timer
│   │   │   ├── ConnectionStatus.js # Real-time connection indicator
│   │   │   └── ConnectionNotifications.js # Toast notifications
│   │   ├── contexts/        # React context providers
│   │   │   ├── AuthContext.js      # Authentication state
│   │   │   └── ConnectionContext.js # Connection state management
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useGameState.js     # Game state management
│   │   │   ├── useSettings.js      # Settings management
│   │   │   ├── useToasts.js        # Toast notifications
│   │   │   ├── useModals.js        # Modal state
│   │   │   ├── usePlayerHand.js    # Player hand logic
│   │   │   ├── useTimer.js         # Timer functionality
│   │   │   ├── useTournament.js    # Tournament logic
│   │   │   ├── usePlayAgainVoting.js # Voting system
│   │   │   └── useReconnectionHandler.js # Reconnection logic
│   │   ├── utils/           # Utility functions
│   │   │   ├── cardUtils.js        # Card manipulation utilities
│   │   │   ├── cardValidation.js   # Card validation logic
│   │   │   ├── animationUtils.js   # Animation helpers
│   │   │   ├── settingsMigration.js # Settings migration
│   │   │   ├── socketAuth.js       # Socket authentication
│   │   │   └── theme.js            # Theme utilities
│   │   ├── styles/          # CSS styling
│   │   └── index.js         # React entry point
│   ├── public/
│   └── package.json
├── claude-workspace/        # Documentation and development notes
│   ├── COMPONENT_DOCUMENTATION.md # Comprehensive component docs
│   ├── DEVELOPER_GUIDE.md   # Development guidelines
│   └── [other documentation files]
└── README.md
```

## 🔄 Recent Refactoring (2024)

The frontend codebase underwent a major refactoring to improve maintainability, reusability, and developer experience:

### Refactoring Highlights

#### **Modular Component Architecture**
- **Before**: Monolithic `App.js` component (1000+ lines)
- **After**: Modular components organized by feature (`auth/`, `game/`, `ui/`)
- **Benefits**: Easier maintenance, better collaboration, improved testing

#### **Custom Hooks Extraction**
- Extracted reusable logic into 10+ custom hooks
- State management separated from UI concerns
- Improved code reusability across components

#### **Context Providers**
- **AuthContext**: Centralized authentication state and methods
- **ConnectionContext**: Real-time connection management
- **Benefits**: Eliminated prop drilling, cleaner component APIs

#### **Authentication System**
- Complete user authentication with JWT tokens
- Local settings migration to authenticated accounts
- Profile management and persistent settings
- Guest mode support maintained

#### **Enhanced Documentation**
- Comprehensive JSDoc documentation for all components and hooks
- Detailed component documentation in `claude-workspace/`
- Code quality improvements and inline comments

### Migration Benefits

1. **Developer Experience**: Clearer code organization and easier onboarding
2. **Maintainability**: Smaller, focused components easier to debug and modify
3. **Reusability**: Components and hooks can be reused across the application
4. **Testing**: Better unit test coverage with isolated components
5. **Performance**: Optimized re-rendering and code splitting opportunities

For detailed component documentation, see [`claude-workspace/COMPONENT_DOCUMENTATION.md`](claude-workspace/COMPONENT_DOCUMENTATION.md).

## 🔧 Technical Implementation

### Backend Architecture
- **Express.js** for RESTful API endpoints
- **Socket.IO** for real-time multiplayer communication with enhanced reconnection
- **Advanced Game Engine** with sequential turn simulation
- **Multi-stage Validation System** with detailed error feedback
- **Session Store** for disconnection/reconnection state management
- **Connection Handler** for edge case scenarios and network blips
- **Event Emitter System** for standardized client communication
- **In-memory storage** for game state (easily extensible to database)

### Frontend Architecture
- **React** with modern hooks and state management
- **Socket.IO Client** for real-time server communication with auto-reconnection
- **Connection Context** for centralized connection state management
- **Reconnection Hook** for game state restoration and edge case handling
- **Connection Status Components** for real-time visual feedback
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
- **Robust disconnection/reconnection system** with session preservation
- **Automatic reconnection handling** with game state restoration
- **Advanced debugging tools** for turn control analysis

#### Card Stacking Interface
- **Visual Selection System**: Click cards to build complex stacks
- **Stacking Order Indicators**: Numbered badges show play sequence
- **Turn Control Feedback**: Real-time validation with error messages
- **Bottom Card Highlighting**: Special indicator for stack foundation

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
- [x] Robust disconnection/reconnection system with session preservation
- [x] Comprehensive test coverage (95%+)
- [x] Responsive design with mobile support

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

## 🔧 Known Issues & Limitations

### Duplicate Game Creation
**Status**: Partially Fixed (Frontend Protection Only)

- **Issue**: Multiple rapid clicks on "Create Game" can create duplicate games
- **Current Fix**: Frontend prevents duplicate button clicks with loading state protection
- **Limitation**: Backend duplicate prevention mechanism is not functioning correctly
- **Impact**: Users who bypass frontend protection may still create duplicate games
- **Recommendation**: Always wait for game creation to complete before clicking again

### Best Practices for Game Creation
- Click "Create Game" once and wait for response
- Don't refresh the page during game creation
- If game creation appears stuck, wait 5 seconds before trying again
- Report persistent issues through GitHub

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
