/**
 * Game State Restoration Utility
 * 
 * Handles restoration of game state after reconnection,
 * ensuring proper synchronization between client and server state.
 */

/**
 * Restore game state from server data
 * 
 * @param {Object} serverGameState - Game state from server
 * @param {Object} localGameState - Current local game state
 * @param {Object} options - Restoration options
 * @returns {Object} Restoration result
 */
export const restoreGameState = (serverGameState, localGameState = null, options = {}) => {
  const {
    preserveLocalChanges = false,
    validateBeforeRestore = true,
    mergeStrategies = {}
  } = options;

  console.log('🔄 Restoring game state:', {
    server: serverGameState,
    local: localGameState,
    options
  });

  try {
    // Validate server game state
    if (validateBeforeRestore && !isValidGameState(serverGameState)) {
      throw new Error('Invalid game state received from server');
    }

    // If no local state, use server state directly
    if (!localGameState) {
      return {
        success: true,
        gameState: serverGameState,
        changes: [],
        conflicts: []
      };
    }

    // Detect conflicts between local and server state
    const conflicts = detectStateConflicts(localGameState, serverGameState);
    const changes = calculateStateChanges(localGameState, serverGameState);

    // Resolve conflicts based on merge strategies
    const resolvedState = resolveStateConflicts(
      localGameState,
      serverGameState,
      conflicts,
      mergeStrategies
    );

    return {
      success: true,
      gameState: resolvedState,
      changes,
      conflicts
    };

  } catch (error) {
    console.error('❌ Failed to restore game state:', error);
    return {
      success: false,
      error: error.message,
      gameState: localGameState || serverGameState,
      changes: [],
      conflicts: []
    };
  }
};

/**
 * Handle game state restoration with UI updates
 * 
 * @param {Object} restorationData - Data from restoreGameState
 * @param {Object} handlers - UI update handlers
 * @returns {boolean} Success status
 */
export const handleGameStateRestoration = (restorationData, handlers = {}) => {
  const {
    onStateRestored,
    onConflictsDetected,
    onChangesApplied,
    onRestorationFailed
  } = handlers;

  console.log('🎮 Handling game state restoration:', restorationData);

  try {
    if (!restorationData.success) {
      if (onRestorationFailed) {
        onRestorationFailed(restorationData);
      }
      return false;
    }

    // Notify about conflicts
    if (restorationData.conflicts.length > 0 && onConflictsDetected) {
      onConflictsDetected(restorationData.conflicts);
    }

    // Notify about changes
    if (restorationData.changes.length > 0 && onChangesApplied) {
      onChangesApplied(restorationData.changes);
    }

    // Notify about successful restoration
    if (onStateRestored) {
      onStateRestored(restorationData.gameState);
    }

    return true;

  } catch (error) {
    console.error('❌ Failed to handle game state restoration:', error);
    
    if (onRestorationFailed) {
      onRestorationFailed({ error: error.message });
    }
    
    return false;
  }
};

/**
 * Validate game state structure
 * 
 * @param {Object} gameState - Game state to validate
 * @returns {boolean} True if valid
 */
const isValidGameState = (gameState) => {
  if (!gameState || typeof gameState !== 'object') return false;

  // Check required fields
  const requiredFields = ['gameId', 'gameState', 'players'];
  for (const field of requiredFields) {
    if (!(field in gameState)) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }

  // Validate game state value
  const validStates = ['waiting', 'playing', 'finished', 'paused'];
  if (!validStates.includes(gameState.gameState)) {
    console.error(`Invalid game state: ${gameState.gameState}`);
    return false;
  }

  // Validate players array
  if (!Array.isArray(gameState.players)) {
    console.error('Players must be an array');
    return false;
  }

  return true;
};

/**
 * Detect conflicts between local and server state
 * 
 * @param {Object} localState - Local game state
 * @param {Object} serverState - Server game state
 * @returns {Array} Array of conflicts
 */
