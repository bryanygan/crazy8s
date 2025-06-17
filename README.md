# 🎴 Crazy 8's Multiplayer Game

A real-time multiplayer implementation of the classic Crazy 8's card game with advanced stacking mechanics and tournament-style elimination rounds.

## 🎮 Game Overview

Crazy 8's is a strategic card game similar to Uno, played with a standard 52-card deck. Players compete to be the first to empty their hand while navigating special card effects and complex stacking combinations.

### Key Features
- **Real-time multiplayer** (2-4 players)
- **Advanced card stacking** with turn logic simulation
- **Tournament elimination** format across multiple rounds
- **Complex special card interactions** (Jack, Queen, Ace, 2, 8)
- **Customizable settings** (card sorting, experienced mode)
- **Responsive design** with mobile support

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

### Advanced Stacking

**Same Rank Stacking**: Play multiple cards of the same rank in one turn
- Example: `7♥ + 7♣ + 7♠` (any combination of suits)

**Turn Chain Stacking**: Special cards that maintain turn control can chain together
- Example: `Jack♦ → Queen♦ → Queen♣ → King♣` (valid in 1v1)
- Logic: Jack skips opponent, 2 Queens reverse twice (back to you), King ends turn

**Draw Effect Stacking**: Aces and 2s accumulate draw penalties
- Example: `Ace♠ + 2♠ = +6 cards` to next player
- Counter with matching Ace/2 or draw the penalty

### Stacking Rules

✅ **Valid Stacking**:
- Same rank: `5♦ → 5♣ → 5♠`
- Special card chains: `Jack♦ → Queen♦` (both special, same suit)
- Cross effects: `Ace♠ → 2♠` (special rule)

