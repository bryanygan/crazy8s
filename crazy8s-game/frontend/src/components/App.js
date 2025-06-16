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
        border: '2px solid #333',
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
        boxShadow: isSelected ? '0 4px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
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
const PlayerHand = ({ cards, onCardPlay, validCards = [], selectedCards = [], onCardSelect }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      margin: '20px 0',
      padding: '10px',
      backgroundColor: '#2ecc71',
      borderRadius: '15px',
      minHeight: '110px',
      alignItems: 'center'
    }}>
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
    </div>
  );
};

// GameBoard component
const GameBoard = ({ gameState, onDrawCard, onPlayCards, topCard, drawPileSize }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#27ae60',
      borderRadius: '20px',
      margin: '20px 0',
      minHeight: '200px'
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
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ color: '#fff', textAlign: 'center', fontSize: '12px' }}>
            <div>DRAW</div>
            <div>({drawPileSize})</div>
          </div>
        </div>

        {/* Discard Pile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{ color: '#fff', fontWeight: 'bold' }}>→</div>
          {topCard && (
            <Card card={topCard} />
          )}
        </div>
      </div>

      {gameState.declaredSuit && (
        <div style={{
          color: '#fff',
          backgroundColor: '#e74c3c',
          padding: '5px 15px',
          borderRadius: '15px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          Current Suit: {gameState.declaredSuit}
        </div>
      )}

      {gameState.drawStack > 0 && (
        <div style={{
          color: '#fff',
          backgroundColor: '#e67e22',
          padding: '5px 15px',
          borderRadius: '15px',
          fontSize: '14px',
          fontWeight: 'bold',
          marginTop: '10px'
        }}>
          Draw Stack: +{gameState.drawStack}
        </div>
      )}
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
        textAlign: 'center'
      }}>
        <h3>Choose a Suit</h3>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          {suits.map(suit => (
            <button
              key={suit}
              onClick={() => onSuitSelect(suit)}
              style={{
                width: '60px',
                height: '80px',
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
                gap: '5px'
              }}
            >
              <div>{suitSymbols[suit]}</div>
              <div style={{ fontSize: '10px' }}>{suit}</div>
            </button>
          ))}
        </div>
        <button 
          onClick={onCancel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#95a5a6',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Chat component
const Chat = ({ socket }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!socket) return;

    socket.on('chat message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('chat message');
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
      height: '200px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '10px',
        borderBottom: '1px solid #ddd',
        fontWeight: 'bold',
        backgroundColor: '#f8f9fa'
      }}>
        Chat
      </div>
      <div style={{
        flex: 1,
        padding: '10px',
        overflowY: 'auto',
        fontSize: '14px'
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ marginBottom: '5px' }}>
            {msg}
          </div>
        ))}
      </div>
      <div style={{ padding: '10px', borderTop: '1px solid #ddd' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '5px 10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '14px'
            }}
          />
          <button 
            onClick={sendMessage}
            style={{
              padding: '5px 15px',
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Send
          </button>
        </div>
      </div>
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001'); // Changed from 3000 to 3001
    setSocket(newSocket);
    setPlayerId(newSocket.id);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('gameUpdate', (data) => {
      setGameState(data);
      updateValidCards(data);
    });

    newSocket.on('handUpdate', (hand) => {
      setPlayerHand(hand);
    });

    newSocket.on('error', (errorMsg) => {
      setError(errorMsg);
      setTimeout(() => setError(''), 3000);
    });

    newSocket.on('success', (successMsg) => {
      setSuccess(successMsg);
      setTimeout(() => setSuccess(''), 3000);
    });

    return () => newSocket.close();
  }, []);

  const updateValidCards = useCallback((state) => {
    if (!state || !playerHand.length) return;
    
    const topCard = parseTopCard(state.topCard);
    if (!topCard) return;

    const valid = playerHand.filter(card => {
      if (card.rank === '8') return true;
      
      if (state.drawStack > 0) {
        return canCounterDraw(card, topCard);
      }
      
      const suitToMatch = state.declaredSuit || topCard.suit;
      return card.suit === suitToMatch || card.rank === topCard.rank;
    });
    
    setValidCards(valid);
  }, [playerHand]);

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

  const startGame = () => {
    socket.emit('startGame', {
      gameId: gameState?.gameId
    });
  };

  const joinGame = () => {
    if (!playerName.trim() || !gameId.trim()) {
      setError('Please enter both name and game ID');
      return;
    }

    socket.emit('joinGame', {
      gameId: gameId.trim(),
      playerName: playerName.trim()
    });
  };

  const createGame = () => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    socket.emit('createGame', {
      playerName: playerName.trim()
    });
  };

  const handleCardSelect = (card) => {
    const isSelected = selectedCards.some(sc => sc.suit === card.suit && sc.rank === card.rank);
    
    if (isSelected) {
      setSelectedCards(prev => prev.filter(sc => !(sc.suit === card.suit && sc.rank === card.rank)));
    } else {
      if (selectedCards.length === 0) {
        setSelectedCards([card]);
      } else {
        const firstCard = selectedCards[0];
        if (firstCard.rank === card.rank) {
          if (firstCard.rank === 'Ace' || firstCard.rank === '2') {
            if (firstCard.suit === card.suit) {
              setSelectedCards(prev => [...prev, card]);
            } else {
              setError('Aces and 2s can only be stacked with the same suit');
            }
          } else {
            setSelectedCards(prev => [...prev, card]);
          }
        } else {
          setError('Can only stack cards of the same rank');
        }
      }
    }
  };

  const playSelectedCards = () => {
    if (selectedCards.length === 0) {
      setError('Please select at least one card');
      return;
    }

    const hasWild = selectedCards.some(card => card.rank === '8');
    
    if (hasWild) {
      if (selectedCards.length > 1) {
        setError('Cannot stack 8s with other cards');
        return;
      }
      setShowSuitSelector(true);
    } else {
      socket.emit('playCard', {
        gameId: gameState?.gameId,
        cards: selectedCards
      });
      setSelectedCards([]);
    }
  };

  const handleSuitSelect = (suit) => {
    socket.emit('playCard', {
      gameId: gameState?.gameId,
      cards: selectedCards,
      declaredSuit: suit
    });
    setSelectedCards([]);
    setShowSuitSelector(false);
  };

  const drawCard = () => {
    socket.emit('drawCard', {
      gameId: gameState?.gameId
    });
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
      
      setValidCards(valid);
    }
  }, [playerHand, gameState]);

  if (!isConnected) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Connecting to server...</h2>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div style={{ 
        padding: '20px', 
        maxWidth: '400px', 
        margin: '50px auto',
        backgroundColor: '#fff',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>Crazy 8's Game</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Your Name:</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
            placeholder="Enter your name"
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Game ID (to join existing game):</label>
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '5px',
              fontSize: '16px'
            }}
            placeholder="Enter game ID"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={createGame}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#27ae60',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Create Game
          </button>
          <button
            onClick={joinGame}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Join Game
          </button>
        </div>

        {error && (
          <div style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#e74c3c',
            color: '#fff',
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  const topCard = parseTopCard(gameState.topCard);
  const isMyTurn = gameState.currentPlayerId === playerId;

  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#ecf0f1',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', margin: '0 0 20px 0' }}>
        Crazy 8's Game
      </h1>

      {/* Game Info */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        backgroundColor: '#fff',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <div>
            <strong>Round:</strong> {gameState.roundNumber}
          </div>
          <div>
            <strong>Current Player:</strong> {gameState.currentPlayer}
          </div>
          <div>
            <strong>Game ID:</strong> {gameState.gameId}
          </div>
        </div>
        
        {/* Start Game Button - only show if game hasn't started */}
        {gameState.gameState === 'waiting' && gameState.players.length >= 2 && (
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={startGame}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Start Game ({gameState.players.length} players)
            </button>
          </div>
        )}
        
        {isMyTurn && (
          <div style={{
            marginTop: '10px',
            padding: '5px 15px',
            backgroundColor: '#2ecc71',
            color: '#fff',
            borderRadius: '15px',
            display: 'inline-block',
            fontWeight: 'bold'
          }}>
            It's your turn!
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
              padding: '10px 15px',
              backgroundColor: player.isCurrentPlayer ? '#3498db' : '#95a5a6',
              color: '#fff',
              borderRadius: '20px',
              fontWeight: 'bold',
              textAlign: 'center',
              minWidth: '120px'
            }}
          >
            <div>{player.name}</div>
            <div style={{ fontSize: '12px' }}>
              {player.handSize} cards
              {player.isSafe && ' (Safe)'}
              {player.isEliminated && ' (Out)'}
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
      {isMyTurn && (
        <div style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ marginBottom: '10px' }}>
            <button
              onClick={playSelectedCards}
              disabled={selectedCards.length === 0}
              style={{
                padding: '10px 20px',
                backgroundColor: selectedCards.length > 0 ? '#27ae60' : '#95a5a6',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: selectedCards.length > 0 ? 'pointer' : 'not-allowed',
                marginRight: '10px',
                fontSize: '16px'
              }}
            >
              Play {selectedCards.length} Card{selectedCards.length !== 1 ? 's' : ''}
            </button>
            <button
              onClick={drawCard}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e67e22',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Draw Card
            </button>
          </div>
          {selectedCards.length > 0 && (
            <button
              onClick={() => setSelectedCards([])}
              style={{
                padding: '5px 15px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Clear Selection
            </button>
          )}
        </div>
      )}

      {/* Player Hand */}
      <PlayerHand
        cards={playerHand}
        validCards={validCards}
        selectedCards={selectedCards}
        onCardSelect={handleCardSelect}
      />

      {/* Messages */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '15px',
          backgroundColor: '#e74c3c',
          color: '#fff',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '15px',
          backgroundColor: '#27ae60',
          color: '#fff',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          {success}
        </div>
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
        width: '300px'
      }}>
        <Chat socket={socket} />
      </div>
    </div>
  );
};

export default App;