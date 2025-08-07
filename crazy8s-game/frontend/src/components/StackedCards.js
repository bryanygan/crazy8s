import React, { useState, useEffect } from 'react';
import styles from './StackedCards.module.css';

const StackedCards = ({ 
  cards, 
  position, 
  isVisible = true,
  stackDirection = 'horizontal', // 'horizontal' or 'vertical'
  maxVisible = 4, // Maximum cards to show before using count indicator
  offset = 12, // Offset between cards in pixels
  showCount = true 
}) => {
  const [animatedCards, setAnimatedCards] = useState([]);

  // Animate cards joining/leaving the stack
  useEffect(() => {
    if (cards.length === 0) {
      // Animate cards leaving before clearing
      const leavingCards = animatedCards.map(card => ({
        ...card,
        isLeaving: true,
        animationDelay: card.stackIndex * 30
      }));
      
      setAnimatedCards(leavingCards);
      
      // Clear after animation completes
      const timeout = setTimeout(() => {
        setAnimatedCards([]);
      }, 200 + (leavingCards.length * 30));
      
      return () => clearTimeout(timeout);
    }

    // Compare previous and current cards to determine what changed
    const previousCardIds = animatedCards.map(ac => ac.id || `${ac.suit}-${ac.rank}`);
    const currentCardIds = cards.map(c => c.id || `${c.suit}-${c.rank}`);
    
    const newCardIds = currentCardIds.filter(id => !previousCardIds.includes(id));
    const leavingCardIds = previousCardIds.filter(id => !currentCardIds.includes(id));

    // Add new cards with animation, preserve existing cards, mark leaving cards
    const updatedCards = cards.map((card, index) => {
      const cardId = card.id || `${card.suit}-${card.rank}`;
      const previousCard = animatedCards.find(ac => 
        (ac.id || `${ac.suit}-${ac.rank}`) === cardId
      );
      
      return {
        ...card,
        stackIndex: index,
        isNew: newCardIds.includes(cardId),
        isLeaving: leavingCardIds.includes(cardId),
        animationDelay: newCardIds.includes(cardId) ? 
          (newCardIds.indexOf(cardId) * 100) : 0,
        // Preserve animation state for existing cards
        wasNew: previousCard?.isNew || false
      };
    });

    setAnimatedCards(updatedCards);

    // Clean up leaving cards after animation
    if (leavingCardIds.length > 0) {
      const timeout = setTimeout(() => {
        setAnimatedCards(current => 
          current.filter(card => {
            const cardId = card.id || `${card.suit}-${card.rank}`;
            return !leavingCardIds.includes(cardId);
          })
        );
      }, 200);
      
      return () => clearTimeout(timeout);
    }
  }, [cards]);

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

  const getCardPosition = (index, total) => {
    if (stackDirection === 'horizontal') {
      // Horizontal stacking with slight vertical offset for depth
      return {
        left: `${index * offset}px`,
        top: `${index * 2}px`, // Slight vertical offset for depth
        zIndex: 1000 - index
      };
    } else {
      // Vertical stacking
      return {
        left: `${index * 2}px`,
        top: `${index * offset}px`,
        zIndex: 1000 - index
      };
    }
  };

  const getCardRotation = (index, total) => {
    // Subtle rotation for visual interest
    const baseRotation = -3;
    const variation = (index - total / 2) * 1.5;
    return baseRotation + variation;
  };

  const getCardScale = (index, total) => {
    // Slight scale decrease for cards further back
    return 1 - (index * 0.02);
  };

  if (!isVisible || animatedCards.length === 0) return null;

  const visibleCards = animatedCards.slice(0, maxVisible);
  const hiddenCount = Math.max(0, animatedCards.length - maxVisible);

  const stackContainerClasses = [
    styles.stackContainer,
    stackDirection === 'horizontal' ? styles.horizontalStack : styles.verticalStack
  ].join(' ');

  return (
    <div 
      className={stackContainerClasses}
      style={{
        left: position?.x || 0,
        top: position?.y || 0,
      }}
    >
      <div className={styles.cardStack}>
        {visibleCards.map((card, index) => {
          const cardPosition = getCardPosition(index, visibleCards.length);
          const rotation = getCardRotation(index, visibleCards.length);
          const scale = getCardScale(index, visibleCards.length);
          const suitClass = card.suit.toLowerCase();
          
          const cardClasses = [
            styles.stackedCard,
            styles[suitClass],
            card.isNew ? styles.entering : '',
            card.isLeaving ? styles.leaving : ''
          ].filter(Boolean).join(' ');
          
          return (
            <div
              key={card.id || `${card.suit}-${card.rank}-${index}`}
              className={cardClasses}
              style={{
                ...cardPosition,
                color: getCardColor(card),
                transform: `rotate(${rotation}deg) scale(${scale})`,
                opacity: 0.9 - (index * 0.1),
                transitionDelay: card.isNew ? `${card.animationDelay}ms` : '0ms'
              }}
            >
              {/* Top rank */}
              <div className={styles.cardRank}>
                {card.rank}
              </div>
              
              {/* Center suit symbol - always visible */}
              <div className={styles.cardSuit}>
                {getSuitSymbol(card.suit)}
              </div>
              
              {/* Bottom rank (rotated) */}
              <div className={styles.cardRankBottom}>
                {card.rank}
              </div>

              {/* Card number overlay for identification */}
              {index < 3 && (
                <div 
                  className={styles.cardNumber}
                  style={{ zIndex: 1010 + index }}
                >
                  {index + 1}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Count indicator for hidden cards */}
        {hiddenCount > 0 && showCount && (
          <div 
            className={styles.hiddenCountIndicator}
            style={{
              top: '-20px',
              right: stackDirection === 'horizontal' 
                ? `${(maxVisible - 1) * offset + 60}px` 
                : '-20px'
            }}
          >
            +{hiddenCount}
          </div>
        )}

        {/* Total count indicator */}
        {animatedCards.length > 1 && showCount && (
          <div className={styles.totalCountIndicator}>
            {animatedCards.length} cards
          </div>
        )}
      </div>
    </div>
  );
};

export default StackedCards;