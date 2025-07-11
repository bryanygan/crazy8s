import { useEffect, useRef } from 'react';
import { useConnection } from '../contexts/ConnectionContext';

export const useReconnectionHandler = ({
  gameState,
  playerId,
  isMyTurn,
  addToast,
  setSelectedCards,
  setHasDrawnThisTurn,
  setIsDrawing,
  setIsSkipping
}) => {
  const { addConnectionListener, socket, storeSessionData, validateSession, sessionValid } = useConnection();
  const previousConnectionStateRef = useRef(false);
  const gameStateBeforeDisconnectRef = useRef(null);
  const wasMyTurnBeforeDisconnectRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);
  const sessionValidationTimeoutRef = useRef(null);

  useEffect(() => {
    const handleConnectionEvent = (event, data = {}) => {
      switch (event) {
        case 'disconnected':
          if (!data.planned) {
            // Store game state before disconnect for restoration
            gameStateBeforeDisconnectRef.current = gameState;
            wasMyTurnBeforeDisconnectRef.current = isMyTurn;
            
            console.log('🎮 Connection lost during game - storing state for restoration');
            console.log('  📊 Game State:', gameState?.gameState);
            console.log('  🎯 Was My Turn:', isMyTurn);
            
            // Show appropriate message based on game state
            if (gameState?.gameState === 'playing') {
              if (isMyTurn) {
                addToast('🔌 Connection lost during your turn - reconnecting...', 'warning');
              } else {
                addToast('🔌 Connection lost - reconnecting...', 'warning');
              }
            } else if (gameState?.gameState === 'waiting') {
              addToast('🔌 Connection lost while waiting - reconnecting...', 'warning');
            } else {
              addToast('🔌 Connection lost - reconnecting...', 'warning');
            }
          }
          break;

        case 'reconnected':
          console.log('🎮 Reconnected - restoring game state');
          
          // Clear any temporary UI states that might be stuck
          setSelectedCards([]);
          setIsDrawing(false);
          setIsSkipping(false);
          
          // Show reconnection success message
          const attemptText = data.attempts > 1 ? ` after ${data.attempts} attempts` : '';
          addToast(`✅ Reconnected${attemptText}`, 'success');
          
          // Store current session data for validation
          if (gameState && playerId) {
            storeSessionData({
              gameId: gameState.gameId,
              playerId,
              gameState: gameState.gameState,
              playerCount: gameState.players?.length || 0
            });
          }
          
          // Handle session validation after reconnect
          if (sessionValidationTimeoutRef.current) {
            clearTimeout(sessionValidationTimeoutRef.current);
          }
          
          sessionValidationTimeoutRef.current = setTimeout(async () => {
            if (socket && socket.connected) {
              const isValidSession = await validateSession(socket);
              if (!isValidSession) {
                addToast('⚠️ Session validation failed - some features may not work', 'warning');
              }
            }
          }, 2000);
          
          // Handle specific reconnection scenarios
          if (gameStateBeforeDisconnectRef.current) {
            const previousState = gameStateBeforeDisconnectRef.current;
            const wasMyTurnBefore = wasMyTurnBeforeDisconnectRef.current;
            
            if (previousState.gameState === 'playing') {
              if (wasMyTurnBefore) {
                // Player was in the middle of their turn
                addToast('🎯 Restored to your turn - you may continue playing', 'info');
                
                // Reset draw state since we don't know what happened during disconnect
                setHasDrawnThisTurn(false);
              } else {
                // Player was waiting for their turn
                addToast('⏳ Restored - waiting for your turn', 'info');
              }
            } else if (previousState.gameState === 'waiting') {
              addToast('🕓 Restored - still waiting for game to start', 'info');
            } else if (previousState.gameState === 'finished') {
              addToast('🏁 Restored - game had finished', 'info');
            }
            
            // Clear stored state
            gameStateBeforeDisconnectRef.current = null;
            wasMyTurnBeforeDisconnectRef.current = false;
          }
          break;

        case 'reconnect_failed':
          addToast('❌ Unable to reconnect - please refresh the page', 'error');
          
          // Suggest recovery actions
          setTimeout(() => {
            const shouldRefresh = window.confirm(
              'Connection failed permanently.\n\n' +
              'To rejoin the game:\n' +
              '• Click OK to refresh the page\n' +
              '• Or manually refresh your browser\n\n' +
              'Refresh now?'
            );
            
            if (shouldRefresh) {
              window.location.reload();
            }
          }, 3000);
          break;

        case 'auth_error':
          if (gameState?.gameState === 'playing') {
            addToast('🔐 Authentication error during game - may need to rejoin', 'error');
          }
          break;

        case 'game_state_requested':
          // Let user know we're trying to restore their position
          if (gameState?.gameState === 'playing') {
            addToast('🔄 Synchronizing game state...', 'info');
          }
          break;
        
        case 'session_validated':
          addToast('✅ Session validated successfully', 'success');
          break;
        
        case 'session_invalid':
          addToast('⚠️ Session invalid - please rejoin the game', 'warning');
          
          // Offer to refresh the page to restart the session
          setTimeout(() => {
            const shouldRefresh = window.confirm(
              'Your session is no longer valid.\n\n' +
              'This may happen if:\n' +
              '• The game was reset while you were disconnected\n' +
              '• You were removed from the game\n' +
              '• The server was restarted\n\n' +
              'Refresh the page to rejoin?'
            );
            
            if (shouldRefresh) {
              window.location.reload();
            }
          }, 5000);
          break;
        
        case 'error':
          if (data.context === 'session_validation') {
            addToast('❌ Session validation error - connection may be unstable', 'error');
          } else if (data.context === 'undefined') {
            addToast('❌ Undefined socket error detected - attempting recovery', 'error');
          }
          break;

        default:
          break;
      }
    };

    const unsubscribe = addConnectionListener(handleConnectionEvent);
    return () => {
      unsubscribe();
      
      // Clean up timeouts
      const currentTimeout = reconnectTimeoutRef.current;
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
      if (sessionValidationTimeoutRef.current) {
        clearTimeout(sessionValidationTimeoutRef.current);
      }
    };
  }, [
    addConnectionListener,
    gameState,
    isMyTurn,
    addToast,
    setSelectedCards,
    setHasDrawnThisTurn,
    setIsDrawing,
    setIsSkipping,
    socket,
    storeSessionData,
    validateSession,
    sessionValid,
    playerId
  ]);

  // Handle turn state synchronization on reconnection with session validation
  useEffect(() => {
    if (socket && socket.connected && gameState?.gameState === 'playing') {
      // Request turn state synchronization if we're in a game
      
      // If the current player ID doesn't match what we expect, request sync
      if (previousConnectionStateRef.current === false && socket.connected) {
        console.log('🔄 Connection restored - requesting turn state sync');
        
        // Only request sync if session is valid
        if (sessionValid) {
          socket.emit('requestTurnSync', { playerId });
        } else {
          console.warn('⚠️ Skipping turn sync - session invalid');
          addToast('⚠️ Cannot sync turn state - session invalid', 'warning');
        }
      }
    }
    
    previousConnectionStateRef.current = socket?.connected || false;
  }, [socket, socket?.connected, gameState, playerId, sessionValid, addToast]);

  // Handle specific edge cases during reconnection with enhanced error recovery
  useEffect(() => {
    if (!socket) return;

    const handleTurnStateSync = (data) => {
      console.log('🔄 Received turn state sync:', data);
      
      // Validate the sync data
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid turn state sync data:', data);
        addToast('❌ Invalid turn state data received', 'error');
        return;
      }
      
      // Update local state based on server's authoritative state
      if (data.hasDrawnThisTurn !== undefined) {
        setHasDrawnThisTurn(data.hasDrawnThisTurn);
      }
      
      if (data.isYourTurn) {
        addToast('🎯 It\'s your turn!', 'info');
      }
      
      // Clear any stuck UI states
      setIsDrawing(false);
      setIsSkipping(false);
      
      addToast('✅ Turn state synchronized', 'success');
    };

    const handlePlayerStateRestore = (data) => {
      console.log('🔄 Restoring player state:', data);
      
      // Validate the restore data
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid player state restore data:', data);
        addToast('❌ Invalid player state data received', 'error');
        return;
      }
      
      // Restore player-specific state that might have been lost
      if (data.selectedCards && Array.isArray(data.selectedCards)) {
        setSelectedCards(data.selectedCards);
      }
      
      if (data.turnActions && typeof data.turnActions === 'object') {
        if (typeof data.turnActions.hasDrawn === 'boolean') {
          setHasDrawnThisTurn(data.turnActions.hasDrawn);
        }
        if (typeof data.turnActions.isDrawing === 'boolean') {
          setIsDrawing(data.turnActions.isDrawing);
        }
        if (typeof data.turnActions.isSkipping === 'boolean') {
          setIsSkipping(data.turnActions.isSkipping);
        }
      }
      
      addToast('✅ Player state restored', 'success');
    };
    
    const handleSyncError = (error) => {
      console.error('❌ State sync error:', error);
      addToast('❌ Failed to sync game state - please refresh if issues persist', 'error');
    };

    socket.on('turnStateSync', handleTurnStateSync);
    socket.on('playerStateRestore', handlePlayerStateRestore);
    socket.on('syncError', handleSyncError);

    return () => {
      socket.off('turnStateSync', handleTurnStateSync);
      socket.off('playerStateRestore', handlePlayerStateRestore);
      socket.off('syncError', handleSyncError);
    };
  }, [socket, setHasDrawnThisTurn, setIsDrawing, setIsSkipping, setSelectedCards, addToast]);
  
  // Monitor session validity and provide user feedback
  useEffect(() => {
    if (socket && socket.connected && !sessionValid) {
      console.warn('⚠️ Session invalid detected - user may need to rejoin');
    }
  }, [socket, sessionValid]);
};

export default useReconnectionHandler;