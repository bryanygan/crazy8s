import React, { useState, useEffect, useRef } from 'react';
import { AuthModal, UserDashboard } from './auth';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ConnectionProvider, useConnection } from '../contexts/ConnectionContext';
import MainMenu from './MainMenu';
import { getValidCardsForSelection } from '../utils/cardUtils';

// Hooks
import { useToasts } from '../hooks/useToasts';
import { useSettings } from '../hooks/useSettings';
import { useModals } from '../hooks/useModals';
import { useGameState } from '../hooks/useGameState';
import { usePlayerHand } from '../hooks/usePlayerHand';
import { useTimer } from '../hooks/useTimer';
import { useTournament } from '../hooks/useTournament';
import { usePlayAgainVoting } from '../hooks/usePlayAgainVoting';
import useSocketEvents from '../hooks/useSocketEvents';
import useGameActions from '../hooks/useGameActions';
// Icons
import { FaTrophy, FaHome } from 'react-icons/fa';

// Game components
import ToastContainer from './ui/ToastContainer';
import TurnTimer from './ui/TurnTimer';
import PlayerHand from './game/PlayerHand';
import GameBoard from './game/GameBoard';
import SuitSelector from './game/SuitSelector';
import Settings from './game/Settings';
import Chat from './game/Chat';
import DebugPanel from './game/DebugPanel';

// Tournament components
import TournamentStatus from './tournament/TournamentStatus';
import SafePlayerNotification from './tournament/SafePlayerNotification';
import RoundEndModal from './tournament/RoundEndModal';
import TournamentWinnerModal from './tournament/TournamentWinnerModal';
import TournamentPlayerDisplay from './tournament/TournamentPlayerDisplay';

// --- INLINE COMPONENT DEFINITIONS REMOVED ---
// PlayerHand, GameBoard, SuitSelector, Settings, Chat, TournamentStatus,
// SafePlayerNotification, RoundEndModal, TournamentWinnerModal,
// TournamentPlayerDisplay, and DebugPanel have been extracted to separate files.
// See components/game/ and components/tournament/

const PLACEHOLDER_REMOVED = true; // Marker for removed inline components
if (PLACEHOLDER_REMOVED) { /* noop - prevents unused var warning */ }

// GameApp component starts below
// (Inline components removed — see components/game/ and components/tournament/)

