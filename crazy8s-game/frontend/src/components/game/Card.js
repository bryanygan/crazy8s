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

  // Style calculation functions
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
    if (isHovered && isPlayable && !settings.experiencedMode) return '#2ecc71';
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
      )}
      
      {/* Play Order Indicator */}
      {isSelected && selectedIndex > 0 && (
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
          #{selectedIndex + 1}
        </div>
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

export default Card;