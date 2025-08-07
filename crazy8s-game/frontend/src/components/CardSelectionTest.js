import React from 'react';
import Card from './Card';
import { CardSelectionProvider, useCardSelection } from '../contexts/CardSelectionContext';

const TestCards = () => {
  const { selectedCards, clearSelection } = useCardSelection();
  
  // Sample cards for testing
  const sampleCards = [
    { id: '1', suit: 'Hearts', rank: 'Ace' },
    { id: '2', suit: 'Hearts', rank: '2' },
    { id: '3', suit: 'Hearts', rank: '3' },
    { id: '4', suit: 'Diamonds', rank: 'King' },
    { id: '5', suit: 'Diamonds', rank: 'Queen' },
    { id: '6', suit: 'Clubs', rank: '8' },
    { id: '7', suit: 'Clubs', rank: '7' },
    { id: '8', suit: 'Spades', rank: 'Jack' },
    { id: '9', suit: 'Spades', rank: '10' },
    { id: '10', suit: 'Hearts', rank: '8' },
  ];
  
  const settings = {
    experiencedMode: false,
    sortByRank: false,
    groupBySuit: false
  };
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f4f4f4', minHeight: '100vh' }}>
      <h2>Card Selection Test</h2>
      
      <div style={{
        backgroundColor: '#fff',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Instructions:</h3>
        <ul style={{ marginLeft: '20px', lineHeight: '1.8' }}>
          <li><b>Click</b> a card to select it (replaces current selection)</li>
          <li><b>Ctrl/Cmd + Click</b> to add/remove cards from selection</li>
          <li><b>Shift + Click</b> to select a range of cards</li>
        </ul>
      </div>
      
      <div style={{
        backgroundColor: '#fff',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>Selected Cards: {selectedCards.length}</h3>
        {selectedCards.length > 0 && (
          <>
            <div style={{ marginTop: '10px' }}>
              {selectedCards.map((card, index) => (
                <span key={card.id} style={{ 
                  marginRight: '10px', 
                  padding: '5px 10px',
                  backgroundColor: '#3498db',
                  color: '#fff',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginBottom: '5px'
                }}>
                  {card.rank} of {card.suit} (#{index + 1})
                </span>
              ))}
            </div>
            <button 
              onClick={clearSelection}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear Selection
            </button>
          </>
        )}
      </div>
      
      <div style={{
        backgroundColor: '#2ecc71',
        padding: '20px',
        borderRadius: '15px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '15px' }}>Test Cards</h3>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '5px',
          justifyContent: 'center'
        }}>
          {sampleCards.map(card => (
            <Card
              key={card.id}
              card={card}
              isPlayable={true}
              settings={settings}
              allCards={sampleCards}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const CardSelectionTest = () => {
  return (
    <CardSelectionProvider>
      <TestCards />
    </CardSelectionProvider>
  );
};

export default CardSelectionTest;