// Main App component (wrapped with authentication)
const GameApp = () => {
  const { user, token, isAuthenticated, updateSettings, migrateLocalSettings: authMigrateSettings, logout } = useAuth();
  const { socket, isConnected, connectWithAuth, connectAsGuest, requestGameState, addConnectionListener } = useConnection();
  
  // Use extracted hooks
  const { gameState, setGameState, playerId, setPlayerId, playerName, setPlayerName, gameId, setGameId } = useGameState();
  const { playerHand, setPlayerHand, selectedCards, setSelectedCards, validCards, setValidCards } = usePlayerHand();
  const { toasts, addToast, removeToast, setToasts } = useToasts();
  const { settings, setSettings } = useSettings();
  const { 
    showSettings, showAuthModal, showUserDashboard, showSuitSelector,
    setShowSettings, setShowAuthModal, setShowUserDashboard, setShowSuitSelector 
  } = useModals();
  const [copiedGameId, setCopiedGameId] = useState(false);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(0);
  const [showTournamentInfo, setShowTournamentInfo] = useState(false);
  
  // Use extracted hooks for timer and tournament
  const { globalTimer, setGlobalTimer, timerDurationRef, timerWarningTimeRef } = useTimer(settings);
  const {
    showRoundEndModal, setShowRoundEndModal, roundEndData, setRoundEndData,
    nextRoundTimer, setNextRoundTimer, showTournamentWinnerModal, setShowTournamentWinnerModal,
    tournamentWinnerData, setTournamentWinnerData, setTournamentStatus
  } = useTournament();
  const { playAgainVotes, setPlayAgainVotes } = usePlayAgainVoting();

  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);
  const [debugGameSetup] = useState({
    playerCount: 3,
    playerNames: ['Debug Player 1', 'Debug Player 2', 'Debug Player 3'],
    customHands: [
  // Standard 52-card deck for customHands (copy/paste as needed)
[
  // Hearts
  { rank: '2', suit: 'Hearts' },
  { rank: '3', suit: 'Hearts' },
  { rank: '4', suit: 'Hearts' },
  { rank: '5', suit: 'Hearts' },
  { rank: '6', suit: 'Hearts' },
  { rank: '7', suit: 'Hearts' },
  { rank: '8', suit: 'Hearts' },
  { rank: '9', suit: 'Hearts' },
  { rank: '10', suit: 'Hearts' },
  { rank: 'Jack', suit: 'Hearts' },
  { rank: 'Queen', suit: 'Hearts' },
  { rank: 'King', suit: 'Hearts' },
  { rank: 'Ace', suit: 'Hearts' },

  // Diamonds
  { rank: '2', suit: 'Diamonds' },
  { rank: '3', suit: 'Diamonds' },
  { rank: '4', suit: 'Diamonds' },
  { rank: '5', suit: 'Diamonds' },
  { rank: '6', suit: 'Diamonds' },
  { rank: '7', suit: 'Diamonds' },
  { rank: '8', suit: 'Diamonds' },
  { rank: '9', suit: 'Diamonds' },
  { rank: '10', suit: 'Diamonds' },
  { rank: 'Jack', suit: 'Diamonds' },
  { rank: 'Queen', suit: 'Diamonds' },
  { rank: 'King', suit: 'Diamonds' },
  { rank: 'Ace', suit: 'Diamonds' },

  // Clubs
  { rank: '2', suit: 'Clubs' },
  { rank: '3', suit: 'Clubs' },
  { rank: '4', suit: 'Clubs' },
  { rank: '5', suit: 'Clubs' },
  { rank: '6', suit: 'Clubs' },
  { rank: '7', suit: 'Clubs' },
  { rank: '8', suit: 'Clubs' },
  { rank: '9', suit: 'Clubs' },
  { rank: '10', suit: 'Clubs' },
  { rank: 'Jack', suit: 'Clubs' },
  { rank: 'Queen', suit: 'Clubs' },
  { rank: 'King', suit: 'Clubs' },
  { rank: 'Ace', suit: 'Clubs' },

  // Spades
  { rank: '2', suit: 'Spades' },
  { rank: '3', suit: 'Spades' },
  { rank: '4', suit: 'Spades' },
  { rank: '5', suit: 'Spades' },
  { rank: '6', suit: 'Spades' },
  { rank: '7', suit: 'Spades' },
  { rank: '8', suit: 'Spades' },
  { rank: '9', suit: 'Spades' },
  { rank: '10', suit: 'Spades' },
  { rank: 'Jack', suit: 'Spades' },
  { rank: 'Queen', suit: 'Spades' },
  { rank: 'King', suit: 'Spades' },
  { rank: 'Ace', suit: 'Spades' }
],
  [
    { rank: 'Jack', suit: 'Hearts' },
    { rank: 'Jack', suit: 'Diamonds' },
    { rank: 'Jack', suit: 'Clubs' },
    { rank: 'Queen', suit: 'Clubs' },
    { rank: 'Queen', suit: 'Diamonds' },
    { rank: 'Ace', suit: 'Diamonds' },
    { rank: 'Ace', suit: 'Hearts' },
    { rank: '2', suit: 'Hearts' },
    { rank: '2', suit: 'Spades' },
    { rank: 'Ace', suit: 'Spades' }
  ],
  [
    { rank: 'Jack', suit: 'Hearts' },
    { rank: 'Jack', suit: 'Diamonds' },
    { rank: 'Jack', suit: 'Clubs' },
    { rank: 'Queen', suit: 'Clubs' },
    { rank: 'Queen', suit: 'Diamonds' },
    { rank: 'Ace', suit: 'Diamonds' },
    { rank: 'Ace', suit: 'Hearts' },
    { rank: '2', suit: 'Hearts' },
    { rank: '2', suit: 'Spades' },
    { rank: 'Ace', suit: 'Spades' }
  ]
],
    startingCard: { suit: 'Hearts', rank: '7' }
  });
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [debugPlayers, setDebugPlayers] = useState([]);


  // Timer refs now provided by useTimer hook
  const playerIdRef = useRef(playerId);
  const hasDrawnThisTurnRef = useRef(hasDrawnThisTurn);
  const [isSkipping, setIsSkipping] = useState(false);

  // Toast functions now provided by useToasts hook

  // Play again voting now handled by usePlayAgainVoting hook


  // Keep refs in sync with settings
  useEffect(() => {
    timerDurationRef.current = settings.timerDuration;
    timerWarningTimeRef.current = settings.timerWarningTime;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.timerDuration, settings.timerWarningTime]);

  useEffect(() => {
  if (playerId) {
    playerIdRef.current = playerId;
  }
}, [playerId]);


