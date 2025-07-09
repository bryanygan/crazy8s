// Utility functions for card validation logic

// Fixed simulateTurnControlFrontend function for App.js
const simulateTurnControlFrontend = (cardStack, activePlayers = 2) => {
  if (cardStack.length === 0) return true;

  const playerCount = activePlayers;

  console.log(`🔍 Frontend simulateTurnControl: [${cardStack.map(c => c.rank + c.suit[0]).join(', ')}] with ${playerCount} players`);

  // Check if this is a pure Jack stack in a 2-player game
  const isPureJackStack = cardStack.every(card => card.rank === 'Jack');
  const is2PlayerGame = playerCount === 2;

  if (isPureJackStack && is2PlayerGame) {
    console.log('🎯 Frontend: Pure Jack stack in 2-player game - original player keeps turn');
    return true; // Original player always keeps turn
  }

  // CORRECTED LOGIC: Check what the stack ends with
  // The final turn control is determined by the nature of the ending cards

  // Find the last card and check if it's a turn-passing type
  const lastCard = cardStack[cardStack.length - 1];
  const normalCardRanks = ['3', '4', '5', '6', '7', '9', '10', 'King'];
  const drawCardRanks = ['2', 'Ace']; // These pass turn but have draw effects
  const wildCardRanks = ['8']; // These pass turn but change suit

  // If stack ends with normal/draw/wild cards, turn passes regardless of earlier cards
  if (normalCardRanks.includes(lastCard.rank) ||
      drawCardRanks.includes(lastCard.rank) ||
      wildCardRanks.includes(lastCard.rank)) {
    console.log(`🔍 Frontend: Stack ends with turn-passing card (${lastCard.rank}) - turn passes`);
    return false;
  }

  // If we reach here, stack ends with Jack or Queen - need to analyze the special card effects

  // Count Queens in the entire stack for even/odd logic
  let queenCount = 0;
  let jackCount = 0;

  for (const card of cardStack) {
    if (card.rank === 'Queen') queenCount++;
    if (card.rank === 'Jack') jackCount++;
  }

  console.log(`🔍 Frontend: Special cards in stack: Jacks=${jackCount}, Queens=${queenCount}`);

  if (is2PlayerGame) {
    // 2-player logic for stacks ending with special cards

    if (queenCount > 0) {
      // Queen logic: even count = keep turn, odd count = pass turn
      const queenKeepsTurn = (queenCount % 2 === 0);
      console.log(`🔍 Frontend: 2-player Queens: ${queenCount} → ${queenKeepsTurn ? 'keep turn' : 'pass turn'}`);
      return queenKeepsTurn;
    }

    if (jackCount > 0) {
      // Pure Jack effect (since no Queens and no normal cards at end)
      console.log(`🔍 Frontend: 2-player: Stack ends with Jack(s) → keep turn`);
      return true;
    }
  } else {
    // 3+ player logic: even Queens = keep turn, odd Queens = pass turn
    if (queenCount > 0) {
      const queenKeepsTurn = (queenCount % 2 === 0);
      console.log(`🔍 Frontend: 3+ player Queens: ${queenCount} → ${queenKeepsTurn ? 'keep turn' : 'pass turn'}`);
      return queenKeepsTurn;
    }

    if (jackCount > 0) {
      // Pure Jack effect keeps turn
      console.log(`🔍 Frontend: 3+ player: Stack ends with Jack(s) → keep turn`);
      return true;
    }

    // No special cards at end of stack
    console.log(`🔍 Frontend: 3+ player: No special cards at end → pass turn`);
    return false;
  }

  // Fallback
  console.log(`🔍 Frontend: Fallback: pass turn`);
  return false;
};

