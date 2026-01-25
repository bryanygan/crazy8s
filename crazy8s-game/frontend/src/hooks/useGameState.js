import { useState } from 'react';

/**
 * Custom hook for managing game state and player information
 * 
 * @returns {Object} Game state management object
 * @returns {Object|null} returns.gameState - Current game state object
 * @returns {Function} returns.setGameState - Function to update game state
 * @returns {string|null} returns.playerId - Current player's unique ID
 * @returns {Function} returns.setPlayerId - Function to update player ID
 * @returns {string} returns.playerName - Current player's display name
 * @returns {Function} returns.setPlayerName - Function to update player name
 * @returns {string} returns.gameId - Current game session ID
 * @returns {Function} returns.setGameId - Function to update game ID
 * 
 * @example
 * const {
 *   gameState,
 *   setGameState,
 *   playerId,
 *   setPlayerId,
 *   playerName,
 *   setPlayerName,
 *   gameId,
 *   setGameId
 * } = useGameState();
 */
export const useGameState = () => {
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');

  return {
    gameState,
    setGameState,
    playerId,
    setPlayerId,
    playerName,
    setPlayerName,
    gameId,
    setGameId
  };
};