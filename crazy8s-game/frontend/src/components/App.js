import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

// Card component with experienced mode support
const Card = ({ card, onClick, isPlayable = false, isSelected = false, experiencedMode = false }) => {
  const getCardColor = (suit) => {
    return suit === 'Hearts' || suit === 'Diamonds' ? '#e74c3c' : '#2c3e50';
  };

  const getCardSymbol = (suit) => {
    const symbols = {
      'Hearts': '♥',
      'Diamonds': '♦',
      'Clubs': '♣',
      'Spades': '♠'
    };
    return symbols[suit] || '';
  };

  // In experienced mode, don't gray out cards or change opacity
  const opacity = experiencedMode ? 1 : (isPlayable ? 1 : 0.6);
  const borderColor = experiencedMode ? '#333' : (isPlayable ? '#27ae60' : '#bdc3c7');

  return (
    <div 
      className={`card ${isPlayable ? 'playable' : ''} ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        width: '60px',
        height: '90px',
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        margin: '0 1px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        cursor: isPlayable ? 'pointer' : 'default',
        transform: isSelected ? 'translateY(-10px)' : 'none',
        transition: 'all 0.2s ease',
        fontSize: '10px',
        padding: '4px',
        color: getCardColor(card.suit),
        boxShadow: isSelected ? '0 4px 8px rgba(0,0,0,0.3)' : 
                   (isPlayable && !experiencedMode ? '0 2px 6px rgba(39, 174, 96, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'),
        opacity: opacity,
        flexShrink: 0,
        minWidth: '50px',
        maxWidth: '60px'
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '8px' }}>
        {card.rank}
      </div>
      <div style={{ fontSize: '16px' }}>
        {getCardSymbol(card.suit)}
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '8px', transform: 'rotate(180deg)' }}>
        {card.rank}
      </div>
    </div>
  );
};

// PlayerHand component with sorting and grouping
const PlayerHand = ({ cards, validCards = [], selectedCards = [], onCardSelect, settings = {} }) => {
  // Helper function to get rank value for sorting
  const getRankValue = (rank) => {
    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
    return rankOrder.indexOf(rank);
  };

  // Helper function to get suit order
  const getSuitValue = (suit) => {
    const suitOrder = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    return suitOrder.indexOf(suit);
  };

  // Sort and group cards based on settings
  const organizeCards = () => {
    let organizedCards = [...cards];

    if (settings.sortByRank) {
      organizedCards.sort((a, b) => {
        const rankA = getRankValue(a.rank);
        const rankB = getRankValue(b.rank);
        if (rankA !== rankB) return rankA - rankB;
        // If same rank, sort by suit
        return getSuitValue(a.suit) - getSuitValue(b.suit);
      });
    }

    if (settings.groupBySuit) {
      organizedCards.sort((a, b) => {
        const suitA = getSuitValue(a.suit);
        const suitB = getSuitValue(b.suit);
        if (suitA !== suitB) return suitA - suitB;
        // If same suit, sort by rank if enabled
        if (settings.sortByRank) {
          return getRankValue(a.rank) - getRankValue(b.rank);
        }
        return 0;
      });
    }

    return organizedCards;
  };

  const organizedCards = organizeCards();

  // Group cards by suit if grouping is enabled
  const getCardGroups = () => {
    if (!settings.groupBySuit) {
      return [{ suit: null, cards: organizedCards }];
    }

    const groups = [];
    const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    
    suits.forEach(suit => {
      const suitCards = organizedCards.filter(card => card.suit === suit);
      if (suitCards.length > 0) {
        groups.push({ suit, cards: suitCards });
      }
    });

    return groups;
  };

  const cardGroups = getCardGroups();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '20px 0',
      padding: '15px 15px 25px 15px', // Added extra bottom padding
      backgroundColor: '#2ecc71',
      borderRadius: '15px',
      minHeight: '120px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        color: '#fff', 
        fontSize: '14px', 
        fontWeight: 'bold', 
        marginBottom: '10px',
        textAlign: 'center'
      }}>
        Your Hand ({cards.length} cards)
      </div>
      
      {cards.length === 0 ? (
        <div style={{ color: '#fff', fontSize: '16px', fontStyle: 'italic' }}>
          No cards in hand
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'flex-end', // Changed from 'center' to 'flex-end'
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible', // Changed from 'hidden' to 'visible'
          paddingTop: '30px', // Added padding for indicators
          paddingBottom: '15px' // Added padding for selected cards
        }}>
          {cardGroups.map((group, groupIndex) => (
            <div key={groupIndex} style={{
              display: 'flex',
              alignItems: 'flex-end', // Changed to flex-end
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {/* Cards in this group */}
              {group.cards.map((card, cardIndex) => {
                const isPlayable = validCards.some(vc => vc.suit === card.suit && vc.rank === card.rank);
                const isSelected = selectedCards.some(sc => sc.suit === card.suit && sc.rank === card.rank);
                const selectedIndex = selectedCards.findIndex(sc => sc.suit === card.suit && sc.rank === card.rank);
                const isBottomCard = selectedIndex === 0;
                
                return (
                  <div key={`${card.suit}-${card.rank}-${cardIndex}`} style={{ 
                    position: 'relative', 
                    margin: '2px',
                    flexShrink: 0,
                    minWidth: '60px',
                    // Add extra space for selected cards
                    marginTop: isSelected ? '10px' : '0px'
                  }}>
                    {/* Bottom Card Indicator - only show when stacking (2+ cards selected) */}
                    {isBottomCard && selectedCards.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '-35px', // Moved up more
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#e74c3c',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '8px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        zIndex: 10
                      }}>
                        Bottom Card
                      </div>
                    )}
                    
                    {/* Play Order Indicator */}
                    {isSelected && selectedIndex > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-30px', // Moved up more
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#3498db',
                        color: '#fff',
                        padding: '1px 5px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        zIndex: 10
                      }}>
                        #{selectedIndex + 1}
                      </div>
                    )}
                    
                    <Card
                      card={card}
                      isPlayable={isPlayable}
                      isSelected={isSelected}
                      experiencedMode={settings.experiencedMode}
                      onClick={() => {
                        if (isPlayable || settings.experiencedMode) {
                          onCardSelect(card);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// GameBoard component
// In App.js, find the GameBoard component (around line 180-250) and update the top card rendering:

// GameBoard component
const GameBoard = ({ gameState, onDrawCard, topCard, drawPileSize }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#27ae60',
      borderRadius: '20px',
      margin: '20px 0',
      minHeight: '200px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ color: '#fff', margin: '0 0 20px 0' }}>Game Board</h2>
      
      <div style={{
        display: 'flex',
        gap: '40px',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        {/* Draw Pile */}
        <div 
          onClick={onDrawCard}
          style={{
            width: '80px',
            height: '120px',
            backgroundColor: '#34495e',
            border: '3px solid #2c3e50',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          <div style={{ color: '#fff', textAlign: 'center', fontSize: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>DRAW</div>
            <div>({drawPileSize})</div>
          </div>
        </div>

        {/* Arrow */}
        <div style={{ 
          color: '#fff', 
          fontWeight: 'bold', 
          fontSize: '24px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          →
        </div>

        {/* Discard Pile - UPDATED */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
            Top Card
          </div>
          {topCard ? (
            <div 
              style={{
                width: '90px',        // Increased from 60px
                height: '135px',      // Increased from 90px
                border: '3px solid #fff',  // Made border white and thicker
                borderRadius: '12px',  // Slightly larger border radius
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#fff',
                fontSize: '14px',     // Increased font size
                padding: '6px',       // Increased padding
                color: topCard.suit === 'Hearts' || topCard.suit === 'Diamonds' ? '#e74c3c' : '#2c3e50',
                boxShadow: '0 6px 12px rgba(0,0,0,0.3)',  // Enhanced shadow
                transform: 'scale(1)',
                transition: 'transform 0.2s ease',
                opacity: 1,           // Ensure it's not greyed out
                flexShrink: 0,
                minWidth: '90px',
                maxWidth: '90px'
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '12px' }}>
                {topCard.rank}
              </div>
              <div style={{ fontSize: '24px' }}>  {/* Increased symbol size */}
                {topCard.suit === 'Hearts' ? '♥' : 
                 topCard.suit === 'Diamonds' ? '♦' : 
                 topCard.suit === 'Clubs' ? '♣' : '♠'}
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '12px', transform: 'rotate(180deg)' }}>
                {topCard.rank}
              </div>
            </div>
          ) : (
            <div style={{
              width: '90px',        // Increased to match
              height: '135px',      // Increased to match
              border: '2px dashed #fff',
              borderRadius: '12px', // Increased to match
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              Empty
            </div>
          )}
        </div>
      </div>

      {/* Game Status Indicators - rest remains the same */}
      <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {gameState.declaredSuit && (
          <div style={{
            color: '#fff',
            backgroundColor: '#e74c3c',
            padding: '8px 15px',
            borderRadius: '15px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            🎯 Current Suit: {gameState.declaredSuit}
          </div>
        )}

        {gameState.drawStack > 0 && (
          <div style={{
            color: '#fff',
            backgroundColor: '#e67e22',
            padding: '8px 15px',
            borderRadius: '15px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            animation: 'pulse 2s infinite'
          }}>
            📚 Draw Stack: +{gameState.drawStack}
          </div>
        )}

        {gameState.direction === -1 && (
          <div style={{
            color: '#fff',
            backgroundColor: '#9b59b6',
            padding: '8px 15px',
            borderRadius: '15px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            🔄 Reversed
          </div>
        )}
      </div>
    </div>
  );
};

// SuitSelector component
const SuitSelector = ({ onSuitSelect, onCancel }) => {
  const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  const suitColors = {
    'Hearts': '#e74c3c',
    'Diamonds': '#e74c3c', 
    'Clubs': '#2c3e50',
    'Spades': '#2c3e50'
  };
  const suitSymbols = {
    'Hearts': '♥',
    'Diamonds': '♦',
    'Clubs': '♣',
    'Spades': '♠'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '15px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>Choose a Suit for your 8</h3>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          {suits.map(suit => (
            <button
              key={suit}
              onClick={() => onSuitSelect(suit)}
              style={{
                width: '70px',
                height: '90px',
                fontSize: '24px',
                color: suitColors[suit],
                backgroundColor: '#fff',
                border: '2px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.backgroundColor = '#fff';
              }}
            >
              <div style={{ fontSize: '32px' }}>{suitSymbols[suit]}</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{suit}</div>
            </button>
          ))}
        </div>
        <button 
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            backgroundColor: '#95a5a6',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const Settings = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) return null;

  const handleSettingChange = (key, value) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div style={{
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
      <div style={{
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
          <h2 style={{ margin: 0, color: '#2c3e50' }}>⚙️ Game Settings</h2>
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
            ×
          </button>
        </div>

        {/* Card Display Settings */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>🃏 Card Display</h3>
          
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
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Sort by Rank</div>
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
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Group by Suit</div>
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
        </div>

        {/* Gameplay Settings */}
        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>🎮 Gameplay</h3>
          
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
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Experienced Mode</div>
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
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Enable Turn Timer</div>
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
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Quick Presets:</div>
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
                    <label style={{ fontWeight: 'bold', fontSize: '14px' }}>
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
                  <label style={{ fontWeight: 'bold', fontSize: '14px', minWidth: 'fit-content' }}>
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
                  ⚠️ Warning Threshold:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', minWidth: 'fit-content' }}>Show warning at:</span>
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

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#27ae60';
      case 'error': return '#e74c3c';
      case 'info': return '#3498db';
      default: return '#95a5a6';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px 20px',
      backgroundColor: getBackgroundColor(),
      color: '#fff',
      borderRadius: '8px',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      maxWidth: '300px',
      fontSize: '14px',
      cursor: 'pointer'
    }} onClick={onClose}>
      {message}
    </div>
  );
};

// Chat component
const Chat = ({ socket }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(true); // Changed from false to true

  useEffect(() => {
    if (!socket) return;

    socket.on('chat message', (message) => {
      setMessages(prev => [...prev.slice(-50), message]); // Keep only last 50 messages
    });

    socket.on('cardPlayed', (data) => {
      setMessages(prev => [...prev.slice(-50), `🃏 ${data.playerName} played: ${data.cardsPlayed.join(', ')}`]);
    });

    socket.on('playerDrewCards', (data) => {
      setMessages(prev => [...prev.slice(-50), `📚 ${data.playerName} drew ${data.cardCount} card(s)`]);
    });

    return () => {
      socket.off('chat message');
      socket.off('cardPlayed');
      socket.off('playerDrewCards');
    };
  }, [socket]);

  const sendMessage = () => {
    if (input.trim() && socket) {
      socket.emit('chat message', input);
      setInput('');
    }
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid #ddd',
      borderRadius: '10px',
      height: isMinimized ? '40px' : '250px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      transition: 'height 0.3s ease'
    }}>
      <div 
        style={{
          padding: '10px',
          borderBottom: '1px solid #ddd',
          fontWeight: 'bold',
          backgroundColor: '#f8f9fa',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <span>💬 Game Chat</span>
        <span style={{ fontSize: '12px' }}>{isMinimized ? '▲' : '▼'}</span>
      </div>
      
      {!isMinimized && (
        <>
          <div style={{
            flex: 1,
            padding: '10px',
            overflowY: 'auto',
            fontSize: '12px',
            backgroundColor: '#fafafa'
          }}>
            {messages.map((msg, index) => (
              <div key={index} style={{ 
                marginBottom: '4px',
                padding: '2px 0',
                borderBottom: '1px solid #eee'
              }}>
                {msg}
              </div>
            ))}
            {messages.length === 0 && (
              <div style={{ color: '#999', fontStyle: 'italic' }}>
                No messages yet...
              </div>
            )}
          </div>
          <div style={{ padding: '10px', borderTop: '1px solid #ddd' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: '5px 8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              />
              <button 
                onClick={sendMessage}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const TurnTimer = ({ timeLeft, isWarning, isVisible }) => {
  if (!isVisible) return null;
  
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  return (
    <div style={{
      fontSize: '9px',
      marginTop: '3px',
      padding: '2px 8px',
      borderRadius: '10px',
      backgroundColor: isWarning ? '#e74c3c' : 'rgba(255,255,255,0.2)',
      color: '#fff',
      fontWeight: 'bold',
      minHeight: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: isWarning ? 'pulse 1s infinite' : 'none'
    }}>
      {isWarning ? '⚠️ ' : '⏱️ '}
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

// Simple Debug Panel
const DebugPanel = ({ isOpen, logs, onClose, onStart, players, currentId, onSwitch }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, overflow: 'auto' }}>
      <div style={{ background: '#fff', margin: '40px auto', padding: '20px', borderRadius: '8px', maxWidth: '800px' }}>
        <h2>Debug Panel</h2>
        <button onClick={onClose} style={{ marginBottom: '10px' }}>Close</button>
        <button onClick={onStart} style={{ marginLeft: '10px' }}>Start Debug Game</button>
        {players.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <label style={{ marginRight: '5px' }}>Control Player:</label>
            <select value={currentId} onChange={e => onSwitch(e.target.value)}>
              {players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginTop: '20px', maxHeight: '400px', overflow: 'auto', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #ccc', padding: '10px' }}>
          {logs.map(l => (
            <div key={l.id}>[{l.timestamp}] {l.message}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main App component
const App = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [playerHand, setPlayerHand] = useState([]);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);
  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [validCards, setValidCards] = useState([]);
  const [toast, setToast] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    sortByRank: false,
    groupBySuit: false,
    experiencedMode: false,
    enableTimer: true,
    timerDuration: 60,
    timerWarningTime: 15
  });
  const [copiedGameId, setCopiedGameId] = useState(false);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [turnTimer, setTurnTimer] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [timerWarning, setTimerWarning] = useState(false);

  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);
  const [debugGameSetup] = useState({
    playerCount: 2,
    playerNames: ['Debug Player 1', 'Debug Player 2'],
    customHands: [[], []],
    startingCard: { suit: 'Hearts', rank: '7' }
  });
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [debugPlayers, setDebugPlayers] = useState([]);


  // Refs to access latest timer values inside stable callbacks
  const timerDurationRef = useRef(settings.timerDuration);
  const timerWarningTimeRef = useRef(settings.timerWarningTime);
  const playerIdRef = useRef(playerId);

  // Keep refs in sync with settings
  useEffect(() => {
    timerDurationRef.current = settings.timerDuration;
    timerWarningTimeRef.current = settings.timerWarningTime;
  }, [settings.timerDuration, settings.timerWarningTime]);

  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  // Load settings from localStorage on component mount
  useEffect(() => {
    if (playerId) {
      const savedSettings = localStorage.getItem(`crazy8s_settings_${playerId}`);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({
            sortByRank: false,
            groupBySuit: false,
            experiencedMode: false,
            enableTimer: true,
            timerDuration: 60,
            timerWarningTime: 15,
            ...parsed
          });
        } catch (error) {
          console.log('Error loading settings:', error);
        }
      }
    }
  }, [playerId]);

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

  // Save settings to localStorage whenever they change
  const handleSettingsChange = (newSettings) => {
    const validatedSettings = validateTimerSettings(newSettings);
    setSettings(validatedSettings);
    if (playerId) {
      localStorage.setItem(`crazy8s_settings_${playerId}`, JSON.stringify(validatedSettings));
    }
  };

  useEffect(() => {
    console.log('⏰ Timer Settings Updated:', {
      enableTimer: settings.enableTimer,
      timerDuration: settings.timerDuration,
      timerWarningTime: settings.timerWarningTime,
      isActive: timerActive,
      currentTime: turnTimer
    });
  }, [settings.enableTimer, settings.timerDuration, settings.timerWarningTime, timerActive, turnTimer]);

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
    console.log(`🐛 [${timestamp}] ${message}`, data || '');
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

  // Initialize socket connection
  useEffect(() => {
  // Determine backend URL based on environment
  const BACKEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://crazy8s-production.up.railway.app' // Replace with your Railway URL
    : 'http://localhost:3001';

  console.log('🔌 Connecting to:', BACKEND_URL);

  const newSocket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'], // Enable fallback transport
    upgrade: true,
    rememberUpgrade: true,
    timeout: 20000,
    forceNew: false,
    autoConnect: true
  });

  setSocket(newSocket);
  setPlayerId(newSocket.id);

  newSocket.on('connect', () => {
    setIsConnected(true);
    console.log('🔌 Connected to server with ID:', newSocket.id);
    setPlayerId(newSocket.id);
  });

  newSocket.on('disconnect', () => {
    setIsConnected(false);
    console.log('❌ Disconnected from server');
  });

  newSocket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
    setToast({ 
      message: 'Connection failed. Please check your internet connection.', 
      type: 'error' 
    });
  });

    newSocket.on('gameUpdate', (data) => {
      console.log('🎮 Game state updated:', data);
      console.log('  📊 Current Player:', data.currentPlayer, '(ID:', data.currentPlayerId, ')');
      console.log('  🆔 My Player ID:', playerIdRef.current);
      console.log('  🎯 Is My Turn:', data.currentPlayerId === playerIdRef.current);
      if (data.currentPlayerId !== playerIdRef.current) {
        setHasDrawnThisTurn(false);
        setIsDrawing(false);
      }

      setGameState(data);
    });

    newSocket.on('handUpdate', (hand) => {
      console.log('🃏 Hand updated:', hand.length, 'cards');
      setPlayerHand(hand);
    });

    newSocket.on('error', (errorMsg) => {
      console.log('❌ Error:', errorMsg);
      setToast({ message: errorMsg, type: 'error' });
    });

    newSocket.on('success', (successMsg) => {
      console.log('✅ Success:', successMsg);
      setToast({ message: successMsg, type: 'success' });
    });

    newSocket.on('cardPlayed', (data) => {
      console.log('🃏 Card played:', data);
      setToast({ message: `${data.playerName} played: ${data.cardsPlayed.join(', ')}`, type: 'info' });
      setTurnTimer(timerDurationRef.current);
      setTimerWarning(false);
    });

    newSocket.on('playerDrewCards', (data) => {
      console.log('📚 Player drew cards:', data);
      const message = data.canPlayDrawn 
        ? `${data.playerName} drew ${data.cardCount} card(s) and can play some!`
        : `${data.playerName} drew ${data.cardCount} card(s)`;
      setToast({ message, type: 'info' });
    });

    newSocket.on('drawComplete', (data) => {
      console.log('🎲 Draw completed:', data);
      setIsDrawing(false);
      setHasDrawnThisTurn(true);

      setTurnTimer(timerDurationRef.current);
      setTimerWarning(false);

      if (data.canPlayDrawnCard && data.playableDrawnCards.length > 0) {
        setToast({
          message: `Drew ${data.drawnCards.length} cards. ${data.playableDrawnCards.length} can be played!`,
          type: 'info'
        });
      } else {
        setToast({
          message: `Drew ${data.drawnCards.length} cards. No playable cards drawn.`,
          type: 'info'
        });
        // Player keeps the turn and may choose to skip manually
      }
    });

    newSocket.on('playerPassedTurn', (data) => {
      console.log('👤 Player passed turn:', data);
      setToast({ message: `${data.playerName} passed their turn`, type: 'info' });
    });

    return () => newSocket.close();
  }, []);

  const parseTopCard = (cardString) => {
    if (!cardString) return null;
    const parts = cardString.split(' of ');
    if (parts.length !== 2) return null;
    return { rank: parts[0], suit: parts[1] };
  };

  const canCounterDraw = (card, topCard) => {
    if (topCard.rank === 'Ace') {
      return card.rank === 'Ace' || (card.rank === '2' && card.suit === topCard.suit);
    }
    if (topCard.rank === '2') {
      return card.rank === '2' || (card.rank === 'Ace' && card.suit === topCard.suit);
    }
    return false;
  };

  // Enhanced turn control simulation (matching backend logic)
  const simulateTurnControl = (cardStack, activePlayers) => {
    if (cardStack.length === 0) return true;
    
    const isOneVsOne = activePlayers <= 2;
    let currentPlayerHasTurn = true; // We start with control
    
    for (const card of cardStack) {
      switch (card.rank) {
        case 'Jack':
          // Jack skips opponent, back to us
          currentPlayerHasTurn = true;
          break;
          
        case 'Queen':
          if (isOneVsOne) {
            // In 1v1, Queen acts as skip
            currentPlayerHasTurn = true;
          } else {
            // In multiplayer, Queen reverses direction
            currentPlayerHasTurn = !currentPlayerHasTurn;
          }
          break;
          
        case 'Ace':
        case '2':
        case '8':
          // These have effects but pass turn to next player
          currentPlayerHasTurn = false;
          break;
          
        default:
          // Non-special cards pass the turn
          currentPlayerHasTurn = false;
          break;
      }
    }
    
    return currentPlayerHasTurn;
  };

  // Enhanced card stack validation with strict turn logic
    const validateCardStack = useCallback((cards, activePlayers) => {
    if (cards.length <= 1) {
        return { isValid: true };
    }

      console.log('🔍 Validating card stack:', cards.map(c => `${c.rank} of ${c.suit}`));

    // Check each card-to-card transition in the stack
    for (let i = 1; i < cards.length; i++) {
      const prevCard = cards[i - 1];
      const currentCard = cards[i];
      
      console.log(`  Checking transition: ${prevCard.rank} of ${prevCard.suit} → ${currentCard.rank} of ${currentCard.suit}`);
      
      // Cards must match by suit or rank
      const matchesSuit = prevCard.suit === currentCard.suit;
      const matchesRank = prevCard.rank === currentCard.rank;
      
      // Special case: Aces and 2s can stack with each other if same suit
      const isAce2Cross = (
        (prevCard.rank === 'Ace' && currentCard.rank === '2') ||
        (prevCard.rank === '2' && currentCard.rank === 'Ace')
      ) && prevCard.suit === currentCard.suit;
      
      console.log(`    Matches suit: ${matchesSuit}, Matches rank: ${matchesRank}, Ace/2 cross: ${isAce2Cross}`);
      
      // Basic matching requirement
      if (!matchesSuit && !matchesRank && !isAce2Cross) {
        console.log(`    ❌ Invalid transition - no suit/rank match!`);
        return {
          isValid: false,
          error: `Cannot stack ${currentCard.rank} of ${currentCard.suit} after ${prevCard.rank} of ${prevCard.suit}. Cards must match suit or rank.`
        };
      }
      
      // If different rank but same suit, validate turn chain logic
      if (matchesSuit && !matchesRank && !isAce2Cross) {
        const stackUpToHere = cards.slice(0, i);
        const wouldHaveTurnControl = simulateTurnControl(stackUpToHere, activePlayers);
        
        if (!wouldHaveTurnControl) {
          console.log(`    ❌ Invalid transition - no turn control after previous cards!`);
          return {
            isValid: false,
            error: `Cannot stack ${currentCard.rank} of ${currentCard.suit} after ${prevCard.rank} of ${prevCard.suit}. Previous cards don't maintain turn control.`
          };
        }
      }
      
      console.log(`    ✅ Valid transition`);
    }
    
    console.log('✅ Stack validation passed');
    return { isValid: true };
  }, []);

  // Enhanced card stacking check
    const canStackCards = useCallback((existingCards, newCard, activePlayers) => {
    const testStack = [...existingCards, newCard];
    const validation = validateCardStack(testStack, activePlayers);
    return validation.isValid;
    }, [validateCardStack]);

  // Update valid cards when playerHand or gameState changes
  useEffect(() => {
  if (gameState && playerHand.length > 0) {
    const topCard = parseTopCard(gameState.topCard);
    if (!topCard) return;

    let valid = [];

    if (selectedCards.length === 0) {
      // No cards selected - show cards that can be played as bottom card
      valid = playerHand.filter(card => {
        // When there's a draw stack, ONLY counter cards are valid (no 8s allowed)
        if (gameState.drawStack > 0) {
          return canCounterDraw(card, topCard);
        }
        
        // 8s can be played on anything (except when draw stack is present)
        if (card.rank === '8') return true;
        
        const suitToMatch = gameState.declaredSuit || topCard.suit;
        return card.suit === suitToMatch || card.rank === topCard.rank;
      });
    } else {
      // Cards already selected - show stackable cards
      valid = playerHand.filter(card => {
        // Already selected cards are always "valid" for reordering
        const isSelected = selectedCards.some(sc => sc.suit === card.suit && sc.rank === card.rank);
        if (isSelected) return true;
        
        // Check if this card can be stacked with the current selection
        return canStackCards(selectedCards, card, gameState.players?.length || 2);
      });
    }
    
    console.log('🎯 Valid cards calculated:', valid.length, 'out of', playerHand.length);
    console.log('🎯 Selected cards:', selectedCards.length);
    console.log('🎯 Draw stack:', gameState.drawStack);
    setValidCards(valid);
  } else {
    setValidCards([]);
  }
}, [playerHand, gameState, selectedCards, canStackCards]);

