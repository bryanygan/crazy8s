export const migrateLocalSettings = async (playerId, updateSettingsFunction) => {
  try {
    const localKey = `crazy8s_settings_${playerId}`;
    const localSettings = localStorage.getItem(localKey);
    
    if (!localSettings) {
      return { success: true, message: 'No local settings to migrate' };
    }

    const settings = JSON.parse(localSettings);
    
    const transformedSettings = {
      sortByRank: settings.sortByRank || false,
      groupBySuit: settings.groupBySuit || false,
      experiencedMode: settings.experiencedMode || false,
      enableTimer: settings.enableTimer !== undefined ? settings.enableTimer : true,
      timerDuration: settings.timerDuration || 60,
      timerWarningTime: settings.timerWarningTime || 15,
      cardSortingPreferences: settings.cardSortingPreferences || {},
      theme: settings.theme || 'default',
      soundEnabled: settings.soundEnabled !== undefined ? settings.soundEnabled : true,
      animationsEnabled: settings.animationsEnabled !== undefined ? settings.animationsEnabled : true,
      autoPlay: settings.autoPlay || false,
      customCardback: settings.customCardback || 'default',
      gameHistory: settings.gameHistory || [],
      achievements: settings.achievements || [],
      lastPlayed: settings.lastPlayed || null,
      migrationTimestamp: new Date().toISOString()
    };

    const result = await updateSettingsFunction(transformedSettings);
    
    if (result.success) {
      localStorage.removeItem(localKey);
      console.log(`✅ Successfully migrated settings for player ${playerId}`);
      return { 
        success: true, 
        message: 'Settings migrated successfully',
        settings: transformedSettings,
        migratedKeys: Object.keys(transformedSettings)
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('❌ Settings migration failed:', error);
    return { success: false, error: error.message };
  }
};

export const getAllLocalSettings = () => {
  const localSettings = {};
  const invalidKeys = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('crazy8s_settings_')) {
      const playerId = key.replace('crazy8s_settings_', '');
      try {
        const settings = JSON.parse(localStorage.getItem(key));
        localSettings[playerId] = {
          ...settings,
          _metadata: {
            lastModified: settings._metadata?.lastModified || null,
            version: settings._metadata?.version || '1.0.0',
            playerId: playerId,
            storageKey: key
          }
        };
      } catch (error) {
        console.error(`❌ Error parsing settings for player ${playerId}:`, error);
        invalidKeys.push(key);
      }
    }
  }
  
  // Clean up invalid keys
  invalidKeys.forEach(key => {
    console.warn(`🗑️ Removing invalid settings key: ${key}`);
    localStorage.removeItem(key);
  });
  
  return localSettings;
};

