import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const CardSelectionContext = createContext({
  selectedCards: [],
  selectionOrder: [],
  lastSelectedCard: null,
  isMultiSelectMode: false,
  selectCard: () => {},
  deselectCard: () => {},
  toggleCardSelection: () => {},
  clearSelection: () => {},
  selectMultipleCards: () => {},
  selectRange: () => {},
  isCardSelected: () => false,
  getSelectionIndex: () => -1,
});

export const CardSelectionProvider = ({ children }) => {
  const [selectedCards, setSelectedCards] = useState([]);
  const [selectionOrder, setSelectionOrder] = useState([]);
  const [lastSelectedCard, setLastSelectedCard] = useState(null);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  
  // Track shift key state for range selection
  const lastClickedCardRef = useRef(null);
  
  // Helper to generate unique card ID (moved up to avoid circular dependency)
  const getCardId = useCallback((card) => {
    if (card.id) return card.id;
    return `${card.suit}-${card.rank}`;
  }, []);
  
  // State consistency validation
  useEffect(() => {
    // Only run validation if we have some state to validate
    if (selectedCards.length === 0 && selectionOrder.length === 0) return;
    
    // Validate that selectedCards and selectionOrder are in sync
    const selectedCardIds = selectedCards.map(card => getCardId(card));
    const orderIds = [...selectionOrder];
    
    // Check if all selected cards have corresponding order entries
    const missingFromOrder = selectedCardIds.filter(id => !orderIds.includes(id));
    const extraInOrder = orderIds.filter(id => !selectedCardIds.includes(id));
    
    if (missingFromOrder.length > 0 || extraInOrder.length > 0) {
      console.warn('⚠️ SELECTION STATE INCONSISTENCY DETECTED:', {
        selectedCardsCount: selectedCards.length,
        selectionOrderCount: selectionOrder.length,
        missingFromOrder,
        extraInOrder,
        selectedCards: selectedCards.map(c => `${c.rank}${c.suit[0]}`),
        selectionOrder: orderIds
      });
      
      // Auto-repair: sync selectionOrder with selectedCards
      const repairedOrder = selectedCardIds.filter(id => orderIds.includes(id));
      const newIds = selectedCardIds.filter(id => !orderIds.includes(id));
      setSelectionOrder([...repairedOrder, ...newIds]);
      
      console.log('🔧 Auto-repaired selection state');
    }
    
    // Validate lastSelectedCard is in selectedCards (if it exists)
    if (lastSelectedCard && !selectedCards.some(c => getCardId(c) === getCardId(lastSelectedCard))) {
      console.warn('⚠️ lastSelectedCard not in selectedCards, clearing it');
      setLastSelectedCard(null);
      lastClickedCardRef.current = null;
    }
  }, [selectedCards, selectionOrder, lastSelectedCard, getCardId]);
  
  // Check if a card is selected
  const isCardSelected = useCallback((card) => {
    const cardId = getCardId(card);
    return selectedCards.some(c => getCardId(c) === cardId);
  }, [selectedCards, getCardId]);
  
  // Get the selection index of a card (order in which it was selected)
  const getSelectionIndex = useCallback((card) => {
    const cardId = getCardId(card);
    return selectionOrder.indexOf(cardId);
  }, [selectionOrder, getCardId]);
  
  // Select a single card
  const selectCard = useCallback((card, options = {}) => {
    const { append = false } = options;
    const cardId = getCardId(card);
    
    if (append) {
      // Multi-select mode - add to existing selection
      setSelectedCards(prev => {
        const alreadySelected = prev.some(c => getCardId(c) === cardId);
        if (alreadySelected) {
          return prev; // Don't add if already selected
        }
        return [...prev, card];
      });
      
      setSelectionOrder(prev => {
        if (prev.includes(cardId)) {
          return prev; // Don't add if already in order
        }
        return [...prev, cardId];
      });
    } else {
      // Single select mode - replace selection
      setSelectedCards([card]);
      setSelectionOrder([cardId]);
    }
    
    setLastSelectedCard(card);
    lastClickedCardRef.current = card;
  }, [getCardId]);
  
  // Deselect a specific card
  const deselectCard = useCallback((card) => {
    const cardId = getCardId(card);
    setSelectedCards(prev => prev.filter(c => getCardId(c) !== cardId));
    setSelectionOrder(prev => prev.filter(id => id !== cardId));
    
    if (lastSelectedCard && getCardId(lastSelectedCard) === cardId) {
      setLastSelectedCard(null);
    }
  }, [getCardId, lastSelectedCard]);
  
  // Toggle card selection with atomic state updates
  const toggleCardSelection = useCallback((card, options = {}) => {
    const cardId = getCardId(card);
    
    console.log('🔄 toggleCardSelection called:', {
      card: `${card.rank}${card.suit[0]}`,
      cardId,
      currentSelectionCount: selectedCards.length,
      currentOrder: selectionOrder
    });
    
    // Check current selection state
    const isCurrentlySelected = selectedCards.some(c => getCardId(c) === cardId);
    
    if (isCurrentlySelected) {
      // REMOVING card from selection
      console.log('📤 Removing card from selection:', `${card.rank}${card.suit[0]}`);
      
      // Update selectedCards
      setSelectedCards(prev => {
        const newSelection = prev.filter(c => getCardId(c) !== cardId);
        console.log('🎯 New selectedCards after removal:', newSelection.map(c => `${c.rank}${c.suit[0]}`));
        return newSelection;
      });
      
      // Update selectionOrder
      setSelectionOrder(prev => {
        const newOrder = prev.filter(id => id !== cardId);
        console.log('🎯 New selectionOrder after removal:', newOrder);
        return newOrder;
      });
      
      // If removing the last selected card, update lastSelectedCard
      if (lastSelectedCard && getCardId(lastSelectedCard) === cardId) {
        const remainingCards = selectedCards.filter(c => getCardId(c) !== cardId);
        if (remainingCards.length > 0) {
          setLastSelectedCard(remainingCards[remainingCards.length - 1]);
        } else {
          setLastSelectedCard(null);
          lastClickedCardRef.current = null;
        }
      }
      
    } else {
      // ADDING card to selection
      console.log('📥 Adding card to selection:', `${card.rank}${card.suit[0]}`);
      
      // Update selectedCards
      setSelectedCards(prev => {
        const newSelection = [...prev, card];
        console.log('🎯 New selectedCards after addition:', newSelection.map(c => `${c.rank}${c.suit[0]}`));
        return newSelection;
      });
      
      // Update selectionOrder
      setSelectionOrder(prev => {
        const newOrder = [...prev, cardId];
        console.log('🎯 New selectionOrder after addition:', newOrder);
        return newOrder;
      });
      
      // Update last selected card
      setLastSelectedCard(card);
      lastClickedCardRef.current = card;
    }
    
  }, [getCardId, selectedCards, selectionOrder, lastSelectedCard]);
  
  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedCards([]);
    setSelectionOrder([]);
    setLastSelectedCard(null);
    lastClickedCardRef.current = null;
  }, []);
  
  // Select multiple cards at once
  const selectMultipleCards = useCallback((cards, replace = false) => {
    if (replace) {
      const newOrder = cards.map(c => getCardId(c));
      setSelectedCards(cards);
      setSelectionOrder(newOrder);
      setLastSelectedCard(cards[cards.length - 1] || null);
    } else {
      // Append to existing selection
      const newCards = cards.filter(c => !isCardSelected(c));
      const newOrder = newCards.map(c => getCardId(c));
      setSelectedCards(prev => [...prev, ...newCards]);
      setSelectionOrder(prev => [...prev, ...newOrder]);
      if (newCards.length > 0) {
        setLastSelectedCard(newCards[newCards.length - 1]);
      }
    }
  }, [getCardId, isCardSelected]);
  
  // Select a range of cards (for shift-click)
  const selectRange = useCallback((startCard, endCard, cards) => {
    if (!startCard || !endCard || !cards || cards.length === 0) return;
    
    const startIndex = cards.findIndex(c => 
      getCardId(c) === getCardId(startCard)
    );
    const endIndex = cards.findIndex(c => 
      getCardId(c) === getCardId(endCard)
    );
    
    if (startIndex === -1 || endIndex === -1) return;
    
    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);
    
    const rangeCards = cards.slice(minIndex, maxIndex + 1);
    selectMultipleCards(rangeCards, true);
  }, [getCardId, selectMultipleCards]);
  
  // Handle keyboard events for multi-select
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Control' || e.key === 'Meta' || e.metaKey || e.ctrlKey) {
        setIsMultiSelectMode(true);
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === 'Control' || e.key === 'Meta' || !e.metaKey || !e.ctrlKey) {
        setIsMultiSelectMode(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  const value = {
    selectedCards,
    selectionOrder,
    lastSelectedCard,
    isMultiSelectMode,
    selectCard,
    deselectCard,
    toggleCardSelection,
    clearSelection,
    selectMultipleCards,
    selectRange,
    isCardSelected,
    getSelectionIndex,
  };
  
  return (
    <CardSelectionContext.Provider value={value}>
      {children}
    </CardSelectionContext.Provider>
  );
};

export const useCardSelection = () => {
  const context = useContext(CardSelectionContext);
  if (!context) {
    throw new Error('useCardSelection must be used within a CardSelectionProvider');
  }
  return context;
};

export default CardSelectionContext;