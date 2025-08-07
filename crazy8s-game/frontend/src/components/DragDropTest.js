import React, { useState } from 'react';
import { CardSelectionProvider, useCardSelection } from '../contexts/CardSelectionContext';
import { DragProvider } from '../contexts/DragContext';
import { useDragHandler } from '../hooks/useDragHandler';
import DragPreview from './DragPreview';
import DropZone from './DropZone';
import Card from './Card';

// Test component content
const DragDropTestContent = () => {
  const { clearSelection } = useCardSelection();
  const [droppedCards, setDroppedCards] = useState({
    discardPile: [],
    playerArea: []
  });
  
  // Sample cards for testing
  const sampleCards = [
    { id: '1', rank: 'Ace', suit: 'Hearts' },
    { id: '2', rank: 'King', suit: 'Hearts' },
    { id: '3', rank: 'Queen', suit: 'Hearts' },
    { id: '4', rank: '7', suit: 'Diamonds' },
    { id: '5', rank: '8', suit: 'Clubs' },
    { id: '6', rank: '9', suit: 'Spades' },
    { id: '7', rank: '10', suit: 'Diamonds' },
    { id: '8', rank: 'Jack', suit: 'Clubs' }
  ];
  
  const handleDrop = (dropZoneId, cards) => {
    console.log(`Dropped ${cards.length} cards on ${dropZoneId}`);
    setDroppedCards(prev => ({
      ...prev,
      [dropZoneId]: [...prev[dropZoneId], ...cards]
    }));
    clearSelection();
  };
  
  useDragHandler(handleDrop);
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h2>Drag & Drop Test</h2>
      <p>1. Select cards (click, Ctrl/Cmd+click, or Shift+click)</p>
      <p>2. Drag selected cards to drop zones</p>
      <p>3. Drop zones will highlight when you hover over them</p>
      
      {/* Drop Zones */}
      <div style={{ 
        display: 'flex', 
        gap: '40px', 
        marginBottom: '40px',
        justifyContent: 'center'
      }}>
        <DropZone
          id="discardPile"
          label="Discard Pile"
          style={{ 
            width: '200px',
            height: '150px',
            backgroundColor: '#e8f5e9'
          }}
        >
          {droppedCards.discardPile.length > 0 && (
            <div style={{ fontSize: '12px', color: '#4caf50' }}>
              {droppedCards.discardPile.length} cards dropped
            </div>
          )}
        </DropZone>
        
        <DropZone
          id="playerArea"
          label="Player Area"
          style={{ 
            width: '200px',
            height: '150px',
            backgroundColor: '#fce4ec'
          }}
        >
          {droppedCards.playerArea.length > 0 && (
            <div style={{ fontSize: '12px', color: '#e91e63' }}>
              {droppedCards.playerArea.length} cards dropped
            </div>
          )}
        </DropZone>
      </div>
      
      {/* Sample Hand */}
      <div style={{
        backgroundColor: '#2ecc71',
        borderRadius: '15px',
        padding: '20px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '15px' }}>Sample Hand</h3>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center'
        }}>
          {sampleCards.map(card => (
            <Card
              key={card.id}
              card={card}
              isPlayable={true}
              settings={{ experiencedMode: false }}
              allCards={sampleCards}
            />
          ))}
        </div>
      </div>
      
      {/* Drag Preview */}
      <DragPreview />
    </div>
  );
};

// Main test component with providers
const DragDropTest = () => {
  return (
    <CardSelectionProvider>
      <DragProvider>
        <DragDropTestContent />
      </DragProvider>
    </CardSelectionProvider>
  );
};

export default DragDropTest;