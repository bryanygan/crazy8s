import React, { useState } from 'react';
import { useSettingsSync, useGameSettings, useTimerSettings, useUISettings } from '../../hooks/useSettingsSync';
import { colors, shadows, borderRadius, transitions } from '../../utils/theme';

const SettingsPanel = () => {
  const { 
    isLoading, 
    syncStatus, 
    lastSyncTime, 
    performFullSync, 
    resetSettings, 
    importSettings 
  } = useSettingsSync();
  
  const gameSettings = useGameSettings();
  const timerSettings = useTimerSettings();
  const uiSettings = useUISettings();
  
  const [activeTab, setActiveTab] = useState('game');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState('');

  const tabs = [
    { id: 'game', label: '🎮 Game', icon: '🎮' },
    { id: 'timer', label: '⏱️ Timer', icon: '⏱️' },
    { id: 'ui', label: '🎨 Interface', icon: '🎨' },
    { id: 'advanced', label: '⚙️ Advanced', icon: '⚙️' }
  ];

  const handleImportSettings = () => {
    try {
      const parsed = JSON.parse(importText);
      importSettings(parsed);
      setShowImportDialog(false);
      setImportText('');
    } catch (error) {
      alert('Invalid settings format. Please check your input.');
    }
  };

  const exportSettings = () => {
    const allSettings = {
      ...gameSettings,
      ...timerSettings,
      ...uiSettings
    };
    
    // Remove function properties
    const exportData = Object.fromEntries(
      Object.entries(allSettings).filter(([key, value]) => typeof value !== 'function')
    );
    
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    alert('Settings copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: colors.darkGray
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚙️</div>
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: colors.background,
      borderRadius: borderRadius.large,
      padding: '20px',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: `2px solid ${colors.border}`
      }}>
        <h3 style={{
          margin: 0,
          color: colors.dark,
          fontSize: '20px'
        }}>
          ⚙️ Game Settings
        </h3>
        
        {/* Sync Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          color: colors.darkGray
        }}>
          {syncStatus === 'syncing' && (
            <span style={{ color: colors.primary }}>🔄 Syncing...</span>
          )}
          {syncStatus === 'success' && (
            <span style={{ color: colors.success }}>✅ Synced</span>
          )}
          {syncStatus === 'error' && (
            <span style={{ color: colors.error }}>❌ Sync Error</span>
          )}
          {lastSyncTime && (
            <span>Last sync: {lastSyncTime.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '5px',
        marginBottom: '20px',
        backgroundColor: colors.white,
        padding: '5px',
        borderRadius: borderRadius.medium,
        boxShadow: shadows.small
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 15px',
              border: 'none',
              borderRadius: borderRadius.small,
              backgroundColor: activeTab === tab.id ? colors.primary : 'transparent',
              color: activeTab === tab.id ? colors.white : colors.darkGray,
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              transition: transitions.fast
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.medium,
        padding: '20px',
        boxShadow: shadows.small
      }}>
        {/* Game Settings Tab */}
        {activeTab === 'game' && (
          <div>
            <h4 style={{ margin: '0 0 15px 0', color: colors.dark }}>🎮 Game Preferences</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <SettingToggle
                label="Sort cards by rank"
                description="Group cards by numerical value"
                checked={gameSettings.sortByRank}
                onChange={gameSettings.toggleSortByRank}
              />
              
              <SettingToggle
                label="Group cards by suit"
                description="Organize cards by suit (hearts, diamonds, etc.)"
                checked={gameSettings.groupBySuit}
                onChange={gameSettings.toggleGroupBySuit}
              />
              
              <SettingToggle
                label="Experienced mode"
                description="Enable advanced game features and faster gameplay"
                checked={gameSettings.experiencedMode}
                onChange={gameSettings.toggleExperiencedMode}
              />
              
              <SettingToggle
                label="Auto-play obvious moves"
                description="Automatically play cards when only one valid move"
                checked={gameSettings.autoPlay}
                onChange={gameSettings.toggleAutoPlay}
              />
            </div>
          </div>
        )}

        {/* Timer Settings Tab */}
        {activeTab === 'timer' && (
          <div>
            <h4 style={{ margin: '0 0 15px 0', color: colors.dark }}>⏱️ Timer Settings</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <SettingToggle
                label="Enable turn timer"
                description="Limit time for each player's turn"
                checked={timerSettings.enableTimer}
                onChange={timerSettings.toggleTimer}
              />
              
              {timerSettings.enableTimer && (
                <>
                  <SettingSlider
                    label="Turn duration"
                    description={`Each turn lasts ${timerSettings.timerDuration} seconds`}
                    value={timerSettings.timerDuration}
                    min={15}
                    max={180}
                    step={15}
                    onChange={timerSettings.setTimerDuration}
                    unit="seconds"
                  />
                  
                  <SettingSlider
                    label="Warning time"
                    description={`Show warning ${timerSettings.timerWarningTime} seconds before timeout`}
                    value={timerSettings.timerWarningTime}
                    min={5}
                    max={30}
                    step={5}
                    onChange={timerSettings.setTimerWarningTime}
                    unit="seconds"
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* UI Settings Tab */}
        {activeTab === 'ui' && (
          <div>
            <h4 style={{ margin: '0 0 15px 0', color: colors.dark }}>🎨 Interface</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <SettingToggle
                label="Sound effects"
                description="Play sounds for game actions"
                checked={uiSettings.soundEnabled}
                onChange={uiSettings.toggleSound}
              />
              
              <SettingToggle
                label="Animations"
                description="Enable smooth card animations"
                checked={uiSettings.animationsEnabled}
                onChange={uiSettings.toggleAnimations}
              />
              
              <SettingSelect
                label="Theme"
                description="Choose your visual theme"
                value={uiSettings.theme}
                onChange={uiSettings.setTheme}
                options={[
                  { value: 'default', label: 'Default' },
                  { value: 'dark', label: 'Dark Mode' },
                  { value: 'colorful', label: 'Colorful' },
                  { value: 'minimal', label: 'Minimal' }
                ]}
              />
              
              <SettingSelect
                label="Card back design"
                description="Choose your card back pattern"
                value={uiSettings.customCardback}
                onChange={uiSettings.setCustomCardback}
                options={[
                  { value: 'default', label: 'Classic Blue' },
                  { value: 'red', label: 'Classic Red' },
                  { value: 'green', label: 'Forest Green' },
                  { value: 'purple', label: 'Royal Purple' },
                  { value: 'gold', label: 'Golden' }
                ]}
              />
            </div>
          </div>
        )}

        {/* Advanced Settings Tab */}
        {activeTab === 'advanced' && (
          <div>
            <h4 style={{ margin: '0 0 15px 0', color: colors.dark }}>⚙️ Advanced</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{
                padding: '15px',
                backgroundColor: colors.background,
                borderRadius: borderRadius.medium,
                border: `1px solid ${colors.border}`
              }}>
                <h5 style={{ margin: '0 0 10px 0', color: colors.dark }}>🔄 Synchronization</h5>
                <button
                  onClick={performFullSync}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: colors.primary,
                    color: colors.white,
                    border: 'none',
                    borderRadius: borderRadius.small,
                    cursor: 'pointer',
                    fontSize: '13px',
                    marginRight: '10px'
                  }}
                >
                  Force Sync
                </button>
                <span style={{ fontSize: '12px', color: colors.darkGray }}>
                  Manually sync settings with server
                </span>
              </div>
              
              <div style={{
                padding: '15px',
                backgroundColor: colors.background,
                borderRadius: borderRadius.medium,
                border: `1px solid ${colors.border}`
              }}>
                <h5 style={{ margin: '0 0 10px 0', color: colors.dark }}>📦 Import/Export</h5>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <button
                    onClick={exportSettings}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: colors.secondary,
                      color: colors.white,
                      border: 'none',
                      borderRadius: borderRadius.small,
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    📋 Export
                  </button>
                  <button
                    onClick={() => setShowImportDialog(true)}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: colors.warning,
                      color: colors.white,
                      border: 'none',
                      borderRadius: borderRadius.small,
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    📥 Import
                  </button>
                </div>
                <span style={{ fontSize: '12px', color: colors.darkGray }}>
                  Backup or restore your settings
                </span>
              </div>
              
              <div style={{
                padding: '15px',
                backgroundColor: '#ffeaa7',
                borderRadius: borderRadius.medium,
                border: `1px solid ${colors.warning}`
              }}>
                <h5 style={{ margin: '0 0 10px 0', color: colors.dark }}>🔄 Reset Settings</h5>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all settings to default?')) {
                      resetSettings();
                    }
                  }}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: colors.error,
                    color: colors.white,
                    border: 'none',
                    borderRadius: borderRadius.small,
                    cursor: 'pointer',
                    fontSize: '13px',
                    marginBottom: '10px'
                  }}
                >
                  ⚠️ Reset All
                </button>
                <div style={{ fontSize: '12px', color: colors.darkGray }}>
                  This will restore all settings to their default values
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.authOverlay,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000
        }}>
          <div style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.large,
            padding: '25px',
            width: '400px',
            maxWidth: '90vw',
            boxShadow: shadows.large
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: colors.dark }}>
              📥 Import Settings
            </h4>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste your exported settings JSON here..."
              style={{
                width: '100%',
                height: '120px',
                padding: '10px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.medium,
                fontSize: '12px',
                fontFamily: 'monospace',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '15px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowImportDialog(false)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: colors.lightGray,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.small,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleImportSettings}
                style={{
                  padding: '8px 15px',
                  backgroundColor: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.small,
                  cursor: 'pointer'
                }}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const SettingToggle = ({ label, description, checked, onChange }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: `1px solid ${colors.border}`
  }}>
    <div>
      <div style={{ fontWeight: 'bold', color: colors.dark, marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '12px', color: colors.darkGray }}>
        {description}
      </div>
    </div>
    <label style={{
      position: 'relative',
      display: 'inline-block',
      width: '44px',
      height: '24px'
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span style={{
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: checked ? colors.primary : colors.lightGray,
        transition: transitions.fast,
        borderRadius: '24px'
      }}>
        <span style={{
          position: 'absolute',
          content: '',
          height: '18px',
          width: '18px',
          left: checked ? '23px' : '3px',
          bottom: '3px',
          backgroundColor: 'white',
          transition: transitions.fast,
          borderRadius: '50%'
        }} />
      </span>
    </label>
  </div>
);

const SettingSlider = ({ label, description, value, min, max, step, onChange, unit }) => (
  <div style={{
    padding: '12px 0',
    borderBottom: `1px solid ${colors.border}`
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    }}>
      <div>
        <div style={{ fontWeight: 'bold', color: colors.dark }}>
          {label}
        </div>
        <div style={{ fontSize: '12px', color: colors.darkGray }}>
          {description}
        </div>
      </div>
      <span style={{
        fontSize: '14px',
        fontWeight: 'bold',
        color: colors.primary,
        minWidth: '60px',
        textAlign: 'right'
      }}>
        {value} {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      style={{
        width: '100%',
        height: '6px',
        borderRadius: '3px',
        background: `linear-gradient(to right, ${colors.primary} 0%, ${colors.primary} ${((value - min) / (max - min)) * 100}%, ${colors.border} ${((value - min) / (max - min)) * 100}%, ${colors.border} 100%)`,
        outline: 'none',
        appearance: 'none'
      }}
    />
  </div>
);

const SettingSelect = ({ label, description, value, onChange, options }) => (
  <div style={{
    padding: '12px 0',
    borderBottom: `1px solid ${colors.border}`
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ fontWeight: 'bold', color: colors.dark, marginBottom: '2px' }}>
          {label}
        </div>
        <div style={{ fontSize: '12px', color: colors.darkGray }}>
          {description}
        </div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '6px 10px',
          border: `1px solid ${colors.border}`,
          borderRadius: borderRadius.small,
          backgroundColor: colors.white,
          color: colors.dark,
          fontSize: '13px',
          minWidth: '120px'
        }}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default SettingsPanel;