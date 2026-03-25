import { useEffect } from 'react';
import { fireConfetti } from '../utils/animationUtils';

/**
 * Custom hook that manages all socket event listeners for the game.
 * Extracted from GameApp to reduce component complexity.
 */
const useSocketEvents = ({
  socket,
  gameState,
  playerId,
  isAuthenticated,
  playerIdRef,
  hasDrawnThisTurnRef,
  addToast,
  setGameState,
  setPlayerHand,
  setHasDrawnThisTurn,
  setIsDrawing,
  setIsSkipping,
  setSelectedCards,
  setPlayAgainVotes,
  setRoundEndData,
  setShowRoundEndModal,
  setNextRoundTimer,
  setTournamentWinnerData,
  setShowTournamentWinnerModal,
  setShowAuthModal,
  setTournamentStatus,
  setGlobalTimer,
  setPlayerName,
  authMigrateSettings,
}) => {
  // Game event handlers
  useEffect(() => {
    if (!socket) return;

    const handleGameUpdate = (data) => {
      if (data.currentPlayerId !== playerIdRef.current) {
        setHasDrawnThisTurn(false);
        setIsDrawing(false);
      } else {
        const hasDrawnAccordingToServer = data.playersWhoHaveDrawn?.includes(playerIdRef.current) || false;
        setHasDrawnThisTurn(hasDrawnAccordingToServer);
      }

      if (data.gameState === 'finished' && gameState?.gameState !== 'finished') {
        const winner = data.players.find(p => !p.isEliminated);
        if (winner && winner.id === playerIdRef.current) {
          fireConfetti();
        }

        setPlayAgainVotes({
          votedPlayers: [],
          totalPlayers: data.players.filter(p => p.isConnected).length,
          allVoted: false,
          creatorVoted: false,
          canStartGame: false,
          gameCreator: data.players[0]?.id || null
        });
      }

      setGameState(data);
    };

    const handleHandUpdate = (hand) => {
      setPlayerHand(hand);
    };

    const handleError = (errorMsg) => {
      if (errorMsg.includes('Not your turn') && hasDrawnThisTurnRef.current) {
        return;
      }
      addToast(errorMsg, 'error');
    };

    const handleSuccess = (successMsg) => {
      addToast(successMsg, 'success');
    };

    const handleCardPlayed = (data) => {
      if (data.playerId !== socket.id) {
        addToast(`${data.playerName}: ${data.message}`, 'info');
      }
    };

    const handleNewDeckAdded = (data) => {
      addToast(data.message, 'info');
    };

    const handlePlayerDrewCards = (data) => {
      let message = '';
      if (data.fromPenalty) {
        message = `${data.playerName} drew ${data.cardCount} penalty cards`;
      } else {
        message = `${data.playerName} drew ${data.cardCount} card(s)`;
      }

      if (data.newDeckAdded) {
        message += ' NEW';
      }

      addToast(message, 'info');
    };

    const handleDrawComplete = (data) => {
      setIsDrawing(false);
      setHasDrawnThisTurn(true);

      if (data.canPlayDrawnCard && data.playableDrawnCards.length > 0) {
        addToast(
          `Drew ${data.drawnCards.length} cards. ${data.playableDrawnCards.length} can be played!`,
          'info'
        );
      } else {
        addToast(
          `Drew ${data.drawnCards.length} cards.`,
          'info'
        );
      }
    };

    const handlePlayerPassedTurn = (data) => {
      addToast(`${data.playerName} passed their turn`, 'info');
    };

    const handleTimerUpdate = (timerData) => {
      setGlobalTimer({
        timeLeft: timerData.timeLeft,
        isWarning: timerData.isWarning,
        isActive: true
      });
    };

    const handlePlayAgainError = (errorMsg) => {
      addToast(`Failed to start new game: ${errorMsg}`, 'error');
    };

    const handlePlayAgainVoteUpdate = (voteData) => {
      setPlayAgainVotes({
        votedPlayers: voteData.votedPlayers || [],
        totalPlayers: voteData.totalPlayers || 0,
        allVoted: voteData.allVoted || false,
        creatorVoted: voteData.creatorVoted || false,
        canStartGame: voteData.canStartGame || false,
        gameCreator: voteData.gameCreator || null
      });

      const lastVoter = voteData.votedPlayers[voteData.votedPlayers.length - 1];
      if (lastVoter && lastVoter.id !== playerIdRef.current) {
        addToast(`${lastVoter.name} voted to play again (${voteData.votedPlayers.length}/${voteData.totalPlayers})`, 'info');
      }
    };

    const handleNewGameStarted = (data) => {
      setSelectedCards([]);
      setHasDrawnThisTurn(false);
      setIsDrawing(false);
      setIsSkipping(false);

      setPlayAgainVotes({
        votedPlayers: [],
        totalPlayers: 0,
        allVoted: false,
        creatorVoted: false,
        canStartGame: false,
        gameCreator: null
      });

      addToast(`${data.message} Started by ${data.startedBy}`, 'success');
    };

    const handlePlayerSafe = (data) => {
      addToast(`${data.message}`, 'success');
      if (data.playerId === playerIdRef.current) {
        fireConfetti();
      }
    };

    const handleRoundEnded = (data) => {
      setRoundEndData(data);
      setShowRoundEndModal(true);
      setNextRoundTimer(data.nextRoundStartsIn);

      const timer = setInterval(() => {
        setNextRoundTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowRoundEndModal(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleTournamentFinished = (data) => {
      setTournamentWinnerData(data);
      setShowTournamentWinnerModal(true);
      addToast(`${data.message}`, 'success');

      if (data.winnerId === playerIdRef.current) {
        fireConfetti();

        if (!isAuthenticated) {
          setTimeout(() => {
            const shouldCreateAccount = window.confirm(
              '🎉 Congratulations on winning!\n\n' +
              'Want to save this victory?\n' +
              'Create an account to:\n' +
              '• Track your wins and achievements\n' +
              '• Build your gaming statistics\n' +
              '• Show off your victories to friends\n\n' +
              'Create account now?'
            );

            if (shouldCreateAccount) {
              setShowAuthModal(true);
            }
          }, 2000);
        }
      } else {
        if (!isAuthenticated) {
          setTimeout(() => {
            const shouldCreateAccount = window.confirm(
              'Great game!\n\n' +
              'Want to track your gaming progress?\n' +
              'Create an account to:\n' +
              '• Save your game statistics\n' +
              '• Track improvements over time\n' +
              '• Unlock achievements\n\n' +
              'Create account now?'
            );

            if (shouldCreateAccount) {
              setShowAuthModal(true);
            }
          }, 3000);
        }
      }
    };

    const handleTournamentStatus = (data) => {
      setTournamentStatus(data);
    };

    const handleRoundStarted = (data) => {
      addToast(`${data.message}`, 'success');
      setShowRoundEndModal(false);
      setNextRoundTimer(0);
    };

    // Register all event handlers
    socket.on('gameUpdate', handleGameUpdate);
    socket.on('handUpdate', handleHandUpdate);
    socket.on('error', handleError);
    socket.on('success', handleSuccess);
    socket.on('cardPlayed', handleCardPlayed);
    socket.on('newDeckAdded', handleNewDeckAdded);
    socket.on('playerDrewCards', handlePlayerDrewCards);
    socket.on('drawComplete', handleDrawComplete);
    socket.on('playerPassedTurn', handlePlayerPassedTurn);
    socket.on('timerUpdate', handleTimerUpdate);
    socket.on('playAgainError', handlePlayAgainError);
    socket.on('playAgainVoteUpdate', handlePlayAgainVoteUpdate);
    socket.on('newGameStarted', handleNewGameStarted);
    socket.on('playerSafe', handlePlayerSafe);
    socket.on('roundEnded', handleRoundEnded);
    socket.on('tournamentFinished', handleTournamentFinished);
    socket.on('tournamentStatus', handleTournamentStatus);
    socket.on('roundStarted', handleRoundStarted);

    return () => {
      socket.off('gameUpdate', handleGameUpdate);
      socket.off('handUpdate', handleHandUpdate);
      socket.off('error', handleError);
      socket.off('success', handleSuccess);
      socket.off('cardPlayed', handleCardPlayed);
      socket.off('newDeckAdded', handleNewDeckAdded);
      socket.off('playerDrewCards', handlePlayerDrewCards);
      socket.off('drawComplete', handleDrawComplete);
      socket.off('playerPassedTurn', handlePlayerPassedTurn);
      socket.off('timerUpdate', handleTimerUpdate);
      socket.off('playAgainError', handlePlayAgainError);
      socket.off('playAgainVoteUpdate', handlePlayAgainVoteUpdate);
      socket.off('newGameStarted', handleNewGameStarted);
      socket.off('playerSafe', handlePlayerSafe);
      socket.off('roundEnded', handleRoundEnded);
      socket.off('tournamentFinished', handleTournamentFinished);
      socket.off('tournamentStatus', handleTournamentStatus);
      socket.off('roundStarted', handleRoundStarted);
    };
  }, [socket, gameState, playerId, isAuthenticated, addToast, playerIdRef, setHasDrawnThisTurn, setIsDrawing, setIsSkipping, setSelectedCards, setGameState, setPlayerHand, hasDrawnThisTurnRef, setPlayAgainVotes, setRoundEndData, setShowRoundEndModal, setNextRoundTimer, setTournamentWinnerData, setShowTournamentWinnerModal, setShowAuthModal, setTournamentStatus, setGlobalTimer]);

  // Authentication event handlers
  useEffect(() => {
    if (!socket) return;

    const handleAuthenticated = (data) => {
      if (data.user) {
        setPlayerName(data.user.displayName || data.user.username);
        if (playerId) {
          authMigrateSettings(playerId);
        }
      }
    };

    const handleGuestConnected = () => {};
    const handleConnectSuccess = () => {};

    socket.on('authenticated', handleAuthenticated);
    socket.on('guest_connected', handleGuestConnected);
    socket.on('connect_success', handleConnectSuccess);

    return () => {
      socket.off('authenticated', handleAuthenticated);
      socket.off('guest_connected', handleGuestConnected);
      socket.off('connect_success', handleConnectSuccess);
    };
  }, [socket, playerId, authMigrateSettings, setPlayerName]);
};

export default useSocketEvents;
