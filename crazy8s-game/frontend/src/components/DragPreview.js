import React from 'react';
import { useDrag } from '../contexts/DragContext';

const DragPreview = () => {
  const { 
    isDragging, 
    isReturning,
    draggedCards, 
    dragPosition, 
    returnPosition,
    dragOffset 
  } = useDrag();
  
  // Enhanced debug logging
  if ((isDragging || isReturning)) {
    console.log('🎨 DragPreview render state:', {
      isDragging,
      isReturning,
      draggedCardsLength: draggedCards.length,
      draggedCardsData: draggedCards.map((c, i) => ({
        index: i,
        card: `${c.rank}${c.suit[0]}`,
        id: c.id,
        fullCard: c
      }))
    });
  }
  
  if ((!isDragging && !isReturning) || draggedCards.length === 0) return null;

  // Use return position during animation, otherwise use drag position
  const currentPosition = isReturning && returnPosition ? returnPosition : dragPosition;
  
  return (
    <div style={{ 
      position: 'fixed',
      pointerEvents: 'none',
      zIndex: 1000,
      left: `${currentPosition.x - dragOffset.x}px`,
      top: `${currentPosition.y - dragOffset.y}px`,
      opacity: isReturning ? 0.6 : 0.8,
      transform: isReturning ? 'rotate(0deg) scale(0.95)' : 'rotate(-5deg)',
      transition: isReturning ? 'transform 0.2s ease-out, opacity 0.2s ease-out' : 'none',
    }}>
      {draggedCards.map((card, index) => {
        console.log(`🃏 Rendering DragCard ${index}:`, {
          card: `${card.rank}${card.suit[0]}`,
          position: { x: index * 8, y: index * 3 },
          zIndex: 100 - index
        });
        return (
          <DragCard 
            key={card.id || `${card.suit}-${card.rank}-${index}`}
            card={card}
            index={index}
            total={draggedCards.length}
          />
        );
      })}
      
      {/* Card count indicator for multiple cards */}
      {draggedCards.length > 1 && (
        <div style={{
          position: 'absolute',
          top: '-12px',
          right: '-12px',
          backgroundColor: '#e74c3c',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          zIndex: 10
        }}>
          {draggedCards.length}
        </div>
      )}
    </div>
  );
};

const DragCard = ({ card, index, total }) => {
  console.log(`🃏 DragCard rendering:`, {
    index,
    total,
    card: `${card.rank}${card.suit[0]}`,
    cardData: card
  });
  
  const getSuitSymbol = (suit) => {
    const symbols = {
      'Hearts': '♥',
      'Diamonds': '♦', 
      'Clubs': '♣',
      'Spades': '♠'
    };
    return symbols[suit] || '?';
  };

  const getCardColor = (card) => {
    return (card.suit === 'Hearts' || card.suit === 'Diamonds') ? '#e74c3c' : '#2c3e50';
  };

  // Calculate position offset for stacking effect
  const getCardOffset = () => {
    return {
      x: index * 8, // Horizontal offset
      y: index * 3, // Slight vertical offset for depth
    };
  };

  const offset = getCardOffset();
  console.log(`🎯 DragCard ${index} offset:`, offset);
  
  return (
    <div style={{
      position: 'absolute',
      left: `${offset.x}px`,
      top: `${offset.y}px`,
      width: '60px',
      height: '90px',
      backgroundColor: '#ffffff',
      border: '3px solid #3498db',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px',
      fontSize: '10px',
      color: getCardColor(card),
      boxShadow: `0 ${4 + index * 2}px ${8 + index * 4}px rgba(0,0,0,0.3)`,
      zIndex: 100 - index, // Cards behind have lower z-index
      cursor: 'grabbing',
      transform: `rotate(${-2 + index * 1.5}deg)`, // Slight rotation for visual interest
    }}>
      {/* Top rank */}
      <div style={{ fontWeight: 'bold', fontSize: '8px' }}>
        {card.rank}
      </div>
      
      {/* Center suit symbol */}
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
        {getSuitSymbol(card.suit)}
      </div>
      
      {/* Bottom rank (rotated) */}
      <div style={{ 
        fontWeight: 'bold', 
        fontSize: '8px', 
        transform: 'rotate(180deg)' 
      }}>
        {card.rank}
      </div>

      {/* Selection order indicator for multi-card selection */}
      {total > 1 && index > 0 && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#3498db',
          color: 'white',
          borderRadius: '50%',
          width: '16px',
          height: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          zIndex: 10
        }}>
          {index + 1}
        </div>
      )}
    </div>
  );
};

export default DragPreview;