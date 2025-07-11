import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createSettingsSync, createBackwardCompatibleSettings } from '../utils/settingsMigration';

export const useSettingsSync = () => {
  const authContext = useAuth();
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error, success
  const settingsSyncRef = useRef(null);
  const periodicSyncRef = useRef(null);
  const backwardCompatibleRef = useRef(null);

  // Initialize settings sync utilities
  useEffect(() => {
    settingsSyncRef.current = createSettingsSync(authContext);
    backwardCompatibleRef.current = createBackwardCompatibleSettings(authContext);
    
    // Start periodic sync for authenticated users
    if (authContext.isAuthenticated) {
      periodicSyncRef.current = settingsSyncRef.current.startPeriodicSync();
    }
    
    return () => {
      if (periodicSyncRef.current) {
        clearInterval(periodicSyncRef.current);
      }
    };
  }, [authContext.isAuthenticated, authContext]);

  // Load initial settings
  useEffect(() => {
    const loadInitialSettings = async () => {
      setIsLoading(true);
      try {
        if (authContext.isAuthenticated) {
          // Load from user account
          const userSettings = authContext.user?.settings || {};
          setSettings(userSettings);
          console.log('📱 Loaded settings from user account');
        } else {
          // Load from localStorage for guests
          const localSettings = backwardCompatibleRef.current?.getSettings() || {};
          setSettings(localSettings);
          console.log('📱 Loaded settings from localStorage');
        }
      } catch (error) {
        console.error('❌ Failed to load initial settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authContext.isLoading) {
      loadInitialSettings();
    }
  }, [authContext.isAuthenticated, authContext.isLoading, authContext.user]);

  // Sync settings to server (authenticated) or localStorage (guest)
  const updateSettings = useCallback(async (settingsUpdate) => {
    setSyncStatus('syncing');
    
    try {
      const result = await backwardCompatibleRef.current?.updateSettings(settingsUpdate);
      
      if (result?.success) {
        // Update local state immediately for optimistic UI
        setSettings(prev => ({
          ...prev,
          ...settingsUpdate
        }));
        
        // For authenticated users, also sync to server
        if (authContext.isAuthenticated && settingsSyncRef.current) {
          settingsSyncRef.current.syncSettingsToServer(settingsUpdate);
        }
        
        setSyncStatus('success');
        setLastSyncTime(new Date());
        
        // Reset status after a delay
        setTimeout(() => setSyncStatus('idle'), 2000);
        
        return { success: true, settings: result.settings };
      } else {
        setSyncStatus('error');
        return { success: false, error: result?.error || 'Settings update failed' };
      }
    } catch (error) {
      console.error('❌ Settings update error:', error);
      setSyncStatus('error');
      return { success: false, error: error.message };
    }
  }, [authContext.isAuthenticated]);

  // Force full sync with server
  const performFullSync = useCallback(async () => {
    if (!authContext.isAuthenticated || !settingsSyncRef.current) {
      return { success: false, error: 'Not authenticated' };
    }
    
    setSyncStatus('syncing');
    
    try {
      await settingsSyncRef.current.performFullSync();
      
      // Reload settings from user account
      const userSettings = authContext.user?.settings || {};
      setSettings(userSettings);
      
      setSyncStatus('success');
      setLastSyncTime(new Date());
      
      setTimeout(() => setSyncStatus('idle'), 2000);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Full sync error:', error);
      setSyncStatus('error');
      return { success: false, error: error.message };
    }
  }, [authContext.isAuthenticated, authContext.user]);

  // Get sync queue status
  const getSyncStatus = useCallback(() => {
    if (!settingsSyncRef.current) {
      return { hasQueuedChanges: false, lastSyncTime: null };
    }
    
    return {
      hasQueuedChanges: !settingsSyncRef.current.isQueueEmpty(),
      lastSyncTime: settingsSyncRef.current.getLastSyncTime()
    };
  }, []);

  // Individual setting update helpers
  const updateSetting = useCallback((key, value) => {
    return updateSettings({ [key]: value });
  }, [updateSettings]);

  const toggleSetting = useCallback((key) => {
    const currentValue = settings[key];
    return updateSettings({ [key]: !currentValue });
  }, [settings, updateSettings]);

  // Bulk settings operations
  const resetSettings = useCallback(() => {
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
    
    return updateSettings(defaultSettings);
  }, [updateSettings]);

  const importSettings = useCallback((importedSettings) => {
    // Validate and sanitize imported settings
    const validatedSettings = {};
    const allowedKeys = [
      'sortByRank', 'groupBySuit', 'experiencedMode', 'enableTimer',
      'timerDuration', 'timerWarningTime', 'theme', 'soundEnabled',
      'animationsEnabled', 'autoPlay', 'customCardback', 'cardSortingPreferences'
    ];
    
    allowedKeys.forEach(key => {
      if (key in importedSettings) {
        validatedSettings[key] = importedSettings[key];
      }
    });
    
    return updateSettings(validatedSettings);
  }, [updateSettings]);

  return {
    // Current settings state
    settings,
    isLoading,
    
    // Sync status
    syncStatus,
    lastSyncTime,
    
    // Update methods
    updateSettings,
    updateSetting,
    toggleSetting,
    
    // Bulk operations
    resetSettings,
    importSettings,
    performFullSync,
    
    // Status helpers
    getSyncStatus,
    
    // Convenience getters
    isAuthenticated: authContext.isAuthenticated,
    isSyncing: syncStatus === 'syncing',
    hasError: syncStatus === 'error',
    isIdle: syncStatus === 'idle'
  };
};

// Hook for specific setting types
export const useGameSettings = () => {
  const { settings, updateSetting, toggleSetting } = useSettingsSync();
  
  return {
    sortByRank: settings.sortByRank || false,
    groupBySuit: settings.groupBySuit || false,
    experiencedMode: settings.experiencedMode || false,
    autoPlay: settings.autoPlay || false,
    cardSortingPreferences: settings.cardSortingPreferences || {},
    
    setSortByRank: (value) => updateSetting('sortByRank', value),
    setGroupBySuit: (value) => updateSetting('groupBySuit', value),
    setExperiencedMode: (value) => updateSetting('experiencedMode', value),
    setAutoPlay: (value) => updateSetting('autoPlay', value),
    
    toggleSortByRank: () => toggleSetting('sortByRank'),
    toggleGroupBySuit: () => toggleSetting('groupBySuit'),
    toggleExperiencedMode: () => toggleSetting('experiencedMode'),
    toggleAutoPlay: () => toggleSetting('autoPlay')
  };
};

export const useTimerSettings = () => {
  const { settings, updateSetting, updateSettings, toggleSetting } = useSettingsSync();
  
  return {
    enableTimer: settings.enableTimer !== undefined ? settings.enableTimer : true,
    timerDuration: settings.timerDuration || 60,
    timerWarningTime: settings.timerWarningTime || 15,
    
    setEnableTimer: (value) => updateSetting('enableTimer', value),
    setTimerDuration: (value) => updateSetting('timerDuration', value),
    setTimerWarningTime: (value) => updateSetting('timerWarningTime', value),
    
    toggleTimer: () => toggleSetting('enableTimer'),
    
    setTimerSettings: (timerSettings) => updateSettings({
      enableTimer: timerSettings.enableTimer,
      timerDuration: timerSettings.timerDuration,
      timerWarningTime: timerSettings.timerWarningTime
    })
  };
};

export const useUISettings = () => {
  const { settings, updateSetting, toggleSetting } = useSettingsSync();
  
  return {
    theme: settings.theme || 'default',
    soundEnabled: settings.soundEnabled !== undefined ? settings.soundEnabled : true,
    animationsEnabled: settings.animationsEnabled !== undefined ? settings.animationsEnabled : true,
    customCardback: settings.customCardback || 'default',
    
    setTheme: (value) => updateSetting('theme', value),
    setSoundEnabled: (value) => updateSetting('soundEnabled', value),
    setAnimationsEnabled: (value) => updateSetting('animationsEnabled', value),
    setCustomCardback: (value) => updateSetting('customCardback', value),
    
    toggleSound: () => toggleSetting('soundEnabled'),
    toggleAnimations: () => toggleSetting('animationsEnabled')
  };
};