// Keep hasDrawnThisTurn ref in sync
  useEffect(() => {
    hasDrawnThisTurnRef.current = hasDrawnThisTurn;
  }, [hasDrawnThisTurn]);

  // Load settings from localStorage on component mount with enhanced compatibility
  useEffect(() => {
    if (playerId) {
      const defaultSettings = {
        sortByRank: false,
        groupBySuit: false,
        experiencedMode: false,
        enableTimer: true,
        timerDuration: 60,
        timerWarningTime: 15,
        theme: 'default',
        soundEnabled: true,
        animationsEnabled: true,
        autoPlay: false,
        customCardback: 'default'
      };

      // Check if user is authenticated and has server settings
      if (isAuthenticated && user?.settings) {
        // Use server settings for authenticated users
        const serverSettings = { ...defaultSettings, ...user.settings };
        setSettings(serverSettings);
      } else {
        // Fallback to localStorage for unauthenticated users
        const savedSettings = localStorage.getItem(`crazy8s_settings_${playerId}`);
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            const mergedSettings = { ...defaultSettings, ...parsed };
            setSettings(mergedSettings);
          } catch (error) {
            setSettings(defaultSettings);
          }
        } else {
          setSettings(defaultSettings);
        }
      }
    }
  }, [playerId, isAuthenticated, user, setSettings]);

  // Debug mode activation - secret keyboard combo Ctrl+Shift+D then EBUG
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyD') {
        const sequence = ['KeyE', 'KeyB', 'KeyU', 'KeyG'];
        let index = 0;
        const seqHandler = (evt) => {
          if (evt.code === sequence[index]) {
            index++;
            if (index === sequence.length) {
              setDebugMode(true);
              setShowDebugPanel(true);
              addDebugLog('Debug mode activated', 'system');
              document.removeEventListener('keydown', seqHandler);
            }
          } else {
            index = 0;
            document.removeEventListener('keydown', seqHandler);
          }
        };
        document.addEventListener('keydown', seqHandler);
        setTimeout(() => document.removeEventListener('keydown', seqHandler), 5000);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const validateTimerSettings = (newSettings) => {
    const validated = { ...newSettings };
    if (validated.timerDuration < 15) validated.timerDuration = 15;
    if (validated.timerDuration > 300) validated.timerDuration = 300;
    const maxWarning = Math.floor(validated.timerDuration * 0.5);
    if (validated.timerWarningTime < 5) validated.timerWarningTime = 5;
    if (validated.timerWarningTime > maxWarning) validated.timerWarningTime = maxWarning;
    return validated;
  };

  // Save settings with backward compatibility and server sync
  const handleSettingsChange = async (newSettings) => {
    const validatedSettings = validateTimerSettings(newSettings);
    
    // Check what local settings changed and show appropriate toast
    const oldSettings = settings;
    if (oldSettings.sortByRank !== validatedSettings.sortByRank) {
      addToast(validatedSettings.sortByRank ? 'Card sorting by rank enabled' : 'Card sorting by rank disabled', 'success');
    }
    if (oldSettings.groupBySuit !== validatedSettings.groupBySuit) {
      addToast(validatedSettings.groupBySuit ? 'Card grouping by suit enabled' : 'Card grouping by suit disabled', 'success');
    }
    if (oldSettings.experiencedMode !== validatedSettings.experiencedMode) {
      addToast(validatedSettings.experiencedMode ? 'Experienced mode enabled' : 'Experienced mode disabled', 'success');
    }
    
    setSettings(validatedSettings);
    
    // Save to appropriate storage based on authentication status
    if (isAuthenticated && updateSettings) {
      // Save to server for authenticated users
      try {
        await updateSettings(validatedSettings);
      } catch (error) {
        // Fallback to localStorage if server sync fails
        if (playerId) {
          localStorage.setItem(`crazy8s_settings_${playerId}`, JSON.stringify(validatedSettings));
        }
      }
    } else {
      // Save to localStorage for unauthenticated users
      if (playerId) {
        const settingsToSave = {
          ...validatedSettings,
          _metadata: {
            lastModified: new Date().toISOString(),
            version: '2.0.0',
            playerId: playerId
          }
        };
        localStorage.setItem(`crazy8s_settings_${playerId}`, JSON.stringify(settingsToSave));
      }
    }
    
    // Only send timer settings to server if timer settings actually changed
    const timerSettingsChanged = 
      oldSettings.enableTimer !== validatedSettings.enableTimer ||
      oldSettings.timerDuration !== validatedSettings.timerDuration ||
      oldSettings.timerWarningTime !== validatedSettings.timerWarningTime;
      
    if (socket && gameState?.gameId && timerSettingsChanged) {
      socket.emit('updateTimerSettings', {
        gameId: gameState.gameId,
        timerSettings: {
          enableTimer: validatedSettings.enableTimer,
          timerDuration: validatedSettings.timerDuration,
          timerWarningTime: validatedSettings.timerWarningTime
        }
      });
    }
  };


  // Reset drawing state when game state changes players
  useEffect(() => {
    if (gameState?.currentPlayerId !== playerId) {
      setHasDrawnThisTurn(false);
      setIsDrawing(false);
      setIsSkipping(false); 
    } else if (gameState?.currentPlayerId === playerId) {
      // When it becomes our turn, sync with backend's draw tracking
      const hasDrawnAccordingToServer = gameState?.playersWhoHaveDrawn?.includes(playerId) || false;
      setHasDrawnThisTurn(hasDrawnAccordingToServer);
    }
  }, [gameState?.currentPlayerId, gameState?.playersWhoHaveDrawn, playerId]);

  // Clear selected cards when turn changes
  useEffect(() => {
    const isMyTurn = gameState?.currentPlayerId === playerId;
    if (!isMyTurn) {
      setSelectedCards([]);
    }
  }, [gameState?.currentPlayerId, playerId, setSelectedCards]);

  // Debug logging helper
  const addDebugLog = (message, type = 'info', data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const entry = {
      id: Date.now(),
      timestamp,
      message,
      type,
      data
    };
    setDebugLogs((prev) => [...prev.slice(-50), entry]);
  };

  // Copy game ID to clipboard
  const copyGameId = async () => {
    if (gameState?.gameId) {
      try {
        await navigator.clipboard.writeText(gameState.gameId);
        setCopiedGameId(true);
        setTimeout(() => setCopiedGameId(false), 2000);
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = gameState.gameId;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedGameId(true);
        setTimeout(() => setCopiedGameId(false), 2000);
      }
    }
  };

  // Initialize socket connection with authentication support and enhanced reconnection
  useEffect(() => {
    if (isAuthenticated && token) {
      connectWithAuth(token);
    } else {
      connectAsGuest();
    }
  }, [isAuthenticated, token, connectWithAuth, connectAsGuest]);

  // Socket event handlers (extracted to useSocketEvents hook)
  useSocketEvents({
    socket, gameState, playerId, isAuthenticated,
    playerIdRef, hasDrawnThisTurnRef, addToast,
    setGameState, setPlayerHand, setHasDrawnThisTurn, setIsDrawing,
    setIsSkipping, setSelectedCards, setPlayAgainVotes,
    setRoundEndData, setShowRoundEndModal, setNextRoundTimer,
    setTournamentWinnerData, setShowTournamentWinnerModal, setShowAuthModal,
    setTournamentStatus, setGlobalTimer, setPlayerName, authMigrateSettings,
  });

  // Set playerId when socket is available and connected
  useEffect(() => {
    if (socket && socket.connected && socket.id) {
      setPlayerId(socket.id);
    }
  }, [socket, socket?.connected, socket?.id, setPlayerId]);

  // Listen for connection events from ConnectionContext
  useEffect(() => {
    const handleConnectionEvent = (event, data) => {
      if (event === 'connected' && data.socketId) {
        setPlayerId(data.socketId);
        removeToast();

        if (gameId || (gameState && gameState.gameState !== 'waiting')) {
          requestGameState();
        }
      }
    };

    const unsubscribe = addConnectionListener(handleConnectionEvent);
    return () => unsubscribe();
  }, [addConnectionListener, gameId, gameState, requestGameState, removeToast, setPlayerId]);

  // Computed values
  const isMyTurn = gameState?.currentPlayerId === playerId;

  // Game action handlers (extracted to useGameActions hook)
  const {
    handleCardSelect,
    playSelectedCards,
    handleSuitSelect,
    drawCard,
    skipTurn,
    handlePlayAgainVote,
    handleStartNextRound,
    handleStartNewGame,
    parseTopCard,
  } = useGameActions({
    socket, gameState, playerId, playerHand, selectedCards, settings,
    isMyTurn, hasDrawnThisTurn, isDrawing, isSkipping, lastActionTime, playAgainVotes,
    addToast, setSelectedCards, setShowSuitSelector,
    setHasDrawnThisTurn, setIsDrawing, setIsSkipping, setLastActionTime,
  });


  // Update valid cards when playerHand or gameState changes
  useEffect(() => {
    if (gameState && playerHand.length > 0) {
      const topCard = parseTopCard(gameState.topCard);
      if (!topCard) return;

      // Calculate valid cards with empty selection for UI highlighting
      const valid = getValidCardsForSelection(playerHand, gameState, [], topCard);
      setValidCards(valid);
      
      // Clear invalid selected cards when top card changes
      setSelectedCards(prev => {
        if (prev.length > 0) {
          const stillValid = prev.filter(selectedCard => 
            valid.some(validCard => validCard.id === selectedCard.id)
          );
          
          if (stillValid.length !== prev.length) {
            return stillValid;
          }
        }
        return prev;
      });
    } else {
      setValidCards([]);
      setSelectedCards([]); // Clear selected cards when no valid cards
    }
  }, [playerHand, gameState, parseTopCard, setSelectedCards, setValidCards]);

  // Update valid cards when selected cards change (for stacking)
  useEffect(() => {
    if (gameState && playerHand.length > 0) {
      const topCard = parseTopCard(gameState.topCard);
      if (!topCard) return;

      // Calculate valid cards with current selection for stacking logic
      const valid = getValidCardsForSelection(playerHand, gameState, selectedCards, topCard);
      setValidCards(valid);
    }
  }, [selectedCards, playerHand, gameState, parseTopCard, setValidCards]);

