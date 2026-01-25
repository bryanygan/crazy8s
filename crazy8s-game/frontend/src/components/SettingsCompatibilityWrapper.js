import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettingsSync } from '../hooks/useSettingsSync';
import { getSettingsForPlayer } from '../utils/settingsMigration';

// Backward compatibility wrapper for settings
const SettingsCompatibilityWrapper = ({ children, playerId, onSettingsChange }) => {
  const { isAuthenticated, user } = useAuth();
  const { settings: syncedSettings, updateSettings, isLoading } = useSettingsSync();
  const [legacyMode, setLegacyMode] = useState(false);
  const [localSettings, setLocalSettings] = useState({});
  const settingsRef = useRef({});

  // Default settings
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

  // Determine if we should use legacy localStorage mode
  useEffect(() => {
    if (!isAuthenticated) {
      setLegacyMode(true);
      
      // Load from localStorage for unauthenticated users
      if (playerId) {
        const localPlayerSettings = getSettingsForPlayer(playerId) || {};
        const mergedSettings = { ...defaultSettings, ...localPlayerSettings };
        setLocalSettings(mergedSettings);
        settingsRef.current = mergedSettings;
        
        if (onSettingsChange) {
          onSettingsChange(mergedSettings);
        }
      }
    } else {
      setLegacyMode(false);
      
      // Use synced settings for authenticated users
      if (!isLoading && syncedSettings) {
        const mergedSettings = { ...defaultSettings, ...syncedSettings };
        settingsRef.current = mergedSettings;
        
        if (onSettingsChange) {
          onSettingsChange(mergedSettings);
        }
      }
    }
  }, [isAuthenticated, playerId, syncedSettings, isLoading, onSettingsChange]);

  // Handle settings updates
  const handleSettingsUpdate = async (newSettings) => {
    const updatedSettings = { ...settingsRef.current, ...newSettings };
    settingsRef.current = updatedSettings;

    if (legacyMode) {
      // Update localStorage for unauthenticated users
      setLocalSettings(updatedSettings);
      if (playerId) {
        const settingsToSave = {
          ...updatedSettings,
          _metadata: {
            lastModified: new Date().toISOString(),
            version: '2.0.0',
            playerId: playerId
          }
        };
        localStorage.setItem(`crazy8s_settings_${playerId}`, JSON.stringify(settingsToSave));
      }
    } else {
      // Update via settings sync for authenticated users
      await updateSettings(newSettings);
    }

    // Notify parent component
    if (onSettingsChange) {
      onSettingsChange(updatedSettings);
    }
  };

  // Get current effective settings
  const getCurrentSettings = () => {
    if (legacyMode) {
      return { ...defaultSettings, ...localSettings };
    } else {
      return { ...defaultSettings, ...syncedSettings };
    }
  };

  // Settings validation
  const validateTimerSettings = (settings) => {
    const validated = { ...settings };
    if (validated.timerDuration < 15) validated.timerDuration = 15;
    if (validated.timerDuration > 300) validated.timerDuration = 300;
    const maxWarning = Math.floor(validated.timerDuration * 0.5);
    if (validated.timerWarningTime < 5) validated.timerWarningTime = 5;
    if (validated.timerWarningTime > maxWarning) validated.timerWarningTime = maxWarning;
    return validated;
  };

  // Enhanced settings update with validation
  const updateSettingsWithValidation = async (newSettings) => {
    const validatedSettings = validateTimerSettings(newSettings);
    await handleSettingsUpdate(validatedSettings);
    return validatedSettings;
  };

  // Migration helper for switching from guest to authenticated
  useEffect(() => {
    if (isAuthenticated && user && legacyMode) {
      console.log('🔄 User authenticated, switching from legacy mode to synced settings');
      setLegacyMode(false);
      
      // Migration is handled automatically by AuthContext performAutoMigration
      // We just need to switch modes
    }
  }, [isAuthenticated, user, legacyMode]);

  // Provide context values to children
  const contextValue = {
    settings: getCurrentSettings(),
    updateSettings: updateSettingsWithValidation,
    isAuthenticated,
    legacyMode,
    isLoading: legacyMode ? false : isLoading,
    
    // Convenience methods
    toggleSetting: async (key) => {
      const currentSettings = getCurrentSettings();
      await updateSettingsWithValidation({ [key]: !currentSettings[key] });
    },
    
    setSetting: async (key, value) => {
      await updateSettingsWithValidation({ [key]: value });
    },
    
    resetSettings: async () => {
      await updateSettingsWithValidation(defaultSettings);
    },
    
    // Status helpers
    hasUnsavedChanges: false, // TODO: Implement if needed
    syncStatus: legacyMode ? 'local' : 'synced'
  };

  // Clone children with context
  return React.cloneElement(children, {
    settingsContext: contextValue
  });
};

export default SettingsCompatibilityWrapper;