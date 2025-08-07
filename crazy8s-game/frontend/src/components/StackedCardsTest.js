import React, { useState } from 'react';
import StackedCards from './StackedCards';

const StackedCardsTest = () => {
  const [cards, setCards] = useState([]);
  const [position, setPosition] = useState({ x: 200, y: 200 });
  const [stackDirection, setStackDirection] = useState('horizontal');

  // Sample card data
  const sampleCards = [
    { id: '1', rank: 'A', suit: 'Hearts' },
    { id: '2', rank: '7', suit: 'Spades' },
    { id: '3', rank: 'Q', suit: 'Diamonds' },
    { id: '4', rank: '3', suit: 'Clubs' },
    { id: '5', rank: 'K', suit: 'Hearts' },
    { id: '6', rank: '9', suit: 'Spades' },
    { id: '7', rank: '4', suit: 'Diamonds' },
    { id: '8', rank: 'J', suit: 'Clubs' }
  ];

  const addCard = () => {
    const availableCards = sampleCards.filter(card => 
      !cards.find(c => c.id === card.id)
    );
    
    if (availableCards.length > 0) {
      const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      setCards(prev => [...prev, randomCard]);
    }
  };

  const removeCard = () => {
    if (cards.length > 0) {
      setCards(prev => prev.slice(0, -1));
    }
  };

  const addMultiple = () => {
    const availableCards = sampleCards.filter(card => 
      !cards.find(c => c.id === card.id)
    );
    
    const toAdd = availableCards.slice(0, 3);
    setCards(prev => [...prev, ...toAdd]);
  };

  const clearAll = () => {
    setCards([]);
  };

  const moveStack = (event) => {
    setPosition({
      x: event.clientX - 50,
      y: event.clientY - 50
    });
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: 'white', marginBottom: '20px' }}>
        Enhanced Card Stacking Test - Phase 2
      </h1>
      
      {/* Controls */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Controls</h3>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button 
            onClick={addCard}
            style={{
              padding: '8px 16px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Add Card
          </button>
          
          <button 
            onClick={removeCard}
            disabled={cards.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: cards.length === 0 ? '#bdc3c7' : '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: cards.length === 0 ? 'default' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            Remove Card
          </button>
          
          <button 
            onClick={addMultiple}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Add 3 Cards
          </button>
          
          <button 
            onClick={clearAll}
            disabled={cards.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: cards.length === 0 ? '#bdc3c7' : '#8e44ad',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: cards.length === 0 ? 'default' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            Clear All
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
          <label style={{ color: '#2c3e50', fontWeight: 'bold' }}>
            Stack Direction:
          </label>
          <select 
            value={stackDirection} 
            onChange={(e) => setStackDirection(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #bdc3c7'
            }}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>

        <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#7f8c8d' }}>
          💡 Click anywhere on the screen to move the card stack to that position.
          Current cards: {cards.length}
        </p>
      </div>

      {/* Click area to move stack */}
      <div 
        onClick={moveStack}
        style={{
          position: 'relative',
          height: '400px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          border: '2px dashed rgba(255, 255, 255, 0.3)',
          cursor: 'crosshair',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.7)', 
          fontSize: '18px', 
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          Click anywhere to position the stack
          <br />
          <small>Watch the smooth animations as cards join and leave!</small>
        </p>
      </div>

      {/* Features showcase */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Phase 2 Features</h3>
        <ul style={{ color: '#2c3e50', lineHeight: '1.6' }}>
          <li>✨ <strong>Enhanced Horizontal Stacking:</strong> Cards overlap showing only numbers</li>
          <li>🎯 <strong>Visible Card Numbers:</strong> Each card shows rank and suit clearly</li>
          <li>🎬 <strong>Smooth Animations:</strong> Cards animate in/out with staggered timing</li>
          <li>📱 <strong>Responsive Design:</strong> Adapts to different screen sizes</li>
          <li>🎨 <strong>Visual Polish:</strong> Depth effects and proper layering</li>
          <li>🔢 <strong>Count Indicators:</strong> Shows total and overflow counts</li>
          <li>⚙️ <strong>Configurable:</strong> Direction, offset, visibility controls</li>
        </ul>
      </div>

      {/* Render the stacked cards */}
      <StackedCards
        cards={cards}
        position={position}
        isVisible={true}
        stackDirection={stackDirection}
        maxVisible={4}
        offset={stackDirection === 'horizontal' ? 15 : 8}
        showCount={true}
      />
    </div>
  );
};

export default StackedCardsTest;