# Crazy 8's Game

## Project Overview
Crazy 8's is a comprehensive multiplayer card game implementation that allows players to compete against each other in real-time. This project features advanced game mechanics, sophisticated card stacking systems, and a polished user interface designed for both casual and experienced players.

## 🎮 Key Features

### Game Mechanics
- **Real-time Multiplayer**: 2-4 player support with instant synchronization
- **Advanced Card Stacking**: Complex multi-card plays with comprehensive validation
- **Tournament Format**: Elimination-style rounds with safe/eliminated players
- **Special Card Effects**: Full implementation of Jack, Queen, Ace, 2, and 8 cards
- **Counter Mechanics**: Sophisticated Ace/2 cross-countering system

### User Experience
- **Intelligent Card Organization**: Sort by rank, group by suit, or both
- **Visual Selection System**: Clear indicators for playable cards and stacking order
- **Customizable Settings**: Experienced mode and display preferences
- **Real-time Chat**: Live messaging with automatic game action logging
- **Responsive Design**: Optimized for desktop and mobile devices

### Technical Excellence
- **Comprehensive Testing**: 95%+ test coverage with 350+ unit tests
- **Advanced Validation**: Multi-stage card play validation with detailed error messages
- **Performance Optimized**: Efficient algorithms for rapid gameplay
- **Modular Architecture**: Clean separation of concerns for maintainability

## 📁 Directory Structure

The project is organized into distinct backend and frontend components:

```
crazy8s-game/
├── backend/                 # Node.js/Express server
│   ├── src/
│   │   ├── models/         # Game logic and data structures
│   │   │   ├── game.js     # Main game engine
│   │   │   ├── cardPlayLogic.js # Advanced validation system
│   │   │   ├── Card.js     # Card entity with special effects
│   │   │   ├── Deck.js     # Deck management
│   │   │   └── Player.js   # Player entity
│   │   ├── controllers/    # API request handlers
│   │   ├── routes/         # Express route definitions
│   │   ├── utils/          # Utility functions
│   │   ├── app.js         # Express application setup
│   │   └── server.js      # Socket.IO server with real-time logic
│   ├── tests/             # Comprehensive test suites
│   │   ├── game.test.js   # Core game logic tests (150+ tests)
│   │   ├── cardPlayLogic.test.js # Validation tests (200+ tests)
│   │   └── crazy8.test.js # Integration tests
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   └── App.js      # Main application (2000+ lines)
│   │   ├── styles/         # CSS styling
│   │   └── index.js        # React entry point
│   ├── public/
│   │   └── index.html      # HTML template
│   └── package.json
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14+ recommended)
- **npm** or **yarn**
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Installation Steps

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

5. **Start the frontend application** (in a new terminal)
   ```bash
   cd frontend
   npm start
   # App runs on http://localhost:3000
   ```

6. **Start playing**
   - Open your browser to `http://localhost:3000`
   - Enter your name and create or join a game
   - Wait for other players and start the game
   - Enjoy playing Crazy 8's!

## 🎯 How to Play

### Basic Rules
1. **Starting**: Each player receives 8 cards
2. **Objective**: Be the first to empty your hand
3. **Playing**: Match the top card by suit or rank
4. **Drawing**: Draw if you can't play
5. **Winning**: First to finish is "safe" and advances

### Special Cards
- **Jack (♠♥♦♣)**: Skip next player
- **Queen (♠♥♦♣)**: Reverse direction (skip in 2-player)
- **Ace (♠♥♦♣)**: Next player draws 4 cards
- **2 (♠♥♦♣)**: Next player draws 2 cards
- **8 (♠♥♦♣)**: Wild card - declare new suit

### Advanced Stacking
- **Same Rank**: Stack multiple cards of the same rank
- **Same Suit**: Stack cards of the same suit (with turn control rules)
- **Cross-Stacking**: Aces and 2s can cross-stack with matching suit
- **Counter Play**: Use Aces or 2s to counter draw effects

## 🔧 Development

### Backend Architecture
- **Express.js**: RESTful API endpoints
- **Socket.IO**: Real-time multiplayer communication
- **Advanced Game Engine**: Comprehensive rule implementation
- **Multi-stage Validation**: Sophisticated card play checking
- **In-memory Storage**: Fast game state management

### Frontend Architecture
- **React**: Modern functional components with hooks
- **Socket.IO Client**: Real-time server communication
- **Responsive Design**: Mobile-first approach
- **Local Storage**: Persistent user settings
- **Component-based UI**: Maintainable and scalable structure

