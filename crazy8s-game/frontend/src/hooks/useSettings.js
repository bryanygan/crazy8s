import { useState } from 'react';

/**
 * Custom hook for managing game settings and preferences
 * 
 * @returns {Object} Settings management object
 * @returns {Object} returns.settings - Current settings configuration
 * @returns {boolean} returns.settings.sortByRank - Whether to sort cards by rank
 * @returns {boolean} returns.settings.groupBySuit - Whether to group cards by suit
 * @returns {boolean} returns.settings.experiencedMode - Whether experienced mode is enabled
 * @returns {boolean} returns.settings.enableTimer - Whether turn timer is enabled
 * @returns {number} returns.settings.timerDuration - Timer duration in seconds
 * @returns {number} returns.settings.timerWarningTime - Warning time threshold in seconds
 * @returns {Function} returns.updateSettings - Function to update specific settings
 * @returns {Function} returns.resetSettings - Function to reset all settings to defaults
 * @returns {Function} returns.setSettings - Function to set all settings at once
 * 
 * @example
 * const { settings, updateSettings, resetSettings } = useSettings();
 * 
 * // Update a specific setting
 * updateSettings({ sortByRank: true });
 * 
 * // Reset all settings
 * resetSettings();
 */
export const useSettings = () => {
  const [settings, setSettings] = useState({
    sortByRank: false,
    groupBySuit: false,
    experiencedMode: false,
    enableTimer: true,
    timerDuration: 60,
    timerWarningTime: 15
  });

  /**
   * Update specific settings while preserving existing ones
   * @param {Object} newSettings - Object containing settings to update
   */
  const updateSettings = (newSettings) => {
    setSettings(prevSettings => ({
      ...prevSettings,
      ...newSettings
    }));
  };

  /**
   * Reset all settings to their default values
   */
  const resetSettings = () => {
    setSettings({
      sortByRank: false,
      groupBySuit: false,
      experiencedMode: false,
      enableTimer: true,
      timerDuration: 60,
      timerWarningTime: 15
    });
  };

  return { settings, updateSettings, resetSettings, setSettings };
};