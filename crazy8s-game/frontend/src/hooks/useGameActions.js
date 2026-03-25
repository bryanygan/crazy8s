import { useCallback, useRef } from 'react';
import {
  validateCardStackFrontend,
  canStackCardsFrontend
} from '../utils/cardValidation';
import { isSameCard, getValidCardsForSelection } from '../utils/cardUtils';

/**
 * Custom hook that provides all game action handlers.
 * Extracted from GameApp to reduce component complexity.
 */
const useGameActions = ({
  socket,
  gameState,
  playerId,
  playerHand,
  selectedCards,
  settings,
  isMyTurn,
  hasDrawnThisTurn,
  isDrawing,
  isSkipping,
  lastActionTime,
  playAgainVotes,
  addToast,
  setSelectedCards,
  setShowSuitSelector,
  setHasDrawnThisTurn,
  setIsDrawing,
  setIsSkipping,
  setLastActionTime,
}) => {
  const lastSkipTimeRef = useRef(0);

  const parseTopCard = useCallback((cardString) => {
    if (!cardString) return null;
    const parts = cardString.split(' of ');
    if (parts.length !== 2) return null;
    return { rank: parts[0], suit: parts[1] };
  }, []);

  const handleCardSelect = useCallback((card) => {
    if (!isMyTurn) {
      addToast('⏳ Wait for your turn to select cards', 'warning');
      return;
    }

    const isSelected = selectedCards.some(sc => isSameCard(sc, card));

    if (isSelected) {
      if (selectedCards.length === 1) {
        setSelectedCards([]);
      } else {
        setSelectedCards(prev => prev.filter(sc => !isSameCard(sc, card)));
      }
    } else {
      if (selectedCards.length === 0) {
        setSelectedCards([card]);
      } else {
        const activePlayers = gameState?.players?.length || 2;

        if (canStackCardsFrontend(selectedCards, card, activePlayers)) {
          setSelectedCards(prev => [...prev, card]);
        } else {
          const validation = validateCardStackFrontend([...selectedCards, card], activePlayers);
          addToast(validation.error || `Cannot stack ${card.rank} of ${card.suit} with current selection.`, 'error');
        }
      }
    }
  }, [isMyTurn, selectedCards, gameState, addToast, setSelectedCards]);

  const playSelectedCards = useCallback(() => {
    if (selectedCards.length === 0) {
      addToast('Please select at least one card', 'error');
      return;
    }

    if (!isMyTurn) {
      addToast('⏳ Wait for your turn to play cards', 'warning');
      return;
    }

    const topCard = parseTopCard(gameState.topCard);
    if (!topCard) {
      addToast('Unable to determine current top card', 'error');
      return;
    }

    const validCards = getValidCardsForSelection(playerHand, gameState, selectedCards, topCard);
    const allSelectedAreValid = selectedCards.every(selectedCard =>
      validCards.some(validCard => validCard.id === selectedCard.id)
    );

    if (!allSelectedAreValid) {
      addToast('Selected cards are no longer valid - game state has changed', 'error');
      setSelectedCards([]);
      return;
    }

    const activePlayers = gameState?.players?.length || 2;
    const validation = validateCardStackFrontend(selectedCards, activePlayers);

    if (!validation.isValid) {
      addToast(validation.error, 'error');
      return;
    }

    const hasWild = selectedCards.some(card => card.rank === '8');

    if (hasWild) {
      const wildValidation = validateCardStackFrontend(selectedCards, activePlayers);
      if (!wildValidation.isValid) {
        addToast(wildValidation.error, 'error');
        return;
      }
      setShowSuitSelector(true);
    } else {
      socket.emit('playCard', {
        gameId: gameState?.gameId,
        cards: selectedCards,
        timerSettings: {
          enableTimer: settings.enableTimer,
          timerDuration: settings.timerDuration,
          timerWarningTime: settings.timerWarningTime
        }
      });
      setSelectedCards([]);
      setHasDrawnThisTurn(false);
      setIsDrawing(false);
    }
  }, [selectedCards, isMyTurn, gameState, playerHand, socket, settings, addToast, setSelectedCards, setShowSuitSelector, setHasDrawnThisTurn, setIsDrawing, parseTopCard]);

  const handleSuitSelect = useCallback((suit) => {
    socket.emit('playCard', {
      gameId: gameState?.gameId,
      cards: selectedCards,
      declaredSuit: suit,
      timerSettings: {
        enableTimer: settings.enableTimer,
        timerDuration: settings.timerDuration,
        timerWarningTime: settings.timerWarningTime
      }
    });
    setSelectedCards([]);
    setShowSuitSelector(false);
    setHasDrawnThisTurn(false);
    setIsDrawing(false);
  }, [socket, gameState, selectedCards, settings, setSelectedCards, setShowSuitSelector, setHasDrawnThisTurn, setIsDrawing]);

  const drawCard = useCallback(() => {
    const now = Date.now();

    if (now - lastActionTime < 1000) {
      return;
    }

    if (!isMyTurn) {
      return;
    }

    if (isDrawing || hasDrawnThisTurn) {
      addToast('You have already drawn cards this turn', 'error');
      return;
    }

    setLastActionTime(now);
    setIsDrawing(true);
    socket.emit('drawCard', {
      gameId: gameState?.gameId,
      timerSettings: {
        enableTimer: settings.enableTimer,
        timerDuration: settings.timerDuration,
        timerWarningTime: settings.timerWarningTime
      }
    });
  }, [lastActionTime, isMyTurn, isDrawing, hasDrawnThisTurn, socket, gameState, settings, addToast, setLastActionTime, setIsDrawing]);

  const skipTurn = useCallback(() => {
    const now = Date.now();

    if (now - lastSkipTimeRef.current < 2000) {
      return;
    }

    if (isSkipping) {
      return;
    }

    if (!isMyTurn) {
      return;
    }

    if (!hasDrawnThisTurn && gameState.pendingTurnPass !== playerId) {
      addToast('You must draw a card before skipping your turn', 'error');
      return;
    }

    lastSkipTimeRef.current = now;
    setIsSkipping(true);

    socket.emit('passTurnAfterDraw', {
      gameId: gameState?.gameId,
      timerSettings: {
        enableTimer: settings.enableTimer,
        timerDuration: settings.timerDuration,
        timerWarningTime: settings.timerWarningTime
      }
    });

    setHasDrawnThisTurn(false);
    setIsDrawing(false);

    setTimeout(() => setIsSkipping(false), 1000);
  }, [isSkipping, isMyTurn, hasDrawnThisTurn, gameState, playerId, socket, settings, addToast, setIsSkipping, setHasDrawnThisTurn, setIsDrawing]);

  const handlePlayAgainVote = useCallback(() => {
    if (!socket || !gameState?.gameId) {
      addToast('Cannot vote for new game - no active game found', 'error');
      return;
    }

    const hasVoted = playAgainVotes.votedPlayers.some(p => p.id === playerId);

    if (hasVoted) {
      socket.emit('removePlayAgainVote', { gameId: gameState.gameId });
    } else {
      socket.emit('votePlayAgain', { gameId: gameState.gameId });
    }
  }, [socket, gameState, playerId, playAgainVotes, addToast]);

  const handleStartNextRound = useCallback(() => {
    if (!socket || !gameState?.gameId) {
      addToast('Cannot start next round - no active game found', 'error');
      return;
    }

    socket.emit('startNextRound', { gameId: gameState.gameId });
  }, [socket, gameState, addToast]);

  const handleStartNewGame = useCallback(() => {
    if (!socket || !gameState?.gameId) {
      addToast('Cannot start new game - no active game found', 'error');
      return;
    }

    if (playerId !== playAgainVotes.gameCreator) {
      addToast('Only the game creator can start the new game', 'error');
      return;
    }

    if (!playAgainVotes.canStartGame) {
      addToast('Cannot start game - not all players have voted', 'error');
      return;
    }

    socket.emit('startNewGame', { gameId: gameState.gameId });
    addToast('Starting new game...', 'info');
  }, [socket, gameState, playerId, playAgainVotes, addToast]);

  return {
    handleCardSelect,
    playSelectedCards,
    handleSuitSelect,
    drawCard,
    skipTurn,
    handlePlayAgainVote,
    handleStartNextRound,
    handleStartNewGame,
    parseTopCard,
  };
};

export default useGameActions;