// Frontend card stack validation (matching backend logic)
const validateCardStackFrontend = (cards, activePlayers = 2) => {
  if (cards.length <= 1) {
    return { isValid: true };
  }

  console.log('🔍 Frontend: Validating card stack:', cards.map(c => `${c.rank} of ${c.suit}`));

  // Check each card-to-card transition in the stack
  for (let i = 1; i < cards.length; i++) {
    const prevCard = cards[i - 1];
    const currentCard = cards[i];

    console.log(`  Frontend: Checking transition: ${prevCard.rank} of ${prevCard.suit} → ${currentCard.rank} of ${currentCard.suit}`);

    // Cards must match by suit or rank
    const matchesSuit = prevCard.suit === currentCard.suit;
    const matchesRank = prevCard.rank === currentCard.rank;

    // Special case: Aces and 2s can stack with each other if same suit
    const isAce2Cross = (
      (prevCard.rank === 'Ace' && currentCard.rank === '2') ||
      (prevCard.rank === '2' && currentCard.rank === 'Ace')
    ) && prevCard.suit === currentCard.suit;

    // Special case for 8s - if turn control is maintained, 8s can be played regardless of suit
    const is8WithTurnControl = currentCard.rank === '8' &&
      simulateTurnControlFrontend(cards.slice(0, i), activePlayers);

    console.log(`    Frontend: Matches suit: ${matchesSuit}, Matches rank: ${matchesRank}, Ace/2 cross: ${isAce2Cross}, 8 with turn control: ${is8WithTurnControl}`);

    // Basic matching requirement (now includes 8s with turn control)
    if (!matchesSuit && !matchesRank && !isAce2Cross && !is8WithTurnControl) {
      console.log(`    ❌ Frontend: Invalid transition - no suit/rank match and no 8 flexibility!`);
      return {
        isValid: false,
        error: `Cannot stack ${currentCard.rank} of ${currentCard.suit} after ${prevCard.rank} of ${prevCard.suit}. Cards must match suit or rank${currentCard.rank === '8' ? ', or 8s can be played if you maintain turn control' : ''}.`
      };
    }

    // If cards match by rank, always allow (this is standard stacking)
    if (matchesRank || isAce2Cross) {
      console.log(`    ✅ Frontend: Valid transition - same rank or Ace/2 cross-stack`);
      continue;
    }

    // If it's an 8 with turn control, allow it
    if (is8WithTurnControl) {
      console.log(`    ✅ Frontend: Valid transition - 8 played with maintained turn control`);
      continue;
    }

    // If cards only match by suit (different ranks),
    // we need to validate the entire turn control chain up to this point
    if (matchesSuit && !matchesRank) {
      console.log(`    Frontend: Same suit, different rank - checking turn control logic`);

      // For same-suit different-rank transitions, we need to validate that
      // the player would maintain turn control after playing all cards UP TO AND INCLUDING the previous card
      const stackUpToPrevious = cards.slice(0, i);
      const wouldHaveTurnControl = simulateTurnControlFrontend(stackUpToPrevious, activePlayers);

      console.log(`    Frontend: Turn control after previous cards: ${wouldHaveTurnControl}`);

      if (!wouldHaveTurnControl) {
        console.log(`    ❌ Frontend: Invalid transition - no turn control after previous cards!`);
        return {
          isValid: false,
          error: `Cannot stack ${currentCard.rank} of ${currentCard.suit} after ${prevCard.rank} of ${prevCard.suit}. You don't maintain turn control after playing the previous cards in the sequence.`
        };
      }

      console.log(`    ✅ Frontend: Valid transition - turn control maintained`);
    }
  }

  console.log('✅ Frontend: Stack validation passed');
  return { isValid: true };
};

// Enhanced card stacking check for frontend
const canStackCardsFrontend = (existingCards, newCard, activePlayers = 2) => {
  const testStack = [...existingCards, newCard];
  const validation = validateCardStackFrontend(testStack, activePlayers);

  // If validation passes, also log why for debugging
  if (validation.isValid && existingCards.length > 0) {
    const lastCard = existingCards[existingCards.length - 1];
    const matchesSuit = lastCard.suit === newCard.suit;
    const matchesRank = lastCard.rank === newCard.rank;
    const isAce2Cross = (
      (lastCard.rank === 'Ace' && newCard.rank === '2') ||
      (lastCard.rank === '2' && newCard.rank === 'Ace')
    ) && lastCard.suit === newCard.suit;
    const is8WithTurnControl = newCard.rank === '8' &&
      simulateTurnControlFrontend(existingCards, activePlayers);

    console.log(`🎯 Frontend canStack: ${newCard.rank}${newCard.suit[0]} after [${existingCards.map(c => `${c.rank}${c.suit[0]}`).join(', ')}]`);
    console.log(`   Reasons: suit=${matchesSuit}, rank=${matchesRank}, ace2=${isAce2Cross}, 8+control=${is8WithTurnControl}`);
  }

  return validation.isValid;
};

export { simulateTurnControlFrontend, validateCardStackFrontend, canStackCardsFrontend };

