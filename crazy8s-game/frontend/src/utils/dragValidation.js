// Comprehensive drag and drop validation utilities

/**
 * Validates that dragged cards are correct based on the clicked card and selection state
 * @param {Object} clickedCard - The card that was clicked to start the drag
 * @param {Array} selectedCards - Currently selected cards
 * @param {Array} draggedCards - Cards that are being dragged
 * @param {boolean} isClickedCardSelected - Whether the clicked card is selected
 * @returns {Object} - Validation result with isValid boolean and error message
 */
export const validateDraggedCards = (clickedCard, selectedCards, draggedCards, isClickedCardSelected) => {
  console.log('🔍 DRAG VALIDATION:', {
    clickedCard: `${clickedCard.rank}${clickedCard.suit[0]}`,
    selectedCardsCount: selectedCards.length,
    draggedCardsCount: draggedCards.length,
    isClickedCardSelected
  });

  // Basic validation
  if (!clickedCard || !draggedCards || draggedCards.length === 0) {
    return {
      isValid: false,
      error: 'Invalid drag parameters'
    };
  }

  // Case 1: Clicked card is selected and there are multiple selected cards
  if (isClickedCardSelected && selectedCards.length > 1) {
    // Should drag all selected cards
    if (draggedCards.length !== selectedCards.length) {
      return {
        isValid: false,
        error: `Expected ${selectedCards.length} cards but got ${draggedCards.length} - multi-card selection mismatch`
      };
    }

    // Verify all selected cards are in dragged cards
    for (const selectedCard of selectedCards) {
      const found = draggedCards.some(draggedCard => 
        draggedCard.id === selectedCard.id || 
        (draggedCard.suit === selectedCard.suit && draggedCard.rank === selectedCard.rank)
      );
      if (!found) {
        return {
          isValid: false,
          error: `Selected card ${selectedCard.rank}${selectedCard.suit[0]} not found in dragged cards`
        };
      }
    }

    return { isValid: true, scenario: 'multi-card-selection' };
  }

  // Case 2: Clicked card is selected and it's the only selected card
  if (isClickedCardSelected && selectedCards.length === 1) {
    if (draggedCards.length !== 1) {
      return {
        isValid: false,
        error: `Expected 1 card but got ${draggedCards.length} - single selection mismatch`
      };
    }

    const draggedCard = draggedCards[0];
    if (draggedCard.id !== clickedCard.id && 
        (draggedCard.suit !== clickedCard.suit || draggedCard.rank !== clickedCard.rank)) {
      return {
        isValid: false,
        error: `Dragged card ${draggedCard.rank}${draggedCard.suit[0]} does not match clicked card`
      };
    }

    return { isValid: true, scenario: 'single-card-selection' };
  }

  // Case 3: Clicked card is NOT selected (should only drag the clicked card)
  if (!isClickedCardSelected) {
    if (draggedCards.length !== 1) {
      return {
        isValid: false,
        error: `Expected 1 card for unselected drag but got ${draggedCards.length}`
      };
    }

    const draggedCard = draggedCards[0];
    if (draggedCard.id !== clickedCard.id && 
        (draggedCard.suit !== clickedCard.suit || draggedCard.rank !== clickedCard.rank)) {
      return {
        isValid: false,
        error: `Dragged card ${draggedCard.rank}${draggedCard.suit[0]} does not match clicked card`
      };
    }

    // CRITICAL: If there are other selected cards, warn about potential confusion
    if (selectedCards.length > 0) {
      console.warn('⚠️ VALIDATION WARNING: Dragging unselected card while other cards are selected:', {
        clickedCard: `${clickedCard.rank}${clickedCard.suit[0]}`,
        selectedCards: selectedCards.map(c => `${c.rank}${c.suit[0]}`)
      });
    }

    return { isValid: true, scenario: 'unselected-card-drag' };
  }

  return {
    isValid: false,
    error: 'Unknown drag scenario'
  };
};

/**
 * Validates that cards being played actually exist in the player's hand
 * @param {Array} cardsToPlay - Cards attempting to be played
 * @param {Array} playerHand - Current cards in player's hand
 * @returns {Object} - Validation result
 */
export const validateCardsInHand = (cardsToPlay, playerHand) => {
  console.log('🔍 HAND VALIDATION:', {
    cardsToPlay: cardsToPlay.map(c => `${c.rank}${c.suit[0]}`),
    handSize: playerHand.length
  });

  if (!cardsToPlay || cardsToPlay.length === 0) {
    return { isValid: false, error: 'No cards to validate' };
  }

  const invalidCards = [];
  for (const cardToPlay of cardsToPlay) {
    const found = playerHand.some(handCard => 
      handCard.id === cardToPlay.id || 
      (handCard.suit === cardToPlay.suit && handCard.rank === cardToPlay.rank)
    );
    if (!found) {
      invalidCards.push(cardToPlay);
    }
  }

  if (invalidCards.length > 0) {
    return {
      isValid: false,
      error: `Cards not in hand: ${invalidCards.map(c => `${c.rank}${c.suit[0]}`).join(', ')}`
    };
  }

  return { isValid: true };
};

/**
 * Validates the overall drop operation
 * @param {string} zoneId - Drop zone identifier
 * @param {Array} draggedCards - Cards being dropped
 * @param {Array} validDropZones - List of valid drop zone IDs
 * @returns {Object} - Validation result
 */
export const validateDropOperation = (zoneId, draggedCards, validDropZones = ['discard-pile']) => {
  console.log('🔍 DROP OPERATION VALIDATION:', {
    zoneId,
    draggedCardsCount: draggedCards?.length,
    validZones: validDropZones
  });

  if (!zoneId) {
    return { isValid: false, error: 'No drop zone specified' };
  }

  if (!validDropZones.includes(zoneId)) {
    return { isValid: false, error: `Invalid drop zone: ${zoneId}` };
  }

  if (!draggedCards || draggedCards.length === 0) {
    return { isValid: false, error: 'No cards to drop' };
  }

  // Validate card structure
  for (let i = 0; i < draggedCards.length; i++) {
    const card = draggedCards[i];
    if (!card || !card.suit || !card.rank) {
      return { isValid: false, error: `Invalid card at index ${i}` };
    }
  }

  return { isValid: true };
};

/**
 * Comprehensive validation for the entire drag-drop flow
 * @param {Object} params - All validation parameters
 * @returns {Object} - Complete validation result
 */
export const validateCompleteDragDrop = ({
  clickedCard,
  selectedCards,
  draggedCards,
  isClickedCardSelected,
  playerHand,
  dropZoneId,
  validDropZones
}) => {
  // Step 1: Validate dragged cards match selection logic
  const dragValidation = validateDraggedCards(
    clickedCard, 
    selectedCards, 
    draggedCards, 
    isClickedCardSelected
  );
  if (!dragValidation.isValid) {
    return { isValid: false, step: 'drag', ...dragValidation };
  }

  // Step 2: Validate cards exist in hand
  const handValidation = validateCardsInHand(draggedCards, playerHand);
  if (!handValidation.isValid) {
    return { isValid: false, step: 'hand', ...handValidation };
  }

  // Step 3: Validate drop operation
  const dropValidation = validateDropOperation(dropZoneId, draggedCards, validDropZones);
  if (!dropValidation.isValid) {
    return { isValid: false, step: 'drop', ...dropValidation };
  }

  return { 
    isValid: true, 
    scenario: dragValidation.scenario,
    message: `Valid ${dragValidation.scenario} with ${draggedCards.length} cards` 
  };
};