const detectStateConflicts = (localState, serverState) => {
  const conflicts = [];

  // Check for basic state conflicts
  if (localState.gameState !== serverState.gameState) {
    conflicts.push({
      field: 'gameState',
      local: localState.gameState,
      server: serverState.gameState,
      type: 'value_mismatch'
    });
  }

  if (localState.currentPlayer !== serverState.currentPlayer) {
    conflicts.push({
      field: 'currentPlayer',
      local: localState.currentPlayer,
      server: serverState.currentPlayer,
      type: 'value_mismatch'
    });
  }

  // Check for player list conflicts
  if (localState.players && serverState.players) {
    const localPlayerIds = localState.players.map(p => p.id).sort();
    const serverPlayerIds = serverState.players.map(p => p.id).sort();
    
    if (JSON.stringify(localPlayerIds) !== JSON.stringify(serverPlayerIds)) {
      conflicts.push({
        field: 'players',
        local: localPlayerIds,
        server: serverPlayerIds,
        type: 'array_mismatch'
      });
    }
  }

  return conflicts;
};

/**
 * Calculate changes between states
 * 
 * @param {Object} oldState - Previous state
 * @param {Object} newState - New state
 * @returns {Array} Array of changes
 */
const calculateStateChanges = (oldState, newState) => {
  const changes = [];

  // Compare all top-level properties
  const allKeys = new Set([...Object.keys(oldState), ...Object.keys(newState)]);
  
  for (const key of allKeys) {
    const oldValue = oldState[key];
    const newValue = newState[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue,
        newValue,
        type: oldValue === undefined ? 'added' : 
              newValue === undefined ? 'removed' : 'modified'
      });
    }
  }

  return changes;
};

/**
 * Resolve state conflicts using merge strategies
 * 
 * @param {Object} localState - Local state
 * @param {Object} serverState - Server state
 * @param {Array} conflicts - Detected conflicts
 * @param {Object} mergeStrategies - Custom merge strategies
 * @returns {Object} Resolved state
 */
const resolveStateConflicts = (localState, serverState, conflicts, mergeStrategies) => {
  // Start with server state as base (server is authoritative)
  const resolvedState = { ...serverState };

  // Apply custom merge strategies
  for (const conflict of conflicts) {
    const strategy = mergeStrategies[conflict.field];
    
    if (strategy) {
      switch (strategy) {
        case 'prefer_local':
          resolvedState[conflict.field] = conflict.local;
          break;
        case 'prefer_server':
          resolvedState[conflict.field] = conflict.server;
          break;
        case 'merge':
          // Custom merge logic could be implemented here
          resolvedState[conflict.field] = conflict.server;
          break;
        default:
          // Default to server value
          resolvedState[conflict.field] = conflict.server;
      }
    }
  }

  return resolvedState;
};

/**
 * Create a game state snapshot for saving
 * 
 * @param {Object} gameState - Current game state
 * @param {Object} playerContext - Player-specific context
 * @returns {Object} State snapshot
 */
export const createGameStateSnapshot = (gameState, playerContext = {}) => {
  return {
    gameState: { ...gameState },
    playerContext: { ...playerContext },
    timestamp: Date.now(),
    version: '1.0.0'
  };
};

/**
 * Restore game state from snapshot
 * 
 * @param {Object} snapshot - Saved state snapshot
 * @param {Object} options - Restoration options
 * @returns {Object} Restoration result
 */
export const restoreFromSnapshot = (snapshot, options = {}) => {
  const { maxAge = 30 * 60 * 1000 } = options; // 30 minutes default

  if (!snapshot || !snapshot.gameState) {
    return { success: false, error: 'Invalid snapshot' };
  }

  // Check if snapshot is too old
  const age = Date.now() - snapshot.timestamp;
  if (age > maxAge) {
    return { success: false, error: 'Snapshot too old' };
  }

  return {
    success: true,
    gameState: snapshot.gameState,
    playerContext: snapshot.playerContext,
    age
  };
};

// Export utility functions for testing
export {
  isValidGameState,
  detectStateConflicts,
  calculateStateChanges,
  resolveStateConflicts
};