❌ **Invalid Stacking**:
- Different rank/suit: `5♦ → King♦` (5 doesn't maintain turn)
- Non-special chains: `3♥ → 7♥` (neither maintains turn)

## 🏗️ Project Structure

```
crazy8s-game/
├── backend/
│   ├── src/
│   │   ├── models/           # Game logic & data structures
│   │   │   ├── game.js       # Main game engine
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
│   ├── tests/               # Test suites
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   └── App.js       # Main game interface
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
- **Node.js** game engine with comprehensive rule validation
- **In-memory storage** for game state (easily extensible to database)

### Frontend Architecture
- **React** for responsive UI components
- **Socket.IO Client** for real-time server communication
- **Local Storage** for user settings persistence
- **Responsive CSS** for mobile and desktop support

### Key Features

#### Real-time Multiplayer
- Instant game state synchronization
- Live player actions and chat
- Automatic reconnection handling
- Player disconnect/reconnect support

#### Advanced Game Logic
- Complete Crazy 8's rule implementation
- Complex card stacking validation
- Special card effect processing
- Tournament elimination system

#### User Experience
- Visual card selection with stacking indicators
- Drag-and-drop card organization
- Customizable game settings
- Toast notifications for all actions

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

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Test Coverage
- Game logic validation
- Card stacking mechanics
- Special card effects
- Tournament progression
- API endpoint functionality

## 🚧 Development Roadmap

### Current Features ✅
- [x] Core game mechanics
- [x] Real-time multiplayer
- [x] Advanced card stacking
- [x] Special card effects
- [x] User settings system
- [x] Responsive UI

### Planned Features 🔄
- [ ] Tournament format completion
- [ ] User accounts & authentication
- [ ] Game statistics & leaderboards
- [ ] Custom game rules
- [ ] Spectator mode
- [ ] Mobile app (React Native)
- [ ] AI opponents
- [ ] Replay system

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
- Follow existing code style
- Add tests for new features
- Update documentation
- Test multiplayer scenarios

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Classic Crazy 8's card game rules
- Socket.IO for real-time communication
- React community for excellent documentation
- Contributors and testers

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check existing documentation
- Review test files for examples

---

**Enjoy playing Crazy 8's!** 🎴✨

## Crazy 8's Game Rules

## Overview
Crazy 8's is a card game similar to Uno, played with a standard 52-card deck. The objective is to be the first player to get rid of all your cards and avoid being the last player remaining across multiple rounds.

## Setup
- **Players**: 2-4 players
- **Deck**: Standard 52-card deck
- **Starting Hand**: Each player receives 8 cards
- **Draw Pile**: Remaining cards form the draw pile (face down)
- **Discard Pile**: Turn over the top card of the draw pile to start the discard pile (face up)

## Basic Gameplay

### Turn Order
Play proceeds clockwise around the table, unless reversed by a Queen card.

### Playing Cards
On your turn, you must play a card that matches either:
- **The suit** of the top card on the discard pile, OR
- **The number/rank** of the top card on the discard pile

If you cannot play a card, you must draw one card from the draw pile. If the drawn card can be played, you may play it immediately. If not, your turn ends.

### Winning a Round
The first player to play all their cards is "safe" and advances to the next round. Play continues until only one player has cards remaining - that player is eliminated.

## Special Cards

### Jack - Skip
- The next player loses their turn
- Play continues to the player after the skipped player

### Queen - Reverse
- Reverses the direction of play
- In a 2-player game, acts as a Skip

### Ace - Draw Four (+4)
- The next player must draw 4 cards from the draw pile
- **Stacking Rule**: Can be countered by playing another Ace (any suit) or a 2 of the same suit
- Effects stack: Multiple Aces/2s increase the total cards to be drawn

### 2 - Draw Two (+2)
- The next player must draw 2 cards from the draw pile
- **Stacking Rule**: Can be countered by playing another 2 (any suit) or an Ace of the same suit
- Effects stack: Multiple 2s/Aces increase the total cards to be drawn

### 8 - Wild Card
- Can be played on any card
- Player declares the new suit for the discard pile
- Next player must match the declared suit or play another special card

### All Other Cards (3, 4, 5, 6, 7, 9, 10, King)
- No special effects
- Must follow normal matching rules

## Card Stacking Rules

### Basic Stacking
You can play multiple cards of the same rank in a single turn if:
- The **bottom card** matches the suit or rank of the top discard pile card
- All **additional cards** have the same rank as the bottom card
- There is no limit to how many cards you can stack

**Example**: If a 7 of Spades is on the discard pile, you can play a 7 of Hearts (bottom) + 7 of Clubs + 7 of Diamonds in one turn.

### Special Card Stacking
- **Aces and 2s**: Can only be stacked with other Aces/2s of the **same suit**
- **Draw effects stack**: Each additional Ace adds +4, each additional 2 adds +2

## Draw Card Mechanics

### Carrying Over Effects
When an Ace (+4) is played:
- The next player can avoid drawing by playing:
  - Another Ace (any suit) or matching 2 of the same suit

When an 2 (+2) is played:
- The next player can avoid drawing by playing:
  - Another 2 (any suit) or matching Ace of the same suit (for 2s)

Effects accumulate until someone cannot or chooses not to counter

### Drawing Cards
- Players **must** draw the accumulated total if they cannot counter
- Players **may choose** to draw even if they have a valid counter card
- After drawing, the player can play their drawn cards. 

**Example**: Player A plays Ace of Spades (+4) → Player B plays Ace of Hearts (+4, total now +8) → Player C plays 2 of Hearts (+2, total now +10) → Player D has no valid counter and draws 10 cards.

## Tournament Format

### Elimination Rounds
1. Players who empty their hands first are "safe" and advance to the next round
2. The last player with cards is eliminated
3. Safe players start a new round with 8 fresh cards
4. Continue until only one player remains - they are the winner

### Round Progression
- Round continues until all but one player have emptied their hands
- Eliminated players do not participate in subsequent rounds
- Winner is the sole survivor of the final round

## Additional Rules

### Empty Draw Pile
If the draw pile is empty, shuffle the discard pile (except the top card) to form a new draw pile.

### Invalid Plays
If a player makes an invalid play, they must take back their cards and draw one penalty card.

## Quick Reference

| Card | Effect |
|------|--------|
| Jack | Skip next player |
| Queen | Reverse direction |
| Ace | +4 cards (stackable with Aces/2s of same suit) |
| 2 | +2 cards (stackable with 2s/Aces of same suit) |
| 8 | Wild card - choose new suit |
| All others | No special effect |

**Stacking**: Same rank cards can be played together if bottom card is valid

**Countering**: Aces counter with Aces/matching 2s, 2s counter with 2s/matching Aces

**Victory**: Last player standing wins the tournament
