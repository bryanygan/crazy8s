// Card.js - Dedicated Card Component
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useCardSelection } from '../contexts/CardSelectionContext';
import { useDrag } from '../contexts/DragContext';
import { validateDraggedCards } from '../utils/dragValidation';

const Card = ({ 
  card, 
  isPlayable, 
  isSelected, 
  selectedIndex, 
  isBottomCard, 
  settings, 
  onCardSelect,
  allCards = []
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { 
    selectCard, 
    toggleCardSelection, 
    selectRange, 
    lastSelectedCard,
    isCardSelected,
    getSelectionIndex,
    selectedCards 
  } = useCardSelection();
  
  const {
    isDragging,
    startDrag,
    draggedCards
  } = useDrag();
  
  const cardRef = useRef(null);
  
  // Use selection context for selection state
  const isContextSelected = isCardSelected(card);
  const contextSelectionIndex = getSelectionIndex(card);
  
  // Prefer context selection state over props
  const actuallySelected = isContextSelected || isSelected;
  const actualSelectionIndex = contextSelectionIndex >= 0 ? contextSelectionIndex : selectedIndex;

  // Extract style calculation logic
  const getCardStyles = () => {
    const baseStyles = {
      width: '60px',
      height: '90px',
      border: `${actuallySelected ? '3px' : '2px'} solid ${getBorderColor()}`,
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
    if (actuallySelected) return '#3498db';
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
    if (isBeingDragged) return 0.3;
    if (settings.experiencedMode) return 1;
    return isPlayable ? 1 : 0.6;
  };

  const getTransform = () => {
    if (actuallySelected) {
      return 'translateY(-15px) scale(1.05)';
    }
    if (isHovered && !actuallySelected) {
      return 'translateY(-8px) scale(1.03)';
    }
    return 'translateY(0px) scale(1)';
  };

  const getBoxShadow = () => {
    if (actuallySelected) {
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


  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  
  // Simple click handler for card selection
  const handleClick = useCallback((e) => {
    if (isPlayable || settings.experiencedMode) {
      const isCtrlCmd = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      
      if (isShift && lastSelectedCard && allCards.length > 0) {
        // Range selection with Shift
        selectRange(lastSelectedCard, card, allCards);
      } else if (isCtrlCmd) {
        // Toggle selection with Ctrl/Cmd (for deselection)
        toggleCardSelection(card);
      } else {
        // Regular click behavior - stack cards by default
        if (actuallySelected) {
          // If card is already selected, deselect it
          toggleCardSelection(card);
        } else {
          // If card is not selected, add it to the selection (append mode)
          selectCard(card, { append: true });
        }
      }
      
      // Call original handler if provided
      if (onCardSelect) {
        onCardSelect(card);
      }
    }
  }, [card, isPlayable, settings.experiencedMode, lastSelectedCard, allCards, selectCard, toggleCardSelection, selectRange, onCardSelect, actuallySelected]);

  // Enhanced drag handler with proper validation
  const handleMouseDown = useCallback((e) => {
    // Don't start drag on right click
    if (e.button !== 0) return;
    
    console.log('🔍 Card mouseDown DEBUG:', {
      cardClicked: `${card.rank}${card.suit[0]}`,
      actuallySelected,
      selectedCardsLength: selectedCards.length,
      selectedCardsDetails: selectedCards.map(c => ({
        card: `${c.rank}${c.suit[0]}`,
        id: c.id,
        suit: c.suit,
        rank: c.rank
      }))
    });
    
    // CRITICAL FIX: Determine what cards to drag based on STRICT validation
    let cardsToStart;
    
    if (actuallySelected && selectedCards.length > 1) {
      // Multi-card selection: ONLY drag if this specific card is part of the selection
      // This prevents dragging other selected cards when clicking an unselected card
      cardsToStart = selectedCards;
      console.log('🚀 Multi-card drag: dragging all', cardsToStart.length, 'selected cards');
    } else if (actuallySelected && selectedCards.length === 1) {
      // Single selected card: drag just this card
      cardsToStart = [card];
      console.log('🚀 Single selected card drag');
    } else {
      // Unselected card: ONLY drag this specific card, ignore any other selections
      cardsToStart = [card];
      console.log('🚀 Unselected card drag: ONLY dragging clicked card, ignoring other selections');
      
      // IMPORTANT: Log warning if there are other selections to help debug
      if (selectedCards.length > 0) {
        console.warn('⚠️ VALIDATION: Dragging unselected card while other cards are selected. Only dragging clicked card:', `${card.rank}${card.suit[0]}`);
      }
    }
    
    console.log('📦 Final cards being sent to startDrag:', cardsToStart.map(c => `${c.rank}${c.suit[0]}`));
    
    // COMPREHENSIVE VALIDATION: Double-check the drag logic
    const validation = validateDraggedCards(card, selectedCards, cardsToStart, actuallySelected);
    
    if (!validation.isValid) {
      console.error('❌ DRAG VALIDATION FAILED:', validation.error);
      console.error('❌ Drag cancelled due to validation failure');
      return; // Cancel the drag
    }
    
    console.log('✅ DRAG VALIDATION PASSED:', validation.scenario);
    
    // Prevent default to avoid text selection
    e.preventDefault();
    
    // Start drag with validated cards
    startDrag(cardsToStart, e, cardRef.current);
  }, [actuallySelected, selectedCards, card, startDrag]);
  
  // Check if this card is being dragged
  const isBeingDragged = isDragging && draggedCards.some(dc => 
    (dc.id && card.id && dc.id === card.id) || 
    (dc.suit === card.suit && dc.rank === card.rank)
  );

  return (
    <div 
      style={{ 
        position: 'relative', 
        margin: '3px',
        flexShrink: 0,
        minWidth: '60px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: actuallySelected ? 15 : (isHovered ? 10 : 1)
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Bottom Card Indicator - Only show for multi-card selection */}
      {actuallySelected && selectedCards.length > 1 && actualSelectionIndex === (selectedCards.length - 1) && (
        <BottomCardIndicator />
      )}
      
      {/* Play Order Indicator - Only show for multi-card selection and not the first card */}
      {actuallySelected && selectedCards.length > 1 && actualSelectionIndex > 0 && (
        <PlayOrderIndicator order={actualSelectionIndex + 1} />
      )}
      
      {/* Card Element */}
      <div 
        ref={cardRef}
        className={`card ${isPlayable ? 'playable' : ''} ${actuallySelected ? 'selected' : ''}`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
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