### Testing
```bash
# Backend tests
cd backend
npm test                    # Run all tests
npm run test:coverage      # Generate coverage report
npm run test:watch         # Watch mode

# Frontend tests
cd frontend
npm test                   # Run React tests
```

### Key Test Suites
- **Core Game Logic**: 150+ tests covering all game mechanics
- **Card Validation**: 200+ tests for advanced stacking rules
- **Integration Tests**: End-to-end gameplay scenarios
- **Performance Tests**: Stress testing and optimization validation

## 🌟 Advanced Features

### Intelligent Card Management
- **Visual Selection**: Click cards to select for multi-card plays
- **Stacking Indicators**: Clear visual feedback for card order
- **Smart Organization**: Sort by rank, group by suit, or both
- **Experienced Mode**: Clean interface without visual hints

### Real-time Multiplayer
- **Instant Synchronization**: All players see updates immediately
- **Connection Management**: Automatic reconnection handling
- **Debug Information**: Comprehensive logging for troubleshooting
- **Chat System**: Live messaging with game action logs

### User Customization
- **Persistent Settings**: Preferences saved between sessions
- **Display Options**: Flexible card organization
- **Visual Modes**: Standard and experienced player interfaces
- **Responsive Design**: Optimized for all screen sizes

## 📊 Technical Specifications

### Performance Metrics
- **Test Coverage**: 95%+ code coverage
- **Response Time**: <50ms for card validation
- **Memory Usage**: Efficient in-memory game state
- **Concurrent Players**: Supports multiple simultaneous games

### Browser Support
- **Desktop**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Responsive**: Optimized for screens 320px to 2560px wide

### Network Requirements
- **Latency**: <100ms recommended for optimal experience
- **Bandwidth**: Minimal data usage (primarily text-based communication)
- **Connection**: Stable WebSocket connection for real-time features

## 🚧 Development Roadmap

### Completed Features ✅
- [x] Complete game rule implementation
- [x] Advanced card stacking system
- [x] Real-time multiplayer communication
- [x] Comprehensive test coverage
- [x] Responsive user interface
- [x] User settings and customization
- [x] Chat system with game logging
- [x] Debug tools and logging

### In Progress 🔄
- [ ] Tournament bracket visualization
- [ ] Enhanced reconnection logic
- [ ] Performance optimizations
- [ ] Mobile app considerations

### Planned Features 📋
- [ ] User account system
- [ ] Game statistics and leaderboards
- [ ] Spectator mode
- [ ] AI opponents for single-player
- [ ] Custom game rules and variants
- [ ] Replay system for game analysis
- [ ] Progressive Web App features
- [ ] Database persistence

## 🤝 Contributing

We welcome contributions from developers of all skill levels!

### Getting Started
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes with comprehensive tests
4. **Test** thoroughly across different scenarios
5. **Commit** your changes (`git commit -m 'Add amazing feature'`)
6. **Push** to your branch (`git push origin feature/amazing-feature`)
7. **Open** a Pull Request with detailed description

### Development Guidelines
- **Code Style**: Follow existing patterns and conventions
- **Testing**: Add tests for all new features and bug fixes
- **Documentation**: Update README files and code comments
- **Multiplayer Testing**: Test with multiple players/browsers
- **Performance**: Consider impact on game performance

### Areas for Contribution
- **Bug Fixes**: Check GitHub issues for reported bugs
- **Feature Development**: Implement planned features
- **Testing**: Expand test coverage and edge cases
- **Documentation**: Improve guides and API documentation
- **Performance**: Optimize algorithms and reduce memory usage

## 📝 License

This project is licensed under the **MIT License**.

## 🙏 Acknowledgments

- **Classic Crazy 8's**: Traditional card game rules and mechanics
- **Socket.IO**: Excellent real-time communication framework
- **React Community**: Outstanding documentation and ecosystem
- **Jest Testing Framework**: Comprehensive testing capabilities
- **Open Source Community**: Inspiration and best practices
- **Beta Testers**: Valuable feedback and bug reports

## 📞 Support & Contact

### Getting Help
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check README files in backend/ and frontend/
- **Test Examples**: Review test files for implementation details
- **Code Comments**: Detailed inline documentation

### Common Issues
- **Connection Problems**: Check server URL and port configuration
- **Game State Issues**: Verify player IDs and turn synchronization
- **Performance Issues**: Monitor browser console for errors
- **Mobile Issues**: Test touch interactions and responsive layout
---

**Ready to play Crazy 8's?** 🎴✨

Start your engines, gather your friends, and enjoy this comprehensive implementation of the classic card game with modern multiplayer features!

![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/bryanygan/crazy8s?utm_source=oss&utm_medium=github&utm_campaign=bryanygan%2Fcrazy8s&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)