export const clearAllLocalSettings = () => {
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('crazy8s_settings_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  return keysToRemove.length;
};

export const getSettingsForPlayer = (playerId) => {
  const localKey = `crazy8s_settings_${playerId}`;
  const localSettings = localStorage.getItem(localKey);
  
  if (!localSettings) {
    return null;
  }
  
  try {
    return JSON.parse(localSettings);
  } catch (error) {
    console.error(`Error parsing settings for player ${playerId}:`, error);
    return null;
  }
};

export const transformSettingsForAPI = (localSettings) => {
  return {
    // Game preferences
    sortByRank: localSettings.sortByRank || false,
    groupBySuit: localSettings.groupBySuit || false,
    experiencedMode: localSettings.experiencedMode || false,
    autoPlay: localSettings.autoPlay || false,
    
    // Timer settings
    enableTimer: localSettings.enableTimer !== undefined ? localSettings.enableTimer : true,
    timerDuration: localSettings.timerDuration || 60,
    timerWarningTime: localSettings.timerWarningTime || 15,
    
    // UI preferences
    theme: localSettings.theme || 'default',
    soundEnabled: localSettings.soundEnabled !== undefined ? localSettings.soundEnabled : true,
    animationsEnabled: localSettings.animationsEnabled !== undefined ? localSettings.animationsEnabled : true,
    customCardback: localSettings.customCardback || 'default',
    
    // Card preferences
    cardSortingPreferences: localSettings.cardSortingPreferences || {},
    
    // Game data (optional, may be excluded from API)
    gameHistory: localSettings.gameHistory || [],
    achievements: localSettings.achievements || [],
    lastPlayed: localSettings.lastPlayed || null,
    
    // Metadata
    migrationTimestamp: new Date().toISOString(),
    version: '2.0.0'
  };
};

// Advanced settings synchronization utilities
export const createSettingsSync = (authContext) => {
  let syncTimeout = null;
  let syncQueue = [];
  let lastSyncTime = null;
  const SYNC_DEBOUNCE_MS = 1000; // 1 second debounce
  const SYNC_INTERVAL_MS = 30000; // 30 seconds full sync

  const debouncedSync = (settingsUpdate) => {
    syncQueue.push(settingsUpdate);
    
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    
    syncTimeout = setTimeout(async () => {
      await performSync();
    }, SYNC_DEBOUNCE_MS);
  };

  const performSync = async () => {
    if (!authContext.isAuthenticated || syncQueue.length === 0) {
      return;
    }

    try {
      // Merge all queued updates
      const mergedSettings = syncQueue.reduce((acc, update) => ({
        ...acc,
        ...update
      }), {});

      const result = await authContext.updateSettings(mergedSettings);
      
      if (result.success) {
        console.log(`✅ Settings synchronized: ${Object.keys(mergedSettings).join(', ')}`);
        syncQueue = [];
        lastSyncTime = new Date();
      } else {
        console.error('❌ Settings sync failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Settings sync error:', error);
    }
  };

  const syncSettingsToServer = (settingsUpdate) => {
    if (!authContext.isAuthenticated) {
      console.warn('⚠️ Not authenticated, skipping settings sync');
      return;
    }
    
    debouncedSync(settingsUpdate);
  };

  const performFullSync = async () => {
    if (!authContext.isAuthenticated) {
      return;
    }

    try {
      // Get current user settings from server
      const serverSettings = authContext.user?.settings || {};
      
      // Compare with local settings (if any)
      const localSettings = getAllLocalSettings();
      const hasLocalSettings = Object.keys(localSettings).length > 0;
      
      if (hasLocalSettings && !serverSettings.migrationTimestamp) {
        // Trigger migration if server doesn't have migrated settings
        console.log('🔄 Triggering full settings migration...');
        await authContext.migrateLocalSettings();
      }
      
      lastSyncTime = new Date();
      console.log('✅ Full settings sync completed');
    } catch (error) {
      console.error('❌ Full sync error:', error);
    }
  };

  // Start periodic sync
  const startPeriodicSync = () => {
    return setInterval(performFullSync, SYNC_INTERVAL_MS);
  };

  return {
    syncSettingsToServer,
    performFullSync,
    startPeriodicSync,
    isQueueEmpty: () => syncQueue.length === 0,
    getLastSyncTime: () => lastSyncTime
  };
};

// Settings conflict resolution
export const resolveSettingsConflicts = (localSettings, serverSettings) => {
  const conflicts = [];
  const resolved = { ...serverSettings };

  // Check for conflicts
  Object.keys(localSettings).forEach(key => {
    if (key in serverSettings && localSettings[key] !== serverSettings[key]) {
      conflicts.push({
        key,
        localValue: localSettings[key],
        serverValue: serverSettings[key],
        lastModified: {
          local: localSettings._metadata?.lastModified || null,
          server: serverSettings._metadata?.lastModified || null
        }
      });
    }
  });

  // Resolution strategy: prefer most recent, fallback to server
  conflicts.forEach(conflict => {
    const localTime = new Date(conflict.lastModified.local || 0);
    const serverTime = new Date(conflict.lastModified.server || 0);
    
    if (localTime > serverTime) {
      resolved[conflict.key] = conflict.localValue;
      console.log(`🔄 Resolved conflict for ${conflict.key}: using local value`);
    } else {
      console.log(`🔄 Resolved conflict for ${conflict.key}: using server value`);
    }
  });

  return {
    resolved,
    conflicts,
    hasConflicts: conflicts.length > 0
  };
};

// Enhanced backward compatibility
export const createBackwardCompatibleSettings = (authContext) => {
  return {
    getSettings: () => {
      if (authContext.isAuthenticated) {
        return authContext.user?.settings || {};
      }
      
      // Fallback to localStorage for unauthenticated users
      const playerId = 'guest'; // or generate consistent guest ID
      return getSettingsForPlayer(playerId) || {};
    },
    
    updateSettings: async (settingsUpdate) => {
      if (authContext.isAuthenticated) {
        return await authContext.updateSettings(settingsUpdate);
      }
      
      // Update localStorage for unauthenticated users
      const playerId = 'guest';
      const currentSettings = getSettingsForPlayer(playerId) || {};
      const newSettings = {
        ...currentSettings,
        ...settingsUpdate,
        _metadata: {
          lastModified: new Date().toISOString(),
          version: '2.0.0'
        }
      };
      
      localStorage.setItem(`crazy8s_settings_${playerId}`, JSON.stringify(newSettings));
      return { success: true, settings: newSettings };
    }
  };
};