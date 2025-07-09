// Card.js - Dedicated Card Component
import React, { useState } from 'react';

const Card = ({ 
  card, 
  isPlayable, 
  isSelected, 
  selectedIndex, 
  isBottomCard, 
  settings, 
  onCardSelect 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Extract style calculation logic
  const getCardStyles = () => {
    const baseStyles = {
      width: '60px',
      height: '90px',
      border: `2px solid ${getBorderColor()}`,
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: getBackgroundColor(),
      cursor: getCursor(),
      fontSize: '10px',
      padding: '4px',
      color: getTextColor(),
      flexShrink: 0,
      minWidth: '50px',
      maxWidth: '60px',
      opacity: getOpacity(),
      transform: getTransform(),
      boxShadow: getBoxShadow(),
      transition: getTransition(),
      transformOrigin: 'center center'
    };

    return baseStyles;
  };

  const getBorderColor = () => {
    if (settings.experiencedMode) return '#333';
    return isPlayable ? '#27ae60' : '#bdc3c7';
  };

  const getBackgroundColor = () => {
    if (isPlayable && !settings.experiencedMode) {
      return 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)';
    }
    return '#ffffff';
  };

  const getCursor = () => {
    return (isPlayable || settings.experiencedMode) ? 'pointer' : 'default';
  };

  const getTextColor = () => {
    return (card.suit === 'Hearts' || card.suit === 'Diamonds') ? '#e74c3c' : '#2c3e50';
  };

  const getOpacity = () => {
    if (settings.experiencedMode) return 1;
    return isPlayable ? 1 : 0.6;
  };

  const getTransform = () => {
    if (isSelected) {
      return 'translateY(-15px) scale(1.05)';
    }
    if (isHovered && !isSelected) {
      return 'translateY(-8px) scale(1.03)';
    }
    return 'translateY(0px) scale(1)';
  };

  const getBoxShadow = () => {
    if (isSelected) {
      return '0 8px 20px rgba(52, 152, 219, 0.4)';
    }
    if (isHovered && isPlayable) {
      return '0 6px 16px rgba(39, 174, 96, 0.4)';
    }
    if (isHovered) {
      return '0 4px 12px rgba(0,0,0,0.2)';
    }
    if (isPlayable && !settings.experiencedMode) {
      return '0 2px 6px rgba(39, 174, 96, 0.3)';
    }
    return '0 2px 4px rgba(0,0,0,0.1)';
  };

  const getTransition = () => {
    return [
      'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      'opacity 0.3s ease',
      'border-color 0.3s ease'
    ].join(', ');
  };

  const getSuitSymbol = () => {
    const symbols = {
      'Hearts': '♥',
      'Diamonds': '♦',
      'Clubs': '♣',
      'Spades': '♠'
    };
    return symbols[card.suit] || '?';
  };

  const handleClick = () => {
    if (isPlayable || settings.experiencedMode) {
      onCardSelect(card);
    }
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <div 
      style={{ 
        position: 'relative', 
        margin: '3px',
        flexShrink: 0,
        minWidth: '60px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isSelected ? 15 : (isHovered ? 10 : 1)
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Bottom Card Indicator */}
      {isBottomCard && selectedIndex !== undefined && selectedIndex >= 0 && (
        <BottomCardIndicator />
      )}
      
      {/* Play Order Indicator */}
      {isSelected && selectedIndex > 0 && (
        <PlayOrderIndicator order={selectedIndex + 1} />
      )}
      
      {/* Card Element */}
      <div 
        className={`card ${isPlayable ? 'playable' : ''} ${isSelected ? 'selected' : ''}`}
        onClick={handleClick}
        style={getCardStyles()}
      >
        <div style={{ fontWeight: 'bold', fontSize: '8px' }}>
          {card.rank}
        </div>
        <div style={{ fontSize: '16px' }}>
          {getSuitSymbol()}
        </div>
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '8px', 
          transform: 'rotate(180deg)' 
        }}>
          {card.rank}
        </div>
      </div>
    </div>
  );
};

// Supporting indicator components
const BottomCardIndicator = () => (
  <div style={{
    position: 'absolute',
    top: '-25px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#e74c3c',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '8px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    zIndex: 20,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  }}>
    Bottom Card
  </div>
);

const PlayOrderIndicator = ({ order }) => (
  <div style={{
    position: 'absolute',
    top: '-20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#3498db',
    color: '#fff',
    padding: '1px 5px',
    borderRadius: '8px',
    fontSize: '10px',
    fontWeight: 'bold',
    zIndex: 20,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  }}>
    #{order}
  </div>
);

export default Card;

// =============================================================================
// Updated PlayerHand component using the new Card component
// =============================================================================

const PlayerHand = ({ cards, validCards = [], selectedCards = [], onCardSelect, settings = {} }) => {
  // Helper function to check if two cards are the same (using ID if available, fallback to suit/rank)
  const isSameCard = (card1, card2) => {
    if (card1.id && card2.id) {
      return card1.id === card2.id;
    }
    return card1.suit === card2.suit && card1.rank === card2.rank;
  };

  // Helper functions for card organization (keep existing logic)
  const getRankValue = (rank) => {
    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
    return rankOrder.indexOf(rank);
  };

  const getSuitValue = (suit) => {
    const suitOrder = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    return suitOrder.indexOf(suit);
  };

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

  const getCardGroups = () => {
    const organizedCards = organizeCards();
    
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

  const cardGroups = getCardGroups();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '20px 0',
      padding: '15px 15px 25px 15px',
      backgroundColor: '#2ecc71',
      borderRadius: '15px',
      minHeight: '180px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      overflow: 'visible'
    }}>
      <div style={{ 
        color: '#fff', 
        fontSize: '14px', 
        fontWeight: 'bold', 
        marginBottom: '10px',
        textAlign: 'center'
      }}>
        Your Hand ({cards.length} cards)
      </div>
      
      {cards.length === 0 ? (
        <div style={{ color: '#fff', fontSize: '16px', fontStyle: 'italic' }}>
          No cards in hand
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible',
          paddingTop: '20px',
          paddingBottom: '10px',
          position: 'relative',
          minHeight: '110px'
        }}>
          {cardGroups.map((group, groupIndex) => (
            <div key={groupIndex} style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {group.cards.map((card) => {
                const isPlayable = validCards.some(vc => isSameCard(vc, card));
                const isSelected = selectedCards.some(sc => isSameCard(sc, card));
                const selectedIndex = selectedCards.findIndex(sc => isSameCard(sc, card));
                const isBottomCard = selectedIndex === 0;
                const cardKey = card.id || `${card.suit}-${card.rank}`;
                
                return (
                  <Card
                    key={cardKey}
                    card={card}
                    isPlayable={isPlayable}
                    isSelected={isSelected}
                    selectedIndex={selectedIndex}
                    isBottomCard={isBottomCard && selectedCards.length > 1}
                    settings={settings}
                    onCardSelect={onCardSelect}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};