import React, { useState } from 'react';
import { DragProvider, useDrag } from '../contexts/DragContext';
import { CardSelectionProvider, useCardSelection } from '../contexts/CardSelectionContext';

const DragDebugTest = () => {
  return (
    <DragProvider>
      <CardSelectionProvider>
        <DebugInterface />
      </CardSelectionProvider>
    </DragProvider>
  );
};

const DebugInterface = () => {
  const { selectedCards, selectCard, toggleCardSelection, clearSelection } = useCardSelection();
  const { isDragging, draggedCards, startDrag } = useDrag();
  
  const testCards = [
    { id: 'h1', suit: 'Hearts', rank: '7' },
    { id: 'h2', suit: 'Spades', rank: '7' },
    { id: 'h3', suit: 'Hearts', rank: '8' },
  ];

  const handleCardClick = (card) => {
    console.log('Card clicked:', card);
    toggleCardSelection(card);
  };

  const handleStartDrag = (e) => {
    if (selectedCards.length > 0) {
      console.log('Manual drag start with:', selectedCards);
      startDrag(selectedCards, e, e.target);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Drag Debug Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Selection State:</h3>
        <p>Selected Cards: {selectedCards.length}</p>
        <p>Cards: {selectedCards.map(c => `${c.rank}${c.suit[0]}`).join(', ')}</p>
        <button onClick={clearSelection} style={{ marginRight: '10px' }}>Clear Selection</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Drag State:</h3>
        <p>Is Dragging: {isDragging ? 'Yes' : 'No'}</p>
        <p>Dragged Cards: {draggedCards.length}</p>
        <p>Cards: {draggedCards.map(c => `${c.rank}${c.suit[0]}`).join(', ')}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Cards:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {testCards.map(card => {
            const isSelected = selectedCards.some(sc => sc.id === card.id);
            return (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                onMouseDown={handleStartDrag}
                style={{
                  width: '60px',
                  height: '90px',
                  border: isSelected ? '3px solid #3498db' : '2px solid #bdc3c7',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected ? '#e8f4fd' : 'white',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div>{card.rank}</div>
                <div style={{ fontSize: '20px' }}>
                  {card.suit === 'Hearts' ? '♥' : card.suit === 'Spades' ? '♠' : '?'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3>Manual Actions:</h3>
        <button 
          onClick={(e) => handleStartDrag(e)}
          disabled={selectedCards.length === 0}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: selectedCards.length > 0 ? '#3498db' : '#bdc3c7',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: selectedCards.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          Start Drag ({selectedCards.length} cards)
        </button>
      </div>

      {/* Simple drag preview */}
      {isDragging && (
        <div style={{
          position: 'fixed',
          top: '100px',
          left: '100px',
          pointerEvents: 'none',
          zIndex: 1000,
          backgroundColor: 'rgba(255,0,0,0.8)',
          padding: '10px',
          borderRadius: '5px',
          color: 'white'
        }}>
          Dragging {draggedCards.length} cards: {draggedCards.map(c => `${c.rank}${c.suit[0]}`).join(', ')}
        </div>
      )}
    </div>
  );
};

export default DragDebugTest;