// Handle game state changes to manage timer visibility
useEffect(() => {
  if (gameState?.gameState !== 'playing') {
    setGlobalTimer(prev => ({ ...prev, isActive: false }));
  }
}, [gameState?.gameState, setGlobalTimer]);

  const startGame = () => {
  socket.emit('startGame', {
    gameId: gameState?.gameId,
    timerSettings: {
      enableTimer: settings.enableTimer,
      timerDuration: settings.timerDuration,
      timerWarningTime: settings.timerWarningTime
    }
  });
};

useEffect(() => {
  // Reset states when turn changes away from us
  if (gameState?.currentPlayerId !== playerId) {
    setIsSkipping(false);
    setSelectedCards([]);
  }
}, [gameState?.currentPlayerId, playerId, setSelectedCards]);

  // Create a debug game on the server
  const startDebugGame = () => {
    if (!socket) return;
    const ids = [
      socket.id,
      ...Array.from({ length: debugGameSetup.playerCount - 1 }, (_, i) => `debug_${i + 1}`)
    ];
    setDebugPlayers(ids.map((id, idx) => ({ id, name: debugGameSetup.playerNames[idx] })));
    setPlayerId(ids[0]);
    socket.emit('createDebugGame', {
      playerIds: ids,
      playerNames: debugGameSetup.playerNames,
      customHands: debugGameSetup.customHands,
      startingCard: debugGameSetup.startingCard,
      debugMode: true
    });
    setShowDebugPanel(false);
  };

