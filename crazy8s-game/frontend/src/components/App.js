import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

// Card component
const Card = ({ card, onClick, isPlayable = false, isSelected = false }) => {
  const getCardColor = (suit) => {
    return suit === 'Hearts' || suit === 'Diamonds' ? '#e74c3c' : '#2c3e50';
  };

  const getCardSymbol = (suit) => {
    const symbols = {
      'Hearts': '♥',
      'Diamonds': '♦',
      'Clubs': '♣',
      'Spades': '♠'
    };
    return symbols[suit] || '';
  };

  return (
    <div 
      className={`card ${isPlayable ? 'playable' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        width: '60px',
        height: '90px',
        border: isPlayable ? '2px solid #27ae60' : '2px solid #bdc3c7',
        borderRadius: '8px',
        margin: '0 3px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        cursor: isPlayable ? 'pointer' : 'default',
        transform: isSelected ? 'translateY(-10px)' : 'none',
        transition: 'all 0.2s ease',
        fontSize: '10px',
        padding: '4px',
        color: getCardColor(card.suit),
        boxShadow: isSelected ? '0 4px 8px rgba(0,0,0,0.3)' : isPlayable ? '0 2px 6px rgba(39, 174, 96, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
        opacity: isPlayable ? 1 : 0.6
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '8px' }}>
        {card.rank}
      </div>
      <div style={{ fontSize: '16px' }}>
        {getCardSymbol(card.suit)}
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '8px', transform: 'rotate(180deg)' }}>
        {card.rank}
      </div>
    </div>
  );
};

// PlayerHand component
const PlayerHand = ({ cards, validCards = [], selectedCards = [], onCardSelect }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      margin: '20px 0',
      padding: '15px',
      backgroundColor: '#2ecc71',
      borderRadius: '15px',
      minHeight: '120px',
      alignItems: 'center',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        color: '#fff', 
        fontSize: '14px', 
        fontWeight: 'bold', 
        marginBottom: '10px',
        width: '100%',
        textAlign: 'center'
      }}>
        Your Hand ({cards.length} cards)
      </div>
      {cards.map((card, index) => {
        const isPlayable = validCards.some(vc => vc.suit === card.suit && vc.rank === card.rank);
        const isSelected = selectedCards.some(sc => sc.suit === card.suit && sc.rank === card.rank);
        
        return (
          <Card
            key={`${card.suit}-${card.rank}-${index}`}
            card={card}
            isPlayable={isPlayable}
            isSelected={isSelected}
            onClick={() => {
              if (isPlayable) {
                onCardSelect(card);
              }
            }}
          />
        );
      })}
      {cards.length === 0 && (
        <div style={{ color: '#fff', fontSize: '16px', fontStyle: 'italic' }}>
          No cards in hand
        </div>
      )}
    </div>
  );
};

// GameBoard component
const GameBoard = ({ gameState, onDrawCard, topCard, drawPileSize }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#27ae60',
      borderRadius: '20px',
      margin: '20px 0',
      minHeight: '200px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#fff', margin: '0 0 20px 0' }}>Game Board</h2>
      
      <div style={{
        display: 'flex',
        gap: '40px',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        {/* Draw Pile */}
        <div 
          onClick={onDrawCard}
          style={{
            width: '80px',
            height: '120px',
            backgroundColor: '#34495e',
            border: '3px solid #2c3e50',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <div style={{ color: '#fff', textAlign: 'center', fontSize: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>DRAW</div>
            <div>({drawPileSize})</div>
          </div>
        </div>

        {/* Arrow */}
        <div style={{ 
          color: '#fff', 
          fontWeight: 'bold', 
          fontSize: '24px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          →
        </div>

        {/* Discard Pile */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
            Top Card
          </div>
          {topCard ? (
            <Card card={topCard} />
          ) : (
            <div style={{
              width: '60px',
              height: '90px',
              border: '2px dashed #fff',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              Empty
            </div>
          )}
        </div>
      </div>

      {/* Game Status Indicators */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {gameState.declaredSuit && (
          <div style={{
            color: '#fff',
            backgroundColor: '#e74c3c',
            padding: '8px 15px',
            borderRadius: '15px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            🎯 Current Suit: {gameState.declaredSuit}
          </div>
        )}

        {gameState.drawStack > 0 && (
          <div style={{
            color: '#fff',
            backgroundColor: '#e67e22',
            padding: '8px 15px',
            borderRadius: '15px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            animation: 'pulse 2s infinite'
          }}>
            📚 Draw Stack: +{gameState.drawStack}
          </div>
        )}

        {gameState.direction === -1 && (
          <div style={{
            color: '#fff',
            backgroundColor: '#9b59b6',
            padding: '8px 15px',
            borderRadius: '15px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            🔄 Reversed
          </div>
        )}
      </div>
    </div>
  );
};

// SuitSelector component
const SuitSelector = ({ onSuitSelect, onCancel }) => {
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
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
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '15px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Choose a Suit for your 8</h3>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          {suits.map(suit => (
            <button
              key={suit}
              onClick={() => onSuitSelect(suit)}
              style={{
                width: '70px',
                height: '90px',
                fontSize: '24px',
                color: suitColors[suit],
                backgroundColor: '#fff',
                border: '2px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.backgroundColor = '#fff';
              }}
            >
              <div style={{ fontSize: '32px' }}>{suitSymbols[suit]}</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{suit}</div>
            </button>
          ))}
        </div>
        <button 
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            backgroundColor: '#95a5a6',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Toast notification component
const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#27ae60';
      case 'error': return '#e74c3c';
      case 'info': return '#3498db';
      default: return '#95a5a6';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      backgroundColor: getBackgroundColor(),
      color: '#fff',
      borderRadius: '8px',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      maxWidth: '300px',
      fontSize: '14px',
      cursor: 'pointer'
    }} onClick={onClose}>
      {message}
    </div>
  );
};

// Chat component
const Chat = ({ socket }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat message', (message) => {
      setMessages(prev => [...prev.slice(-50), message]); // Keep only last 50 messages
    });

    socket.on('cardPlayed', (data) => {
      setMessages(prev => [...prev.slice(-50), `🃏 ${data.playerName} played: ${data.cardsPlayed.join(', ')}`]);
    });

    socket.on('playerDrewCards', (data) => {
      setMessages(prev => [...prev.slice(-50), `📚 ${data.playerName} drew ${data.cardCount} card(s)`]);
    });

    return () => {
      socket.off('chat message');
      socket.off('cardPlayed');
      socket.off('playerDrewCards');
    };
  }, [socket]);

  const sendMessage = () => {
    if (input.trim() && socket) {
      socket.emit('chat message', input);
      setInput('');
    }
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '10px',
      height: isMinimized ? '40px' : '250px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      transition: 'height 0.3s ease'
    }}>
      <div 
        style={{
          padding: '10px',
          borderBottom: '1px solid #ddd',
          fontWeight: 'bold',
          backgroundColor: '#f8f9fa',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <span>💬 Game Chat</span>
        <span style={{ fontSize: '12px' }}>{isMinimized ? '▲' : '▼'}</span>
      </div>
      
      {!isMinimized && (
        <>
          <div style={{
            flex: 1,
            padding: '10px',
            overflowY: 'auto',
            fontSize: '12px',
            backgroundColor: '#fafafa'
          }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ 
                marginBottom: '4px',
                padding: '2px 0',
                borderBottom: '1px solid #eee'
              }}>
                {msg}
              </div>
            ))}
            {messages.length === 0 && (
              <div style={{ color: '#999', fontStyle: 'italic' }}>
                No messages yet...
              </div>
            )}
          </div>
          <div style={{ padding: '10px', borderTop: '1px solid #ddd' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
              <button 
                onClick={sendMessage}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Main App component
const App = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [playerHand, setPlayerHand] = useState([]);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [validCards, setValidCards] = useState([]);
  const [toast, setToast] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    setPlayerId(newSocket.id);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Connected to server with ID:', newSocket.id);
      setPlayerId(newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from server');
    });

    newSocket.on('gameUpdate', (data) => {
      console.log('🎮 Game state updated:', data);
      console.log('  📊 Current Player:', data.currentPlayer, '(ID:', data.currentPlayerId, ')');
      console.log('  🆔 My Player ID:', newSocket.id);
      console.log('  🎯 Is My Turn:', data.currentPlayerId === newSocket.id);
      setGameState(data);
    });

    newSocket.on('handUpdate', (hand) => {
      console.log('🃏 Hand updated:', hand.length, 'cards');
      setPlayerHand(hand);
    });

    newSocket.on('error', (errorMsg) => {
      console.log('❌ Error:', errorMsg);
      setToast({ message: errorMsg, type: 'error' });
    });

    newSocket.on('success', (successMsg) => {
      console.log('✅ Success:', successMsg);
      setToast({ message: successMsg, type: 'success' });
    });

    newSocket.on('cardPlayed', (data) => {
      console.log('🃏 Card played:', data);
      setToast({ message: `${data.playerName} played: ${data.cardsPlayed.join(', ')}`, type: 'info' });
    });

    newSocket.on('playerDrewCards', (data) => {
      console.log('📚 Player drew cards:', data);
      setToast({ message: `${data.playerName} drew ${data.cardCount} card(s)`, type: 'info' });
    });

    return () => newSocket.close();
  }, []);

  const parseTopCard = (cardString) => {
    if (!cardString) return null;
    const parts = cardString.split(' of ');
    if (parts.length !== 2) return null;
    return { rank: parts[0], suit: parts[1] };
  };

  const canCounterDraw = (card, topCard) => {
    if (topCard.rank === 'Ace') {
      return card.rank === 'Ace' || (card.rank === '2' && card.suit === topCard.suit);
    }
    if (topCard.rank === '2') {
      return card.rank === '2' || (card.rank === 'Ace' && card.suit === topCard.suit);
    }
    return false;
  };

  // Update valid cards when playerHand or gameState changes
  useEffect(() => {
    if (gameState && playerHand.length > 0) {
      const topCard = parseTopCard(gameState.topCard);
      if (!topCard) return;

      const valid = playerHand.filter(card => {
        if (card.rank === '8') return true;
        
        if (gameState.drawStack > 0) {
          return canCounterDraw(card, topCard);
        }
        
        const suitToMatch = gameState.declaredSuit || topCard.suit;
        return card.suit === suitToMatch || card.rank === topCard.rank;
      });
      
      console.log('🎯 Valid cards calculated:', valid.length, 'out of', playerHand.length);
      setValidCards(valid);
    } else {
      setValidCards([]);
    }
  }, [playerHand, gameState]);

  const startGame = () => {
    console.log('🚀 Starting game:', gameState?.gameId);
    socket.emit('startGame', {
      gameId: gameState?.gameId
    });
  };

  const joinGame = () => {
    if (!playerName.trim() || !gameId.trim()) {
      setToast({ message: 'Please enter both name and game ID', type: 'error' });
      return;
    }

    console.log('🚪 Joining game:', gameId, 'as', playerName);
    socket.emit('joinGame', {
      gameId: gameId.trim(),
      playerName: playerName.trim()
    });
  };

  const createGame = () => {
    if (!playerName.trim()) {
      setToast({ message: 'Please enter your name', type: 'error' });
      return;
    }

    console.log('🎮 Creating game as:', playerName);
    socket.emit('createGame', {
      playerName: playerName.trim()
    });
  };

  const handleCardSelect = (card) => {
    const isSelected = selectedCards.some(sc => sc.suit === card.suit && sc.rank === card.rank);
    
    if (isSelected) {
      // If the card is already selected, deselect it
      setSelectedCards(prev => prev.filter(sc => !(sc.suit === card.suit && sc.rank === card.rank)));
    } else {
      if (selectedCards.length === 0) {
        // No cards selected, select this card
        setSelectedCards([card]);
      } else {
        const firstCard = selectedCards[0];
        
        // Check if we're trying to stack (same rank)
        if (firstCard.rank === card.rank) {
          // Stacking logic - add to existing selection
          if (firstCard.rank === 'Ace' || firstCard.rank === '2') {
            if (firstCard.suit === card.suit) {
              setSelectedCards(prev => [...prev, card]);
            } else {
              setToast({ message: 'Aces and 2s can only be stacked with the same suit', type: 'error' });
            }
          } else {
            setSelectedCards(prev => [...prev, card]);
          }
        } else {
          // Different rank - check if we should replace or show error
          if (selectedCards.length === 1) {
            // Only one card selected and different rank - replace it
            setSelectedCards([card]);
          } else {
            // Multiple cards selected (stacking in progress) - can't switch
            setToast({ message: 'Cannot switch cards while stacking. Clear selection first.', type: 'error' });
          }
        }
      }
    }
  };

  const playSelectedCards = () => {
    if (selectedCards.length === 0) {
      setToast({ message: 'Please select at least one card', type: 'error' });
      return;
    }

    const hasWild = selectedCards.some(card => card.rank === '8');
    
    if (hasWild) {
      if (selectedCards.length > 1) {
        setToast({ message: 'Cannot stack 8s with other cards', type: 'error' });
        return;
      }
      setShowSuitSelector(true);
    } else {
      console.log('🃏 Playing cards:', selectedCards);
      socket.emit('playCard', {
        gameId: gameState?.gameId,
        cards: selectedCards
      });
      setSelectedCards([]);
    }
  };

  const handleSuitSelect = (suit) => {
    console.log('🃏 Playing wild card with suit:', suit);
    socket.emit('playCard', {
      gameId: gameState?.gameId,
      cards: selectedCards,
      declaredSuit: suit
    });
    setSelectedCards([]);
    setShowSuitSelector(false);
  };

  const drawCard = () => {
    console.log('📚 Drawing card');
    socket.emit('drawCard', {
      gameId: gameState?.gameId
    });
  };

  if (!isConnected) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: '#ecf0f1',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#2c3e50' }}>🔌 Connecting to server...</h2>
          <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
            Please wait while we establish connection...
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div style={{ 
        padding: '20px', 
        maxWidth: '400px', 
        margin: '50px auto',
        backgroundColor: '#ecf0f1',
        minHeight: '100vh'
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          padding: '30px'
        }}>
          <h1 style={{ textAlign: 'center', color: '#2c3e50', margin: '0 0 30px 0' }}>
            🎴 Crazy 8's Game
          </h1>
          
          {/* Debug Info */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '12px',
            color: '#6c757d'
          }}>
            🆔 Your Socket ID: {playerId}
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
              Your Name:
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your name"
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
              Game ID (to join existing game):
            </label>
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter game ID"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={createGame}
              style={{
                flex: 1,
                padding: '15px',
                backgroundColor: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#229954'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
            >
              🎮 Create Game
            </button>
            <button
              onClick={joinGame}
              style={{
                flex: 1,
                padding: '15px',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              🚪 Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const topCard = parseTopCard(gameState.topCard);
  const isMyTurn = gameState.currentPlayerId === playerId;

  // Debug logging for turn detection
  console.log('🔍 Turn Check:');
  console.log('  - Game Current Player ID:', gameState.currentPlayerId);
  console.log('  - My Player ID:', playerId);
  console.log('  - Is My Turn:', isMyTurn);

  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#ecf0f1',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', margin: '0 0 20px 0' }}>
        🎴 Crazy 8's Game
      </h1>

      {/* Debug Info */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '15px',
        fontSize: '12px',
        color: '#6c757d',
        textAlign: 'center'
      }}>
        🆔 My ID: {playerId} | Current Player ID: {gameState.currentPlayerId} | Is My Turn: {isMyTurn ? 'YES' : 'NO'}
      </div>

      {/* Game Info */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <strong>Round:</strong> {gameState.roundNumber}
          </div>
          <div style={{ color: isMyTurn ? '#e74c3c' : '#2c3e50', fontWeight: isMyTurn ? 'bold' : 'normal' }}>
            <strong>Current Player:</strong> {gameState.currentPlayer}
          </div>
          <div>
            <strong>Game ID:</strong> 
            <span style={{ 
              fontFamily: 'monospace', 
              backgroundColor: '#f8f9fa', 
              padding: '2px 6px', 
              borderRadius: '4px',
              marginLeft: '5px'
            }}>
              {gameState.gameId}
            </span>
          </div>
        </div>
        
        {/* Start Game Button */}
        {gameState.gameState === 'waiting' && gameState.players.length >= 2 && (
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={startGame}
              style={{
                padding: '12px 25px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              🚀 Start Game ({gameState.players.length} players)
            </button>
          </div>
        )}
        
        {isMyTurn && gameState.gameState === 'playing' && (
          <div style={{
            marginTop: '15px',
            padding: '8px 20px',
            backgroundColor: '#2ecc71',
            color: '#fff',
            borderRadius: '20px',
            display: 'inline-block',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            animation: 'pulse 2s infinite'
          }}>
            🎯 It's your turn!
          </div>
        )}
      </div>

      {/* Players */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {gameState.players.map((player, index) => (
          <div
            key={index}
            style={{
              padding: '12px 18px',
              backgroundColor: player.isCurrentPlayer ? '#3498db' : '#95a5a6',
              color: '#fff',
              borderRadius: '25px',
              fontWeight: 'bold',
              textAlign: 'center',
              minWidth: '140px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transform: player.isCurrentPlayer ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
          >
            <div style={{ fontSize: '14px' }}>
              {player.name}
              {!player.isConnected && ' 🔴'}
              {player.id === playerId && ' (YOU)'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
              {player.handSize} cards
              {player.isSafe && ' ✅'}
              {player.isEliminated && ' ❌'}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>
              ID: {player.id?.slice(-4)}
            </div>
          </div>
        ))}
      </div>

      {/* Game Board */}
      <GameBoard 
        gameState={gameState}
        onDrawCard={drawCard}
        topCard={topCard}
        drawPileSize={gameState.drawPileSize}
      />

      {/* Controls */}
      {isMyTurn && gameState.gameState === 'playing' && (
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <button
              onClick={playSelectedCards}
              disabled={selectedCards.length === 0}
              style={{
                padding: '12px 25px',
                backgroundColor: selectedCards.length > 0 ? '#27ae60' : '#bdc3c7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: selectedCards.length > 0 ? 'pointer' : 'not-allowed',
                marginRight: '15px',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: selectedCards.length > 0 ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🎴 Play {selectedCards.length} Card{selectedCards.length !== 1 ? 's' : ''}
            </button>
            <button
              onClick={drawCard}
              style={{
                padding: '12px 25px',
                backgroundColor: '#e67e22',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              📚 Draw Card
            </button>
          </div>
          
          {selectedCards.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                Selected: {selectedCards.map(c => `${c.rank} of ${c.suit}`).join(', ')}
              </div>
              <button
                onClick={() => setSelectedCards([])}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ❌ Clear
              </button>
            </div>
          )}
          
          {validCards.length === 0 && gameState.drawStack === 0 && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#f39c12',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              ⚠️ No valid cards to play - you must draw a card
            </div>
          )}
          
          {gameState.drawStack > 0 && validCards.length === 0 && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#e74c3c',
              color: '#fff',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              🚨 You must draw {gameState.drawStack} cards or play a counter card
            </div>
          )}
        </div>
      )}

      {!isMyTurn && gameState.gameState === 'playing' && (
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ color: '#7f8c8d', fontSize: '16px' }}>
            ⏳ Waiting for {gameState.currentPlayer} to play...
          </div>
          <div style={{ color: '#95a5a6', fontSize: '12px', marginTop: '5px' }}>
            Current Player ID: {gameState.currentPlayerId} | Your ID: {playerId}
          </div>
        </div>
      )}

      {/* Player Hand */}
      <PlayerHand
        cards={playerHand}
        validCards={validCards}
        selectedCards={selectedCards}
        onCardSelect={handleCardSelect}
      />

      {/* Game Over */}
      {gameState.gameState === 'finished' && (
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>🎉 Game Over!</h2>
          <div style={{ fontSize: '18px', color: '#27ae60', fontWeight: 'bold' }}>
            Winner: {gameState.players.find(p => !p.isEliminated)?.name || 'Unknown'}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '12px 25px',
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🔄 Play Again
          </button>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Suit Selector Modal */}
      {showSuitSelector && (
        <SuitSelector
          onSuitSelect={handleSuitSelect}
          onCancel={() => {
            setShowSuitSelector(false);
            setSelectedCards([]);
          }}
        />
      )}

      {/* Chat */}
      <div style={{ 
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '320px'
      }}>
        <Chat socket={socket} />
      </div>

      {/* Add some CSS animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .card:hover {
          transform: translateY(-2px);
        }
        
        .card.playable:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4);
        }
        
        .card.selected {
          transform: translateY(-10px);
          box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
        }
      `}</style>
    </div>
  );
};

export default App;