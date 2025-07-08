# Crazy 8's Game Frontend

## Overview
This is the frontend for the Crazy 8's game, built using React with modern hooks and state management. It provides a comprehensive, responsive user interface with **advanced card stacking visualization** that connects to the backend server via Socket.IO for real-time multiplayer gameplay featuring sophisticated sequential stacking mechanics.

## Architecture Overview

### Technology Stack
- **React 17+**: Modern functional components with hooks
- **Socket.IO Client**: Real-time server communication with stacking validation
- **CSS3**: Custom responsive styling with advanced card animations
- **localStorage**: User settings persistence
- **Modern ES6+**: Clean, maintainable JavaScript with complex state management

### Key Features
- **Real-time Multiplayer**: Instant game state synchronization with stacking feedback
- **Advanced Card Stacking Interface**: Visual selection system for complex sequential stacks
- **Turn Control Visualization**: Real-time feedback on turn control logic
- **Responsive Design**: Mobile-first approach with desktop optimization
- **User Customization**: Persistent settings and preferences
- **Rich UI/UX**: Advanced animations, notifications, and visual stacking feedback
- **Comprehensive Stacking Controls**: Full sequential stacking functionality through intuitive interface
- **Confetti Celebrations**: Animated celebrations for player safety and game wins
- **Play Again Voting**: Interactive voting system for game continuation
- **Tournament Progress**: Real-time tournament status and round management displays
- **Player Safety Notifications**: Visual feedback for tournament advancement

## Project Structure
```
frontend/
├── public/
│   └── index.html           # Main HTML template
├── src/
│   ├── index.js            # React entry point
│   ├── components/         # React components
│   │   ├── App.js          # Main application component (2500+ lines)
│   │   │                   # - Advanced stacking UI components
│   │   │                   # - Turn control validation logic  
│   │   │                   # - Real-time stacking feedback
│   │   ├── GameBoard.js    # Legacy component (minimal)
│   │   ├── PlayerHand.js   # Legacy component (minimal)
│   │   └── Chat.js         # Legacy component (minimal)
│   └── styles/
│       └── main.css        # Base styles (most styling is inline)
├── package.json            # Dependencies and scripts
└── README.md
```

**Note**: The main application logic is consolidated in `App.js` for better state management and real-time stacking synchronization.

## Key Components

### Main App Component (`App.js`)
The central component containing all game functionality with advanced stacking features:

#### Sub-Components
- **Card**: Individual card rendering with stacking selection effects
- **PlayerHand**: Hand management with sophisticated sorting and stacking visualization
- **GameBoard**: Game state display with turn control indicators
- **SuitSelector**: Modal for wild card suit selection
- **Settings**: Configuration modal with stacking preferences
- **Toast**: Notification system for stacking validation feedback
- **Chat**: Real-time messaging system
- **ConfettiCanvas**: Celebration animations for victories and player safety
- **PlayAgainModal**: Voting interface for game continuation
- **TournamentStatus**: Tournament progress and round information display

#### Enhanced State Management
```javascript
// Core game state with stacking
const [gameState, setGameState] = useState(null);
const [playerHand, setPlayerHand] = useState([]);
const [selectedCards, setSelectedCards] = useState([]); // Advanced stacking selection
const [validCards, setValidCards] = useState([]);

// Advanced stacking UI state
const [stackingOrder, setStackingOrder] = useState([]);
const [turnControlFeedback, setTurnControlFeedback] = useState(null);

// Enhanced user preferences
const [settings, setSettings] = useState({
  sortByRank: false,
  groupBySuit: false,
  experiencedMode: false,
  showStackingDebug: false // Debug mode for stacking validation
});
```

## Advanced Card Stacking Interface

### Visual Card Selection System

#### Enhanced Selection States
- **Playable Cards**: Green border with hover effects
- **Selected Cards**: Blue highlighting with elevation and stacking order numbers
- **Stacking Order**: Numbered indicators (1, 2, 3...) for multi-card sequences
- **Bottom Card Indicator**: Red badge marking the foundation of the stack
- **Turn Control Feedback**: Real-time validation with color-coded feedback