useEffect(() => {
  if (!timerActive || !settings.enableTimer || gameState?.gameState !== 'playing') {
    return;
  }
  
  const interval = setInterval(() => {
    setTurnTimer(prev => {
      if (prev <= 1) {
        // Timer expired
        if (playerIdRef.current === gameState.currentPlayerId) {
          // Current player auto draws and passes
          console.log('⏰ Timer expired - auto drawing card and skipping turn');
          if (socket && gameState?.gameId) {
            socket.emit('drawCard', { gameId: gameState.gameId });
            setTimeout(() => {
              socket.emit('passTurnAfterDraw', { gameId: gameState.gameId });
            }, 500);
          }
        }
        setTimerActive(false);
        setTimerWarning(false);
        return settings.timerDuration; // Use settings instead of hardcoded 60
      }
      if (prev <= settings.timerWarningTime && !timerWarning) {
        setTimerWarning(true);
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [timerActive, settings.enableTimer, gameState?.currentPlayerId, playerId, gameState?.gameState, timerWarning, socket, gameState?.gameId, settings.timerDuration, settings.timerWarningTime]);

// Timer reset logic
useEffect(() => {
  if (gameState?.gameState === 'playing') {
    // Reset timer for a new turn
    setTurnTimer(settings.enableTimer ? settings.timerDuration : 60);
    setTimerActive(settings.enableTimer);
    setTimerWarning(false);
  } else {
    setTimerActive(false);
    setTimerWarning(false);
  }
}, [gameState?.currentPlayerId, gameState?.gameState, settings.enableTimer, settings.timerDuration]);

  const startGame = () => {
    console.log('🚀 Starting game:', gameState?.gameId);
    socket.emit('startGame', {
      gameId: gameState?.gameId
    });
  };

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

  const joinGame = () => {
    if (!playerName.trim() || !gameId.trim()) {
      setToast({ message: 'Please enter both name and game ID', type: 'error' });
      return;
    }

    console.log('🚪 Joining game:', gameId, 'as', playerName);
    socket.emit('joinGame', {
      gameId: gameId.trim(),
      playerName: playerName.trim()
    });
  };

  const createGame = () => {
    if (!playerName.trim()) {
      setToast({ message: 'Please enter your name', type: 'error' });
      return;
    }

    console.log('🎮 Creating game as:', playerName);
    socket.emit('createGame', {
      playerName: playerName.trim()
    });
  };

  const handleCardSelect = (card) => {
    const isSelected = selectedCards.some(sc => sc.suit === card.suit && sc.rank === card.rank);
    
    if (isSelected) {
      // If the card is already selected, handle reordering/deselection
      if (selectedCards.length === 1) {
        // Only one card selected (the bottom card) - deselect it
        setSelectedCards([]);
      } else {
        // Multiple cards selected - remove this card for reordering
        setSelectedCards(prev => prev.filter(sc => !(sc.suit === card.suit && sc.rank === card.rank)));
      }
    } else {
      if (selectedCards.length === 0) {
        // No cards selected, select this card as bottom card
        setSelectedCards([card]);
      } else {
        // Check if this card can be stacked with the current selection
        const activePlayers = gameState?.players?.length || 2;
        
        if (canStackCards(selectedCards, card, activePlayers)) {
          setSelectedCards(prev => [...prev, card]);
        } else {
          // Can't stack - show error message
          const validation = validateCardStack([...selectedCards, card], activePlayers);
          setToast({ 
            message: validation.error || `Cannot stack ${card.rank} of ${card.suit} with current selection.`, 
            type: 'error' 
          });
        }
      }
    }
  };

  const playSelectedCards = () => {
    if (selectedCards.length === 0) {
      setToast({ message: 'Please select at least one card', type: 'error' });
      return;
    }

    // Final validation before sending to server
    const activePlayers = gameState?.players?.length || 2;
    const validation = validateCardStack(selectedCards, activePlayers);
    
    if (!validation.isValid) {
      setToast({ message: validation.error, type: 'error' });
      return;
    }

    const hasWild = selectedCards.some(card => card.rank === '8');
    
    if (hasWild) {
      // Check if ALL selected cards are 8s (can't mix 8s with other ranks unless same suit)
      const non8Cards = selectedCards.filter(card => card.rank !== '8');
      if (non8Cards.length > 0) {
        // Check if all cards (including 8s) are same suit
        const allSameSuit = selectedCards.every(card => card.suit === selectedCards[0].suit);
        if (!allSameSuit) {
          setToast({ message: 'When playing 8s with other cards, all must be the same suit', type: 'error' });
          return;
        }
      }
      setShowSuitSelector(true);
    } else {
      console.log('🃏 Playing cards:', selectedCards);
      socket.emit('playCard', {
        gameId: gameState?.gameId,
        cards: selectedCards
      });
      setSelectedCards([]);
      setHasDrawnThisTurn(false);
      setIsDrawing(false);

      setTurnTimer(settings.timerDuration);
      setTimerWarning(false);
    }
  };

  const handleSuitSelect = (suit) => {
    console.log('🃏 Playing wild card with suit:', suit);
    socket.emit('playCard', {
      gameId: gameState?.gameId,
      cards: selectedCards,
      declaredSuit: suit
    });
    setSelectedCards([]);
    setShowSuitSelector(false);
    setHasDrawnThisTurn(false);
    setIsDrawing(false);
      setTurnTimer(settings.timerDuration);
      setTimerWarning(false);
  };

  const drawCard = () => {
  if (isDrawing || hasDrawnThisTurn) {
    setToast({ message: 'You have already drawn cards this turn', type: 'error' });
    return;
  }

  console.log('📚 Drawing card');
  setIsDrawing(true);
  socket.emit('drawCard', {
    gameId: gameState?.gameId
  });
};


  // Allow the player to manually skip their turn after drawing
  const skipTurn = () => {
    console.log('👋 Skipping turn');
    socket.emit('passTurnAfterDraw', {
      gameId: gameState?.gameId
    });
    setHasDrawnThisTurn(false);
    setIsDrawing(false);
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
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
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
      </div>
    );
  }

  if (!gameState) {
    return (
      <div style={{ 
        padding: '20px', 
        maxWidth: '400px', 
        margin: '50px auto',
        backgroundColor: '#ecf0f1',
        minHeight: '100vh'
      }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          padding: '30px'
        }}>
          <h1 style={{ textAlign: 'center', color: '#2c3e50', margin: '0 0 30px 0' }}>
            🎴 Crazy 8's
          </h1>
          
          {/* Debug Info */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '12px',
            color: '#6c757d'
          }}>
            🆔 Your Socket ID: {playerId}
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
              Your Name:
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter your name"
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
              Game ID (to join existing game):
            </label>
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter game ID"
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={createGame}
              style={{
                flex: 1,
                padding: '15px',
                backgroundColor: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#229954'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
            >
              🎮 Create Game
            </button>
            <button
              onClick={joinGame}
              style={{
                flex: 1,
                padding: '15px',
                backgroundColor: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              🚪 Join Game
            </button>
          </div>
        </div>
      </div>
    );
  }

  const topCard = parseTopCard(gameState.topCard);
  const isMyTurn = gameState.currentPlayerId === playerId;

  // Debug logging for turn detection
  console.log('🔍 Turn Check:');
  console.log('  - Game Current Player ID:', gameState.currentPlayerId);
  console.log('  - My Player ID:', playerId);
  console.log('  - Is My Turn:', isMyTurn);

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
      <h1 style={{ textAlign: 'center', color: '#2c3e50', margin: '0 0 20px 0' }}>
        🎴 Crazy 8's
        <button
          onClick={() => setShowSettings(true)}
          style={{
            marginLeft: '15px',
            padding: '8px 12px',
            backgroundColor: '#95a5a6',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          ⚙️ Settings
        </button>
      </h1>

      {/* Debug Info */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '10px',
        borderRadius: '5px',
        marginBottom: '15px',
        fontSize: '12px',
        color: '#6c757d',
        textAlign: 'center'
      }}>
        🆔 My ID: {playerId} | Current Player ID: {gameState.currentPlayerId} | Is My Turn: {isMyTurn ? 'YES' : 'NO'}
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
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <strong>Round:</strong> {gameState.roundNumber}
          </div>
          <div style={{ 
            color: isMyTurn ? '#e74c3c' : '#2c3e50', 
            fontWeight: isMyTurn ? 'bold' : 'normal',
            textAlign: 'center',
            flex: '1 1 200px'
          }}>
            <strong>Current Player:</strong> {gameState.currentPlayer}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div>
              <strong>Game ID:</strong> 
              <span style={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#f8f9fa', 
                padding: '2px 6px', 
                borderRadius: '4px',
                marginLeft: '5px'
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
                height: '24px'
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
            padding: '12px 18px',
            backgroundColor: player.isCurrentPlayer ? '#3498db' : '#95a5a6',
            color: '#fff',
            borderRadius: '25px',
            fontWeight: 'bold',
            textAlign: 'center',
            minWidth: '140px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transform: player.isCurrentPlayer ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.3s ease',
            position: 'relative'
            }}
        >
            <div style={{ fontSize: '14px' }}>
            {player.name}
            {!player.isConnected && ' 🔴'}
            {player.id === playerId && ' (YOU)'}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {player.handSize} cards
            {player.isSafe && ' ✅'}
            {player.isEliminated && ' ❌'}
            </div>
            <div style={{ fontSize: '10px', opacity: 0.7 }}>
            ID: {player.id?.slice(-4)}
            </div>
            
            {/* TIMER COMPONENT ADDED HERE */}
            <TurnTimer
            timeLeft={turnTimer}
            isWarning={timerWarning}
            isVisible={player.isCurrentPlayer && gameState.gameState === 'playing' && settings.enableTimer}
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
              disabled={gameState.pendingTurnPass !== playerId}
              style={{
                padding: '12px 25px',
                backgroundColor: '#95a5a6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: gameState.pendingTurnPass === playerId ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
            >
              ⏭️ Skip Turn
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
          <div style={{ fontSize: '18px', color: '#27ae60', fontWeight: 'bold' }}>
            Winner: {gameState.players.find(p => !p.isEliminated)?.name || 'Unknown'}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
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
            🔄 Play Again
          </button>
        </div>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Settings Modal */}
      <Settings 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
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
        width: '320px'
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
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .card:hover {
          transform: translateY(-2px);
        }
        
        .card.playable:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4);
        }
        
        .card.selected {
          transform: translateY(-10px);
          box-shadow: 0 6px 16px rgba(52, 152, 219, 0.4);
        }

        ${sliderStyles}
      `}</style>
    </div>
  );
};

export default App;
