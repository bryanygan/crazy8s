import {
  canStackCardsFrontend
} from './cardValidation';

// Helper function to check if two cards are the same (using ID if available, fallback to suit/rank)
export const isSameCard = (card1, card2) => {
  if (card1.id && card2.id) {
    return card1.id === card2.id;
  }
  return card1.suit === card2.suit && card1.rank === card2.rank;
};

// Frontend counter draw validation
export const canCounterDrawFrontend = (card, topCard) => {
  if (!topCard) return false;
  
  if (topCard.rank === 'Ace') {
    return card.rank === 'Ace' || (card.rank === '2' && card.suit === topCard.suit);
  }
  if (topCard.rank === '2') {
    return card.rank === '2' || (card.rank === 'Ace' && card.suit === topCard.suit);
  }
  
  return false;
};

// Get valid cards for selection based on game state
export const getValidCardsForSelection = (playerHand, gameState, selectedCards, topCard) => {
  if (!gameState || playerHand.length === 0) return [];
  
  let valid = [];
  const activePlayers = gameState.players?.length || 2;

  if (selectedCards.length === 0) {
    // No cards selected - show cards that can be played as bottom card
    valid = playerHand.filter(card => {
      // When there's a draw stack, ONLY counter cards are valid (no 8s allowed)
      if (gameState.drawStack > 0) {
        return canCounterDrawFrontend(card, topCard);
      }
      
      // 8s can be played on anything (except when draw stack is present)
      if (card.rank === '8') return true;
      
      const suitToMatch = gameState.declaredSuit || topCard.suit;
      return card.suit === suitToMatch || card.rank === topCard.rank;
    });
  } else {
    // Cards already selected - show stackable cards
    valid = playerHand.filter(card => {
      // Already selected cards are always "valid" for reordering
      const isSelected = selectedCards.some(sc => isSameCard(sc, card));
      if (isSelected) return true;
      
      // Check if this card can be stacked with the current selection using proper validation
      return canStackCardsFrontend(selectedCards, card, activePlayers);
    });
  }
  
  console.log('🎯 Frontend: Valid cards calculated:', valid.length, 'out of', playerHand.length);
  console.log('🎯 Frontend: Selected cards:', selectedCards.length);
  console.log('🎯 Frontend: Draw stack:', gameState.drawStack);
  
  return valid;
};