// Handle logout with confirmation
const handleLogout = async () => {
  // Show confirmation dialog
  const confirmLogout = window.confirm(
    '🚪 Are you sure you want to logout?\n\n' +
    '• Your current game will continue\n' +
    '• Your settings will be saved\n' +
    '• You can sign back in anytime'
  );

  if (!confirmLogout) {
    return;
  }

  try {
    // Save current game state info for toast
    const wasInGame = gameState?.gameId && gameState?.gameState !== 'waiting';
    
    // Perform logout
    await logout();
    
    // Show success message
    if (wasInGame) {
      addToast('✅ Logged out successfully. Your game continues as guest.', 'success');
    } else {
      addToast('✅ Logged out successfully. You can continue playing as guest.', 'success');
    }
    
    // Close any open modals
    setShowAuthModal(false);
    
  } catch (error) {
    addToast('❌ Logout failed. Please try again.', 'error');
  }
};

  const sliderStyles = `
    input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      height: 6px;
      border-radius: 3px;
      outline: none;
      cursor: pointer;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #3498db;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
    }

    input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }

    input[type="range"]::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #3498db;
      cursor: pointer;
      border: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
    }

    input[type="range"]::-moz-range-thumb:hover {
      transform: scale(1.1);
      box-shadow:  0 4px 8px rgba(0,0,0,0.3);
    }
  `;

  if (!isConnected) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        backgroundColor: '#ecf0f1',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '40px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#2c3e50' }}>🔌 Connecting to server...</h2>
          <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
            Please wait while we establish connection...
          </div>
        </div>
        
        {/* Toast Notifications */}
        <ToastContainer 
          toasts={toasts}
          onRemoveToast={removeToast}
        />
      </div>
    );
  }

  if (!gameState) {
    return (
      <>
        <MainMenu 
          onGameCreated={({ playerName, resetLoading }) => {
            setPlayerName(playerName);
            if (!playerName.trim()) {
              addToast('Please enter your name', 'error');
              if (resetLoading) resetLoading();
              return;
            }
            
            // Store resetLoading callback to call it when we get a response
            const resetLoadingRef = { current: resetLoading };
            
            // Set up one-time listeners for the response
            const handleGameCreatedSuccess = (data) => {
              if (resetLoadingRef.current) resetLoadingRef.current();
              socket.off('gameUpdate', handleGameCreatedSuccess);
              socket.off('error', handleGameCreatedError);
            };
            
            const handleGameCreatedError = (error) => {
              if (resetLoadingRef.current) resetLoadingRef.current();
              socket.off('gameUpdate', handleGameCreatedSuccess);
              socket.off('error', handleGameCreatedError);
            };
            
            socket.once('gameUpdate', handleGameCreatedSuccess);
            socket.once('error', handleGameCreatedError);
            
            socket.emit('createGame', {
              playerName: playerName.trim()
            });
          }}
          onGameJoined={({ gameId, playerName }) => {
            setPlayerName(playerName);
            setGameId(gameId);
            if (!playerName.trim() || !gameId.trim()) {
              addToast('Please enter both name and game ID', 'error');
              return;
            }
            socket.emit('joinGame', {
              gameId: gameId.trim(),
              playerName: playerName.trim()
            });
          }}
        />
        
        {/* Toast Notifications */}
        <ToastContainer 
          toasts={toasts}
          onRemoveToast={removeToast}
        />
      </>
    );
  }

  const topCard = parseTopCard(gameState.topCard);

  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#ecf0f1',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      width: '100vw',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Enhanced Header with User Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        backgroundColor: '#fff',
        padding: '15px 20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Game Title */}
        <h1 style={{ 
          color: '#2c3e50', 
          margin: 0, 
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🎴 Crazy 8's
        </h1>

        {/* User Info & Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* User Status Display */}
          {isAuthenticated ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#27ae60',
                  borderRadius: '50%'
                }}></div>
                <span style={{
                  color: '#2c3e50',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {user?.displayName || user?.username}
                </span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6c757d',
                borderLeft: '1px solid #dee2e6',
                paddingLeft: '8px'
              }}>
                Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#fff3cd',
              borderRadius: '8px',
              border: '1px solid #ffeaa7'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#f39c12',
                borderRadius: '50%'
              }}></div>
              <span style={{
                color: '#856404',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                Playing as Guest
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setShowUserDashboard(true)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#3498db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  👤 Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#e74c3c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🔑 Sign In / Register
              </button>
            )}
            
          </div>
        </div>
      </div>


      {/* Game Info */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', textAlign: 'left' }}>
            <strong style={{ color: '#000' }}>Round:</strong> <span style={{ color: '#000' }}>{gameState.roundNumber}</span>
          </div>
          
          <div style={{ flex: '1', textAlign: 'center' }}>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#95a5a6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#7f8c8d'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#95a5a6'}
            >
              ⚙️ Settings
            </button>
          </div>
          
          <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#000' }}>Game ID:</strong> 
              <span style={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#f8f9fa', 
                padding: '2px 6px', 
                borderRadius: '4px',
                marginLeft: '5px',
                color: '#000'
              }}>
                {gameState.gameId}
              </span>
            </div>
            <button
              onClick={copyGameId}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                backgroundColor: copiedGameId ? '#27ae60' : '#3498db',
                color: '#fff',
                fontSize: '12px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                flexShrink: 0
              }}
              title={copiedGameId ? 'Copied!' : 'Copy Game ID'}
            >
              {copiedGameId ? '✓' : '📋'}
            </button>
          </div>
        </div>
        
        {/* Start Game Button */}
        {gameState.gameState === 'waiting' && gameState.players.length >= 2 && (
          <div style={{ marginTop: '15px' }}>
            <button
              onClick={startGame}
              style={{
                padding: '12px 25px',
                backgroundColor: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              🚀 Start Game ({gameState.players.length} players)
            </button>
            
            {/* Auth Upgrade Hint for Guests */}
            {!isAuthenticated && (
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#856404'
              }}>
                💡 <strong>Tip:</strong> Create an account to save your game stats and track achievements!{' '}
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#27ae60',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  Sign up now
                </button>
              </div>
            )}
          </div>
        )}
        
        {isMyTurn && gameState.gameState === 'playing' && (
          <div style={{
            marginTop: '15px',
            padding: '8px 20px',
            backgroundColor: '#2ecc71',
            color: '#fff',
            borderRadius: '20px',
            display: 'inline-block',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            animation: 'pulse 2s infinite'
          }}>
            🎯 It's your turn!
          </div>
        )}
        
        {/* Tournament Dropdown Toggle - Only show if tournament is active */}
        {gameState?.tournament?.active && (
          <>
            <div 
              onClick={() => setShowTournamentInfo(!showTournamentInfo)}
              style={{
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #dee2e6',
                padding: '8px 20px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#6c757d',
                transition: 'all 0.2s ease',
                marginTop: '10px',
                borderRadius: '0 0 10px 10px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            >
              <FaTrophy style={{ fontSize: '12px', color: 'gold' }} />
              <span>Tournament Info</span>
              <span style={{
                transform: showTournamentInfo ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                fontSize: '10px'
              }}>
                ▼
              </span>
            </div>
            
            {/* Tournament Info Dropdown */}
            <div style={{
              maxHeight: showTournamentInfo ? '500px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
              backgroundColor: '#fff',
              borderRadius: '0 0 10px 10px'
            }}>
              <div style={{ 
                padding: showTournamentInfo ? '15px 20px' : '0 20px',
                transition: 'padding 0.3s ease-in-out'
              }}>
                <TournamentStatus gameState={gameState} />
                <SafePlayerNotification 
                  isPlayerSafe={(gameState?.players?.find(p => p.id === playerId)?.isSafe || false) && gameState?.gameState !== 'finished' && gameState?.tournament?.currentRound > 1}
                  playerName={playerName}
                  gameState={gameState}
                  onStartNextRound={handleStartNextRound}
                  playerId={playerId}
                  currentPlayerId={playerId}
                />
                <TournamentPlayerDisplay players={gameState?.players || []} gameState={gameState} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Players */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {gameState.players.map((player, index) => (
        <div
            key={index}
            style={{
            padding: '8px 16px',
            backgroundColor: player.isCurrentPlayer ? '#3498db' : '#95a5a6',
            color: '#fff',
            borderRadius: '20px',
            fontWeight: 'bold',
            textAlign: 'center',
            minWidth: '100px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transform: player.isCurrentPlayer ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.3s ease',
            position: 'relative'
            }}
        >
            <div style={{ fontSize: '14px' }}>
            {player.name} ({player.handSize})
            {!player.isConnected && ' 🔴'}
            {player.id === playerId && ' (YOU)'}
            {player.isSafe && ' ✅'}
            {player.isEliminated && ' ❌'}
            </div>
            
            {/* TIMER COMPONENT ADDED HERE */}
            <TurnTimer
            timeLeft={globalTimer.timeLeft}
            isWarning={globalTimer.isWarning}
            isVisible={player.isCurrentPlayer && gameState.gameState === 'playing' && globalTimer.isActive}
          />
        </div>
        ))}
    </div>

      {/* Game Board */}


      <GameBoard 
        gameState={gameState}
        onDrawCard={drawCard}
        topCard={topCard}
        drawPileSize={gameState.drawPileSize}
      />

      {/* Controls */}
      {isMyTurn && gameState.gameState === 'playing' && (
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            marginBottom: '15px',
            display: 'flex',
            justifyContent: 'center',
            gap: '15px'
          }}>
            <button
              onClick={playSelectedCards}
              disabled={selectedCards.length === 0}
              style={{
                padding: '12px 25px',
                backgroundColor: selectedCards.length > 0 ? '#27ae60' : '#bdc3c7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: selectedCards.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: selectedCards.length > 0 ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              🎴 Play {selectedCards.length} Card{selectedCards.length !== 1 ? 's' : ''}
            </button>
            <button
            onClick={drawCard}
            disabled={isDrawing || hasDrawnThisTurn}
            style={{
                padding: '12px 25px',
                backgroundColor: (isDrawing || hasDrawnThisTurn) ? '#95a5a6' : '#e67e22',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: (isDrawing || hasDrawnThisTurn) ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: (isDrawing || hasDrawnThisTurn) ? 'none' : '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                opacity: (isDrawing || hasDrawnThisTurn) ? 0.6 : 1
            }}
            >
            {isDrawing ? '⏳ Drawing...' : hasDrawnThisTurn ? '✅ Already Drew' : '📚 Draw Card'}
            </button>
            <button
              onClick={skipTurn}
              disabled={!isMyTurn || (!hasDrawnThisTurn && gameState.pendingTurnPass !== playerId) || isSkipping || !gameState || gameState.gameState !== 'playing'}
              style={{
                padding: '12px 25px',
                backgroundColor: (isMyTurn && (hasDrawnThisTurn || gameState.pendingTurnPass === playerId) && !isSkipping && gameState?.gameState === 'playing') ? '#95a5a6' : '#bdc3c7',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: (isMyTurn && (hasDrawnThisTurn || gameState.pendingTurnPass === playerId) && !isSkipping && gameState?.gameState === 'playing') ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                opacity: (isMyTurn && (hasDrawnThisTurn || gameState.pendingTurnPass === playerId) && !isSkipping && gameState?.gameState === 'playing') ? 1 : 0.6
              }}
            >
              {isSkipping ? '⏳ Skipping...' : '⏭️ Skip Turn'}
            </button>
          </div>
          
          {selectedCards.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                Selected: {selectedCards.map(c => `${c.rank} of ${c.suit}`).join(', ')}
              </div>
              <button
                onClick={() => setSelectedCards([])}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                ❌ Clear
              </button>
            </div>
          )}
          
          {validCards.length === 0 && gameState.drawStack === 0 && !hasDrawnThisTurn && (
            <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#f39c12',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '14px'
            }}>
                ⚠️ No valid cards to play - you must draw a card
            </div>
            )}

            {hasDrawnThisTurn && validCards.length === 0 && (
            <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#95a5a6',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '14px'
            }}>
                💡 No playable cards after drawing - your turn will end automatically
            </div>
            )}
          
          {gameState.drawStack > 0 && validCards.length === 0 && !hasDrawnThisTurn && (
  <div style={{
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '14px'
  }}>
    🚨 You must draw {gameState.drawStack} cards or play a counter card
  </div>
)}

    {gameState.drawStack > 0 && hasDrawnThisTurn && (
    <div style={{
        marginTop: '10px',
        padding: '10px',
        backgroundColor: '#27ae60',
        color: '#fff',
        borderRadius: '6px',
        fontSize: '14px'
    }}>
        ✅ Drew {gameState.drawStack} cards from draw stack - turn complete
    </div>
    )}
        </div>
      )}

      {!isMyTurn && gameState.gameState === 'playing' && (
        <div style={{
          textAlign: 'center',
          marginBottom: '20px',
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ color: '#7f8c8d', fontSize: '16px' }}>
            ⏳ Waiting for {gameState.currentPlayer} to play...
          </div>
          <div style={{ color: '#95a5a6', fontSize: '12px', marginTop: '5px' }}>
            Current Player ID: {gameState.currentPlayerId} | Your ID: {playerId}
          </div>
        </div>
      )}

      {/* Player Hand */}
      <PlayerHand
        cards={playerHand}
        validCards={validCards}
        selectedCards={selectedCards}
        onCardSelect={handleCardSelect}
        settings={settings}
      />

      {/* Game Over */}
      {gameState.gameState === 'finished' && (
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>🎉 Game Over!</h2>
          <div style={{ fontSize: '18px', color: '#27ae60', fontWeight: 'bold', marginBottom: '20px' }}>
            Winner: {gameState.players.find(p => !p.isEliminated)?.name || 'Unknown'}
          </div>
          
          {/* Game Statistics */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#2c3e50' }}>
              📊 Final Results
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {gameState.players
                .sort((a, b) => {
                  // Winner first, then by elimination order
                  if (!a.isEliminated && b.isEliminated) return -1;
                  if (a.isEliminated && !b.isEliminated) return 1;
                  return 0;
                })
                .map((player, index) => (
                  <div key={player.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 10px',
                    backgroundColor: index === 0 ? '#d4edda' : '#fff',
                    borderRadius: '4px',
                    border: index === 0 ? '2px solid #27ae60' : '1px solid #ddd'
                  }}>
                    <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                      {index === 0 ? '🏆' : `${index + 1}.`} {player.name}
                      {player.id === playerId && ' (YOU)'}
                    </span>
                    <span style={{
                      color: index === 0 ? '#27ae60' : '#6c757d',
                      fontSize: '12px'
                    }}>
                      {index === 0 ? 'WINNER' : 'Eliminated'}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Play Again Voting Section */}
          <div style={{
            backgroundColor: '#e3f2fd',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '15px', color: '#1565c0', fontSize: '16px' }}>
              🗳️ Vote to Play Again
            </div>
            
            {/* Voting Status */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginBottom: '15px',
              flexWrap: 'wrap'
            }}>
              {gameState.players
                .filter(p => p.isConnected)
                .map(player => {
                  const hasVoted = playAgainVotes.votedPlayers.some(v => v.id === player.id);
                  const isCreator = player.id === playAgainVotes.gameCreator;
                  
                  return (
                    <div key={player.id} style={{
                      padding: '8px 15px',
                      borderRadius: '20px',
                      backgroundColor: hasVoted ? '#4caf50' : '#e0e0e0',
                      color: hasVoted ? '#fff' : '#666',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: isCreator ? '2px solid #ff9800' : 'none',
                      position: 'relative'
                    }}>
                      {player.name}
                      {player.id === playerId && ' (YOU)'}
                      {isCreator && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          background: '#ff9800',
                          color: '#fff',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          👑
                        </div>
                      )}
                      <div style={{ fontSize: '10px', marginTop: '2px' }}>
                        {hasVoted ? '✅ Ready' : '⏳ Waiting'}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Vote Progress */}
            <div style={{
              marginBottom: '15px',
              fontSize: '14px',
              color: '#1565c0'
            }}>
              <div style={{ marginBottom: '5px' }}>
                Votes: {playAgainVotes.votedPlayers.length} / {playAgainVotes.totalPlayers}
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(playAgainVotes.votedPlayers.length / Math.max(playAgainVotes.totalPlayers, 1)) * 100}%`,
                  height: '100%',
                  backgroundColor: playAgainVotes.allVoted ? '#4caf50' : '#2196f3',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Vote Button */}
            <button
              onClick={handlePlayAgainVote}
              style={{
                padding: '12px 25px',
                backgroundColor: playAgainVotes.votedPlayers.some(p => p.id === playerId) ? '#f44336' : '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                marginRight: '10px',
                transition: 'all 0.2s ease'
              }}
            >
              {playAgainVotes.votedPlayers.some(p => p.id === playerId) ? '❌ Remove Vote' : '✅ Vote to Play Again'}
            </button>

            {/* Start Game Button (Creator Only) */}
            {playerId === playAgainVotes.gameCreator && (
              <button
                onClick={handleStartNewGame}
                disabled={!playAgainVotes.canStartGame}
                style={{
                  padding: '12px 25px',
                  backgroundColor: playAgainVotes.canStartGame ? '#ff9800' : '#bdbdbd',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: playAgainVotes.canStartGame ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                👑 Start New Game
              </button>
            )}

            {/* Status Messages */}
            {playAgainVotes.allVoted && playAgainVotes.canStartGame && playerId === playAgainVotes.gameCreator && (
              <div style={{
                marginTop: '10px',
                padding: '8px',
                backgroundColor: '#4caf50',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                🎮 All players ready! You can start the new game.
              </div>
            )}
            
            {playAgainVotes.allVoted && playerId !== playAgainVotes.gameCreator && (
              <div style={{
                marginTop: '10px',
                padding: '8px',
                backgroundColor: '#2196f3',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                ⏳ Waiting for game creator to start the new game...
              </div>
            )}
            
            {!playAgainVotes.allVoted && (
              <div style={{
                marginTop: '10px',
                padding: '8px',
                backgroundColor: '#ff9800',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                ⏳ Waiting for all players to vote...
              </div>
            )}
          </div>

          {/* Alternative Actions */}
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 25px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
            >
              <FaHome style={{ marginRight: '8px' }} />Return to Lobby
            </button>
          </div>

          {/* Help Text */}
          <div style={{
            marginTop: '20px',
            padding: '10px',
            backgroundColor: '#fff3e0',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#f57c00'
          }}>
            💡 All players must vote to play again. The game creator (👑) will start the new game when everyone is ready.
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts}
        onRemoveToast={removeToast}
      />

      {/* Settings Modal */}
      <Settings 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        setToasts={setToasts}
      />


      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* User Dashboard Modal */}
      {showUserDashboard && (
        <UserDashboard 
          onClose={() => setShowUserDashboard(false)}
          onJoinGame={() => {
            setShowUserDashboard(false);
            // Game is already active, just close dashboard
          }}
          currentGameState={gameState}
        />
      )}

      {/* Tournament Modals */}
      <RoundEndModal 
        isOpen={showRoundEndModal}
        roundData={roundEndData}
        nextRoundTimer={nextRoundTimer}
        onClose={() => setShowRoundEndModal(false)}
        onStartNextRound={handleStartNextRound}
        isPlayerSafe={gameState?.players?.find(p => p.id === playerId)?.isSafe || false}
      />
      
      <TournamentWinnerModal 
        isOpen={showTournamentWinnerModal}
        winnerData={tournamentWinnerData}
        onClose={() => setShowTournamentWinnerModal(false)}
      />

      {/* Suit Selector Modal */}
      {showSuitSelector && (
        <SuitSelector
          onSuitSelect={handleSuitSelect}
          onCancel={() => {
            setShowSuitSelector(false);
            setSelectedCards([]);
          }}
        />
      )}

      {/* Chat */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '320px',
        zIndex: 100 // Ensure chat is above player hand cards
      }}>
        <Chat socket={socket} />
      </div>

      {debugMode && (
        <div style={{ position: 'fixed', top: '10px', left: '10px', background: '#e74c3c', color: '#fff', padding: '6px 12px', borderRadius: '12px', cursor: 'pointer', zIndex: 1500 }} onClick={() => setShowDebugPanel(true)}>
          🐛 DEBUG MODE
        </div>
      )}

      <DebugPanel
        isOpen={showDebugPanel}
        logs={debugLogs}
        onClose={() => setShowDebugPanel(false)}
        onStart={startDebugGame}
        players={debugPlayers}
        currentId={playerId}
        onSwitch={(id) => {
          if (socket) {
            socket.emit('switchPlayer', { newPlayerId: id });
            setPlayerId(id);
          }
        }}

      />

      {/* Add some CSS animations */}
      <style>{`
        /* REPLACE your card CSS with this version that removes the flickering animation */

@keyframes progressBar {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* FIXED: Minimal card styles without entrance animation */
.card {
  transform-origin: center center;
  will-change: transform, box-shadow;
  
  /* REMOVED: cardEntrance animation that was causing flickering */
  /* animation: cardEntrance 0.2s ease-out; */
}

/* Enhanced focus states for accessibility */
.card:focus {
  outline: 2px solid #3498db;
  outline-offset: 2px;
  transform: translateY(-5px) scale(1.02);
}

/* REMOVED: cardEntrance animation definition */
/* @keyframes cardEntrance { ... } */

/* Keep other essential animations */
.card:hover:not(.selected) {
  z-index: 10;
}

.card.playable:hover:not(.selected) {
  /* Handled in React component */
}

.card.selected {
  z-index: 15;
}

        ${sliderStyles}
      `}</style>
    </div>
  );
};

// Main App component with AuthProvider and ConnectionProvider wrapper
const App = () => {
  return (
    <AuthProvider>
      <ConnectionProvider>
        <GameApp />
      </ConnectionProvider>
    </AuthProvider>
  );
};

export default App;
