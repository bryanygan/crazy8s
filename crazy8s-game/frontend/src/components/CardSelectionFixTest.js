import React from 'react';
import { CardSelectionProvider } from '../contexts/CardSelectionContext';
import { DragProvider } from '../contexts/DragContext';
import { useDragHandler } from '../hooks/useDragHandler';
import DragPreview from './DragPreview';
import Card from './Card';

const CardSelectionFixTestContent = () => {
  const sampleCards = [
    { id: '1', rank: 'A', suit: 'Hearts' },
    { id: '2', rank: 'K', suit: 'Diamonds' },
    { id: '3', rank: 'Q', suit: 'Clubs' },
    { id: '4', rank: 'J', suit: 'Spades' },
    { id: '5', rank: '10', suit: 'Hearts' }
  ];

  const handleDrop = (dropZoneId, cards) => {
    console.log(`Dropped ${cards.length} cards on ${dropZoneId}`);
  };

  useDragHandler(handleDrop);

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>
        🔧 Card Selection & Drag Fixes Test
      </h1>
      
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ color: '#34495e', margin: '0 0 15px 0' }}>
          Test Instructions:
        </h3>
        <ol style={{ color: '#555', lineHeight: '1.6' }}>
          <li><strong>Single Selection:</strong> Click any card - should select and show blue border</li>
          <li><strong>Deselection:</strong> Click the same card again - should deselect (no more blue border)</li>
          <li><strong>Multi-Selection:</strong> Hold Ctrl/Cmd and click multiple cards</li>
          <li><strong>Drag Test:</strong> Select card(s) and drag - all selected should appear in stack</li>
          <li><strong>Indicators:</strong> Only multi-selected cards should show "Bottom Card" and "#2", "#3", etc.</li>
        </ol>
      </div>

      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#34495e', margin: '0 0 15px 0' }}>Expected Behavior:</h3>
        <ul style={{ color: '#555', lineHeight: '1.6' }}>
          <li>✅ Cards should deselect when clicked again</li>
          <li>✅ Selection indicators only appear for multi-selection</li>
          <li>✅ Drag should be smooth and follow cursor closely</li>
          <li>✅ All selected cards should appear in drag stack</li>
          <li>✅ "Bottom Card" only shows on the last selected card in multi-selection</li>
          <li>✅ Play order numbers only show for 2nd, 3rd, etc. cards in multi-selection</li>
        </ul>
      </div>

      {/* Test Cards */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '2px dashed #bdc3c7'
      }}>
        {sampleCards.map((card) => (
          <Card
            key={card.id}
            card={card}
            isPlayable={true}
            settings={{ experiencedMode: false }}
            allCards={sampleCards}
          />
        ))}
      </div>

      <DragPreview />
    </div>
  );
};

const CardSelectionFixTest = () => {
  return (
    <DragProvider>
      <CardSelectionProvider>
        <CardSelectionFixTestContent />
      </CardSelectionProvider>
    </DragProvider>
  );
};

export default CardSelectionFixTest;