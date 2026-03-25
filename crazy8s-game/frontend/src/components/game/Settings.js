import React from 'react';
import CardSortingPreferences from '../CardSortingPreferences';
import { FaCog, FaTimes, FaGamepad, FaExclamationTriangle } from 'react-icons/fa';
import { GiSpadeSkull } from 'react-icons/gi';

const Settings = ({ isOpen, onClose, settings, onSettingsChange, setToasts }) => {
  if (!isOpen) return null;

  const handleSettingChange = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        overflowY: 'auto'
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          padding: '30px',
          borderRadius: '15px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '25px'
        }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}><FaCog style={{ marginRight: '8px' }} />Game Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#95a5a6'
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Card Display Settings */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}><GiSpadeSkull style={{ marginRight: '8px' }} />Card Display</h3>

          {/* Sort by Rank */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '2px', color: '#2c3e50' }}>Sort by Rank</div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Order cards by rank (2, 3, 4... Jack, Queen, King, Ace)
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.sortByRank}
                onChange={(e) => handleSettingChange('sortByRank', e.target.checked)}
                style={{ marginRight: '8px', transform: 'scale(1.2)' }}
              />
            </label>
          </div>

          {/* Group by Suit */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '2px', color: '#2c3e50' }}>Group by Suit</div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Group cards by suit (Hearts, Diamonds, Clubs, Spades)
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.groupBySuit}
                onChange={(e) => handleSettingChange('groupBySuit', e.target.checked)}
                style={{ marginRight: '8px', transform: 'scale(1.2)' }}
              />
            </label>
          </div>

          {/* Card Sorting Preferences - Only show when Sort by Rank is enabled */}
          {settings.sortByRank && (
            <CardSortingPreferences
              settings={settings}
              onSettingsChange={onSettingsChange}
              theme={{
                colors: {
                  background: '#fff',
                  text: '#2c3e50',
                  secondary: '#6c757d',
                  border: '#dee2e6',
                  success: '#27ae60',
                  error: '#e74c3c',
                  info: '#3498db'
                },
                spacing: {
                  small: '8px',
                  medium: '16px',
                  large: '24px'
                },
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onShowToast={(message, type) => {
                const toast = {
                  id: Date.now(),
                  message,
                  type: type || 'info',
                  timestamp: Date.now()
                };
                setToasts(prev => [...prev, toast]);
              }}
            />
          )}
        </div>

        {/* Gameplay Settings */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}><FaGamepad style={{ marginRight: '8px' }} />Gameplay</h3>

          {/* Experienced Mode */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '2px', color: '#2c3e50' }}>Experienced Mode</div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Show all cards clearly - removes graying out of unplayable cards
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.experiencedMode}
                onChange={(e) => handleSettingChange('experiencedMode', e.target.checked)}
                style={{ marginRight: '8px', transform: 'scale(1.2)' }}
              />
            </label>
          </div>
        </div>

        {/* Timer Settings Section */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>⏰ Turn Timer</h3>

          {/* Enable Timer Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '15px',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '2px', color: '#2c3e50' }}>Enable Turn Timer</div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Show countdown timer and auto-draw when time expires
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.enableTimer}
                onChange={(e) => handleSettingChange('enableTimer', e.target.checked)}
                style={{ marginRight: '8px', transform: 'scale(1.2)' }}
              />
            </label>
          </div>

          {/* Timer Duration Controls - Only show when timer is enabled */}
          {settings.enableTimer && (
            <>
              {/* Preset Duration Buttons */}
              <div style={{
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#2c3e50' }}>Quick Presets:</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                  {[30, 60, 90, 120, 180].map(duration => (
                    <button
                      key={duration}
                      onClick={() => handleSettingChange('timerDuration', duration)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: settings.timerDuration === duration ? '#3498db' : '#e9ecef',
                        color: settings.timerDuration === duration ? '#fff' : '#495057',
                        border: 'none',
                        borderRadius: '15px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {duration < 60 ? `${duration}s` : `${Math.floor(duration/60)}:${(duration%60).toString().padStart(2,'0')}`}
                    </button>
                  ))}
                </div>

                {/* Slider Control */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#2c3e50' }}>
                      Timer Duration: {Math.floor(settings.timerDuration/60)}:{(settings.timerDuration%60).toString().padStart(2,'0')}
                    </label>
                    <span style={{ fontSize: '12px', color: '#6c757d' }}>
                      ({settings.timerDuration} seconds)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="300"
                    step="5"
                    value={settings.timerDuration}
                    onChange={(e) => handleSettingChange('timerDuration', parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      background: `linear-gradient(to right, #3498db 0%, #3498db ${((settings.timerDuration-15)/(300-15))*100}%, #ddd ${((settings.timerDuration-15)/(300-15))*100}%, #ddd 100%)`,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '10px',
                    color: '#6c757d',
                    marginTop: '5px'
                  }}>
                    <span>15s</span>
                    <span>5:00</span>
                  </div>
                </div>

                {/* Custom Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontWeight: 'bold', fontSize: '14px', minWidth: 'fit-content', color: '#2c3e50' }}>
                    Custom:
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="300"
                    value={settings.timerDuration}
                    onChange={(e) => {
                      const value = Math.max(15, Math.min(300, parseInt(e.target.value) || 15));
                      handleSettingChange('timerDuration', value);
                    }}
                    style={{
                      padding: '8px 12px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '80px',
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#6c757d' }}>seconds</span>
                </div>
              </div>

              {/* Warning Time Setting */}
              <div style={{
                padding: '15px',
                backgroundColor: '#fff3cd',
                borderRadius: '8px',
                border: '1px solid #ffeaa7'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#856404' }}>
                  <FaExclamationTriangle style={{ marginRight: '8px' }} />Warning Threshold:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', minWidth: 'fit-content', color: '#856404' }}>Show warning at:</span>
                  <input
                    type="number"
                    min="5"
                    max={Math.floor(settings.timerDuration * 0.5)}
                    value={settings.timerWarningTime}
                    onChange={(e) => {
                      const maxWarning = Math.floor(settings.timerDuration * 0.5);
                      const value = Math.max(5, Math.min(maxWarning, parseInt(e.target.value) || 15));
                      handleSettingChange('timerWarningTime', value);
                    }}
                    style={{
                      padding: '6px 10px',
                      border: '2px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '12px',
                      width: '60px',
                      textAlign: 'center'
                    }}
                  />
                  <span style={{ fontSize: '12px', color: '#856404' }}>seconds remaining</span>
                </div>
                <div style={{ fontSize: '11px', color: '#856404', fontStyle: 'italic' }}>
                  Timer will turn red and pulse when warning threshold is reached
                </div>
              </div>
            </>
          )}
        </div>

        {/* Close Button */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 25px',
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