#### Stacking Selection Logic
```javascript
const handleCardSelect = (card) => {
  const isSelected = selectedCards.some(sc => 
    sc.suit === card.suit && sc.rank === card.rank
  );
  
  if (isSelected) {
    // Handle deselection or reordering for complex stacks
    handleCardDeselection(card);
  } else {
    if (selectedCards.length === 0) {
      // First card - becomes bottom card of stack
      setSelectedCards([card]);
    } else {
      // Check if this card can be stacked using frontend validation
      const activePlayers = gameState?.players?.length || 2;
      
      if (canStackCardsFrontend(selectedCards, card, activePlayers)) {
        setSelectedCards(prev => [...prev, card]);
        // Show success feedback for valid stacking
        showStackingFeedback('Valid stack!', 'success');
      } else {
        // Show detailed error message from validation
        const validation = validateCardStackFrontend([...selectedCards, card], activePlayers);
        showStackingFeedback(validation.error, 'error');
      }
    }
  }
};
```

### Advanced Card Organization

#### Smart Sorting with Stacking Support
```javascript
// Enhanced card organization for stacking
const organizeCards = () => {
  let organizedCards = [...cards];

  if (settings.sortByRank) {
    organizedCards.sort((a, b) => {
      const rankA = getRankValue(a.rank);
      const rankB = getRankValue(b.rank);
      if (rankA !== rankB) return rankA - rankB;
      return getSuitValue(a.suit) - getSuitValue(b.suit);
    });
  }

  if (settings.groupBySuit) {
    organizedCards.sort((a, b) => {
      const suitA = getSuitValue(a.suit);
      const suitB = getSuitValue(b.suit);
      if (suitA !== suitB) return suitA - suitB;
      if (settings.sortByRank) {
        return getRankValue(a.rank) - getRankValue(b.rank);
      }
      return 0;
    });
  }

  return organizedCards;
};
```

#### Visual Grouping for Stacking
```javascript
// Group cards by suit with visual separators for stacking
const getCardGroups = () => {
  if (!settings.groupBySuit) {
    return [{ suit: null, cards: organizedCards }];
  }

  const groups = [];
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  
  suits.forEach(suit => {
    const suitCards = organizedCards.filter(card => card.suit === suit);
    if (suitCards.length > 0) {
      groups.push({ suit, cards: suitCards });
    }
  });

  return groups;
};
```

## Frontend Stacking Validation

### Real-time Validation System

#### Turn Control Simulation (Frontend)
```javascript
const simulateTurnControlFrontend = (cardStack, activePlayers = 2) => {
  if (cardStack.length === 0) return true;

  const playerCount = activePlayers;
  
  // Pure Jack stack special case
  const isPureJackStack = cardStack.every(card => card.rank === 'Jack');
  if (isPureJackStack && playerCount === 2) {
    return true;
  }
  
  // Check what the stack ends with
  const lastCard = cardStack[cardStack.length - 1];
  const normalCardRanks = ['3', '4', '5', '6', '7', '9', '10', 'King'];
  const drawCardRanks = ['2', 'Ace'];
  const wildCardRanks = ['8'];
  
  // If stack ends with turn-passing cards, turn passes
  if (normalCardRanks.includes(lastCard.rank) || 
      drawCardRanks.includes(lastCard.rank) || 
      wildCardRanks.includes(lastCard.rank)) {
    return false;
  }
  
  // Complex Queen counting logic
  let queenCount = 0;
  for (const card of cardStack) {
    if (card.rank === 'Queen') queenCount++;
  }
  
  if (playerCount === 2 && queenCount > 0) {
    return (queenCount % 2 === 0); // Even = keep turn, odd = pass turn
  }
  
  // Default to keeping turn for Jack-ending stacks
  return true;
};
```

#### Enhanced Stack Validation
```javascript
const validateCardStackFrontend = (cards, activePlayers = 2) => {
  if (cards.length <= 1) return { isValid: true };

  console.log('🔍 Frontend: Validating stack:', cards.map(c => `${c.rank} of ${c.suit}`));

  for (let i = 1; i < cards.length; i++) {
    const prevCard = cards[i - 1];
    const currentCard = cards[i];
    
    const matchesSuit = prevCard.suit === currentCard.suit;
    const matchesRank = prevCard.rank === currentCard.rank;
    const isAce2Cross = (
      (prevCard.rank === 'Ace' && currentCard.rank === '2') ||
      (prevCard.rank === '2' && currentCard.rank === 'Ace')
    ) && prevCard.suit === currentCard.suit;
    
    if (!matchesSuit && !matchesRank && !isAce2Cross) {
      return {
        isValid: false,
        error: `Cannot stack ${currentCard.rank} of ${currentCard.suit} after ${prevCard.rank} of ${prevCard.suit}. Cards must match suit or rank.`
      };
    }
    
    // Same rank always allowed
    if (matchesRank || isAce2Cross) continue;
    
    // Same suit requires turn control validation
    if (matchesSuit && !matchesRank) {
      const stackUpToPrevious = cards.slice(0, i);
      const wouldHaveTurnControl = simulateTurnControlFrontend(stackUpToPrevious, activePlayers);
      
      if (!wouldHaveTurnControl) {
        return {
          isValid: false,
          error: `Cannot stack ${currentCard.rank} of ${currentCard.suit} after ${prevCard.rank} of ${prevCard.suit}. You don't maintain turn control after playing the previous cards in the sequence.`
        };
      }
    }
  }
  
  return { isValid: true };
};
```

### Enhanced Valid Card Detection

```javascript
const getValidCardsForSelection = (playerHand, gameState, selectedCards, topCard) => {
  if (!gameState || playerHand.length === 0) return [];
  
  let valid = [];
  const activePlayers = gameState.players?.length || 2;

  if (selectedCards.length === 0) {
    // No cards selected - show cards that can be played as bottom card
    valid = playerHand.filter(card => {
      if (gameState.drawStack > 0) {
        return canCounterDrawFrontend(card, topCard);
      }
      
      if (card.rank === '8') return true;
      
      const suitToMatch = gameState.declaredSuit || topCard.suit;
      return card.suit === suitToMatch || card.rank === topCard.rank;
    });
  } else {
    // Cards already selected - show stackable cards with advanced validation
    valid = playerHand.filter(card => {
      const isSelected = selectedCards.some(sc => sc.suit === card.suit && sc.rank === card.rank);
      if (isSelected) return true;
      
      return canStackCardsFrontend(selectedCards, card, activePlayers);
    });
  }
  
  console.log('🎯 Frontend: Valid cards calculated:', valid.length, 'out of', playerHand.length);
  console.log('🎯 Frontend: Selected cards:', selectedCards.length);
  
  return valid;
};
```

## Enhanced User Experience Features

### Victory Celebrations
- **Confetti Animations**: Canvas-based confetti system for celebrating wins
- **Player Safety Celebrations**: Special animations when players advance to next round
- **Tournament Winner Effects**: Enhanced celebrations for tournament victors

### Play Again System
- **Interactive Voting Modal**: Players can vote to continue playing
- **Real-time Vote Tracking**: Live updates of player votes
- **Validation Integration**: Ensures proper game conditions before starting new rounds

### Tournament Interface
- **Progress Indicators**: Visual display of tournament advancement
- **Round Status Display**: Current round and elimination information
- **Player Safety Notifications**: Clear indicators for safe players
- **End-of-Round Modals**: Comprehensive round results and next steps

## Advanced User Interface Features

### Card Visual Effects

#### Stacking Animation System
```css
/* Enhanced card selection with stacking order */
.card {
  transform-origin: center center;
  will-change: transform, box-shadow;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card.selected {
  transform: translateY(-15px) scale(1.05);
  box-shadow: 0 8px 20px rgba(52, 152, 219, 0.4);
  z-index: 15;
}

.card.playable:hover {
  transform: translateY(-8px) scale(1.03);
  box-shadow: 0 6px 16px rgba(39, 174, 96, 0.4);
}

/* Stacking order indicators */
.card-order-badge {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  background: #3498db;
  color: white;
  padding: 1px 5px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
  z-index: 20;
}

/* Bottom card indicator for stacks */
.bottom-card-badge {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: #e74c3c;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 8px;
  font-weight: bold;
}
```

### Enhanced Settings System

#### Stacking-Specific Settings
```javascript
const advancedSettings = {
  // Card display
  sortByRank: boolean,
  groupBySuit: boolean,
  experiencedMode: boolean,
  
  // Stacking preferences  
  showStackingDebug: boolean,      // Show detailed stacking logs
  highlightValidStacks: boolean,   // Highlight stackable cards
  showTurnControlHints: boolean,   // Show turn control feedback
  
  // Timer system
  enableTimer: boolean,
  timerDuration: number,
  timerWarningTime: number
};
```

#### Settings Modal with Stacking Options
```javascript
<div style={{ marginBottom: '25px' }}>
  <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>🃏 Advanced Stacking</h3>
  
  <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Show Stacking Debug</div>
    <div style={{ fontSize: '12px', color: '#6c757d' }}>
      Display detailed turn control validation in console (for advanced players)
    </div>
  </div>
  
  <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Highlight Valid Stacks</div>
    <div style={{ fontSize: '12px', color: '#6c757d' }}>
      Show green borders on cards that can be stacked with current selection
    </div>
  </div>
</div>
```

### Real-time Stacking Feedback

#### Toast Notification System for Stacking
```javascript
const showStackingFeedback = (message, type) => {
  const toastId = Date.now() + Math.random();
  const newToast = {
    id: toastId,
    message,
    type, // 'success', 'error', 'info'
    timestamp: Date.now()
  };
  
  setToasts(prevToasts => [newToast, ...prevToasts.slice(0, 2)]);
};

// Example usage for stacking validation
if (canStackCardsFrontend(selectedCards, card, activePlayers)) {
  showStackingFeedback(`✅ Valid stack: ${card.rank} of ${card.suit}`, 'success');
} else {
  showStackingFeedback(`❌ Invalid stack: Turn control lost`, 'error');
}
```

#### Enhanced Game Controls

```javascript
const playSelectedCards = () => {
  if (selectedCards.length === 0) {
    showStackingFeedback('Please select at least one card', 'error');
    return;
  }

  // Frontend validation before sending to server
  const activePlayers = gameState?.players?.length || 2;
  const validation = validateCardStackFrontend(selectedCards, activePlayers);
  
  if (!validation.isValid) {
    showStackingFeedback(validation.error, 'error');
    return;
  }

  const hasWild = selectedCards.some(card => card.rank === '8');
  
  if (hasWild) {
    // Check for valid 8 combinations
    const non8Cards = selectedCards.filter(card => card.rank !== '8');
    if (non8Cards.length > 0) {
      const allSameSuit = selectedCards.every(card => card.suit === selectedCards[0].suit);
      if (!allSameSuit) {
        showStackingFeedback('When playing 8s with other cards, all must be the same suit', 'error');
        return;
      }
    }
    setShowSuitSelector(true);
  } else {
    // Send validated stack to server
    socket.emit('playCard', {
      gameId: gameState?.gameId,
      cards: selectedCards,
      timerSettings: {
        enableTimer: settings.enableTimer,
        timerDuration: settings.timerDuration,
        timerWarningTime: settings.timerWarningTime
      }
    });
    
    setSelectedCards([]);
    showStackingFeedback(`Played ${selectedCards.length} card stack`, 'success');
  }
};
```

## Setup Instructions

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd crazy8s-game/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development
```bash
# Start development server (with hot reload)
npm start
# Application runs on http://localhost:3000

# Build for production
npm run build

# Run tests
npm test
```

## Advanced Stacking User Experience

### Card Selection Flow

1. **Initial Selection**: Click any valid card to start a stack
2. **Stack Building**: Additional cards show as green (valid) or grayed out (invalid)
3. **Visual Feedback**: Numbers show stacking order, colors indicate validity
4. **Validation**: Real-time feedback prevents invalid combinations
5. **Execution**: "Play Cards" button sends validated stack to server

### Stacking Visual Indicators

#### Card States
- **🟢 Green Border**: Can be played as bottom card or stacked
- **🔵 Blue Highlight**: Currently selected in stack
- **🔴 Red Badge**: Bottom card of stack (foundation)
- **🟦 Blue Badge**: Stacking order number (1, 2, 3...)
- **⚫ Grayed Out**: Cannot be played (unless experienced mode)

#### Turn Control Feedback
```javascript
// Real-time turn control hints
const getTurnControlHint = (selectedCards) => {
  if (selectedCards.length === 0) return null;
  
  const wouldKeepTurn = simulateTurnControlFrontend(selectedCards, activePlayers);
  return {
    message: wouldKeepTurn ? 'Will keep turn' : 'Will pass turn',
    color: wouldKeepTurn ? '#27ae60' : '#e74c3c'
  };
};
```

### Mobile Stacking Interface

#### Touch-Optimized Controls
- **Large touch targets** for precise card selection
- **Haptic feedback** for valid/invalid stacking attempts  
- **Swipe gestures** for card reordering in stacks
- **Pinch-to-zoom** for detailed card examination

#### Responsive Stacking Layout
```css
/* Mobile-optimized card stacking */
@media (max-width: 768px) {
  .player-hand {
    padding: 10px 5px 15px 5px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  .card {
    min-width: 45px;
    max-width: 50px;
    height: 70px;
    margin: 2px;
  }
  
  .card-order-badge {
    top: -15px;
    font-size: 8px;
    padding: 1px 4px;
  }
}
```

## Performance Optimizations

### Stacking-Specific Optimizations
- **Memoized Validation**: Cache turn control results for repeated calculations
- **Debounced Selection**: Prevent rapid-fire selection causing lag
- **Virtual Scrolling**: Handle large hands efficiently
- **Optimized Re-renders**: Minimize updates during stacking selection

### Memory Management
```javascript
// Efficient selectedCards state management
const handleCardDeselection = useCallback((card) => {
  setSelectedCards(prev => prev.filter(sc => 
    !(sc.suit === card.suit && sc.rank === card.rank)
  ));
}, []);

// Memoized valid cards calculation
const validCards = useMemo(() => {
  return getValidCardsForSelection(playerHand, gameState, selectedCards, topCard);
}, [playerHand, gameState, selectedCards, topCard]);
```

## Debug Tools for Stacking

### Console Debugging
```javascript
// Enable detailed stacking logs
if (settings.showStackingDebug) {
  console.log('🎯 Stacking Debug:', {
    selectedCards: selectedCards.map(c => `${c.rank}${c.suit[0]}`),
    validCards: validCards.length,
    turnControl: simulateTurnControlFrontend(selectedCards, activePlayers),
    gameState: gameState?.currentPlayer
  });
}
```

### Visual Debug Mode
- **Card IDs**: Show internal card identifiers
- **Validation Steps**: Display step-by-step validation process
- **Turn Control**: Show detailed turn control simulation
- **State Inspection**: Real-time game state monitoring

## Future Frontend Enhancements

### Planned Stacking Features
- **Drag-and-Drop Stacking**: Intuitive card reordering
- **Animation Improvements**: Smooth stacking transitions
- **Advanced Tutorials**: Interactive stacking guide
- **Accessibility**: Screen reader support for stacking
- **Performance**: Further optimization for complex stacks

### UI/UX Improvements
- **Stack Preview**: Show final stack before playing
- **Undo/Redo**: Stack building history
- **Quick Actions**: Preset stacking combinations
- **Visual Effects**: Enhanced card animations

## License
MIT License - see main project README for details.