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

const PlayerHand = ({ cards, validCards = [], selectedCards = [], onCardSelect, settings = {} }) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  
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
      padding: '15px 15px 25px 15px',
      backgroundColor: '#2ecc71',
      borderRadius: '15px',
      minHeight: '180px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      overflow: 'visible'
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
          alignItems: 'center',
          width: '100%',
          maxWidth: '100%',
          overflow: 'visible',
          paddingTop: '20px',
          paddingBottom: '10px',
          position: 'relative',
          minHeight: '110px'
        }}>
          {cardGroups.map((group, groupIndex) => (
            <div key={groupIndex} style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {group.cards.map((card, cardIndex) => {
                const isPlayable = validCards.some(vc => vc.suit === card.suit && vc.rank === card.rank);
                const isSelected = selectedCards.some(sc => sc.suit === card.suit && sc.rank === card.rank);
                const selectedIndex = selectedCards.findIndex(sc => sc.suit === card.suit && sc.rank === card.rank);
                const isBottomCard = selectedIndex === 0;
                // FIXED: Use a more stable key that includes position to prevent repositioning issues
                const cardKey = `${card.suit}-${card.rank}`;
                const isHovered = hoveredCard === cardKey;
                
                return (
                  <div 
                    key={cardKey} 
                    style={{ 
                      position: 'relative', 
                      margin: '3px',
                      flexShrink: 0,
                      minWidth: '60px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      zIndex: isSelected ? 15 : (isHovered ? 10 : 1)
                    }}
                    onMouseEnter={() => setHoveredCard(cardKey)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Bottom Card Indicator - only show when stacking (2+ cards selected) */}
                    {isBottomCard && selectedCards.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '-25px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#e74c3c',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontSize: '8px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        zIndex: 20,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        Bottom Card
                      </div>
                    )}
                    
                    {/* Play Order Indicator */}
                    {isSelected && selectedIndex > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '-20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#3498db',
                        color: '#fff',
                        padding: '1px 5px',
                        borderRadius: '8px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        zIndex: 20,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        #{selectedIndex + 1}
                      </div>
                    )}
                    
                    {/* Enhanced Card Component */}
                    <div 
                      className={`card ${isPlayable ? 'playable' : ''} ${isSelected ? 'selected' : ''}`}
                      onClick={() => {
                        if (isPlayable || settings.experiencedMode) {
                          onCardSelect(card);
                        }
                      }}
                      style={{
                        width: '60px',
                        height: '90px',
                        border: `2px solid ${settings.experiencedMode ? '#333' : (isPlayable ? '#27ae60' : '#bdc3c7')}`,
                        borderRadius: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#fff',
                        cursor: isPlayable || settings.experiencedMode ? 'pointer' : 'default',
                        fontSize: '10px',
                        padding: '4px',
                        color: card.suit === 'Hearts' || card.suit === 'Diamonds' ? '#e74c3c' : '#2c3e50',
                        flexShrink: 0,
                        minWidth: '50px',
                        maxWidth: '60px',
                        
                        // FIXED: Smooth opacity transitions without flashing
                        opacity: settings.experiencedMode ? 1 : (isPlayable ? 1 : 0.6),
                        
                        transform: isSelected ? 'translateY(-15px) scale(1.05)' : 
                                  (isHovered && !isSelected ? 'translateY(-8px) scale(1.03)' : 'translateY(0px) scale(1)'),
                        
                        boxShadow: isSelected ? '0 8px 20px rgba(52, 152, 219, 0.4)' :
                                  (isHovered && isPlayable ? '0 6px 16px rgba(39, 174, 96, 0.4)' :
                                  (isHovered ? '0 4px 12px rgba(0,0,0,0.2)' :
                                  (isPlayable && !settings.experiencedMode ? '0 2px 6px rgba(39, 174, 96, 0.3)' : 
                                  '0 2px 4px rgba(0,0,0,0.1)'))),
                        
                        // FIXED: Separate transitions for different properties to prevent flashing
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), ' +
                                   'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), ' +
                                   'opacity 0.3s ease, ' +
                                   'border-color 0.3s ease',
                        
                        transformOrigin: 'center center',
                        
                        // FIXED: More stable background transition
                        background: isPlayable && !settings.experiencedMode ? 
                                   'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)' : '#ffffff',
                        
                        // FIXED: Smoother border transitions
                        ...(isHovered && isPlayable && !settings.experiencedMode && {
                          borderColor: '#2ecc71',
                          borderWidth: '3px'
                        })
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '8px' }}>
                        {card.rank}
                      </div>
                      <div style={{ fontSize: '16px' }}>
                        {card.suit === 'Hearts' ? '♥' : 
                         card.suit === 'Diamonds' ? '♦' : 
                         card.suit === 'Clubs' ? '♣' : '♠'}
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '8px', transform: 'rotate(180deg)' }}>
                        {card.rank}
                      </div>
                    </div>
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

const ToastContainer = ({ toasts, onRemoveToast }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '300px'
    }}>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          toast={toast}
          index={index}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  );
};

const Toast = ({ toast, index, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Create a stable reference to onClose to prevent timer resets
    const stableOnClose = () => {
      console.log(`🍞 Auto-closing toast: ${toast.message}`);
      setIsExiting(true);
      setTimeout(() => {
        onClose();
      }, 300);
    };

    // Auto-close timer with stable reference
    timerRef.current = setTimeout(stableOnClose, 4000);
    
    console.log(`🍞 Toast timer started for: ${toast.message}`);

    return () => {
      if (timerRef.current) {
        console.log(`🍞 Toast timer cleared for: ${toast.message}`);
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]); // ONLY depend on toast.id, NOT onClose

  const handleManualClose = () => {
    console.log(`🍞 Manual close toast: ${toast.message}`);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success': return '#27ae60';
      case 'error': return '#e74c3c';
      case 'info': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getTransform = () => {
    if (isExiting) {
      return 'translateX(100%) scale(0.8)';
    }
    return `translateY(${index * 5}px) scale(${1 - index * 0.05})`;
  };

  const getOpacity = () => {
    if (isExiting) return 0;
    return Math.max(0.3, 1 - index * 0.15);
  };

  const getZIndex = () => {
    return 1000 - index;
  };

  return (
    <div 
      style={{
        padding: '15px 20px',
        backgroundColor: getBackgroundColor(),
        color: '#fff',
        borderRadius: '8px',
        boxShadow: `0 ${4 + index * 2}px ${8 + index * 4}px rgba(0,0,0,${0.2 + index * 0.1})`,
        fontSize: '14px',
        cursor: 'pointer',
        transform: getTransform(),
        opacity: getOpacity(),
        zIndex: getZIndex(),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transformOrigin: 'top right',
        position: 'relative',
        overflow: 'hidden',
        border: index === 0 ? '2px solid rgba(255,255,255,0.3)' : 'none'
      }}
      onClick={handleManualClose}
    >
      {/* Progress bar for the newest notification */}
      {index === 0 && !isExiting && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          backgroundColor: 'rgba(255,255,255,0.5)',
          animation: 'progressBar 4s linear forwards',
          borderRadius: '0 0 6px 6px'
        }} />
      )}
      
      {/* Stack indicator for older notifications */}
      {index > 0 && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          fontSize: '10px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          padding: '2px 6px',
          borderRadius: '10px',
          fontWeight: 'bold'
        }}>
          +{index}
        </div>
      )}
      
      {toast.message}
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
      setMessages(prev => [...prev.slice(-50), `🃏 ${data.playerName}: ${data.message}`]);
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
  const [toasts, setToasts] = useState([]);
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
  const [lastActionTime, setLastActionTime] = useState(0);
  const [globalTimer, setGlobalTimer] = useState({
    timeLeft: 60,
    isWarning: false,
    isActive: false
  });

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


  // Refs to access latest timer values inside stable callbacks
  const timerDurationRef = useRef(settings.timerDuration);
  const timerWarningTimeRef = useRef(settings.timerWarningTime);
  const playerIdRef = useRef(playerId);
  const hasDrawnThisTurnRef = useRef(hasDrawnThisTurn);
  const lastSkipTimeRef = useRef(0);
  const [isSkipping, setIsSkipping] = useState(false);

  const addToast = (message, type = 'info') => {
    const newToast = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: Date.now()
    };

    setToasts(prevToasts => {
      const newToasts = [newToast, ...prevToasts];
      
      // If we have more than 3 toasts, remove the oldest ones
      if (newToasts.length > 3) {
        return newToasts.slice(0, 3);
      }
      
      return newToasts;
    });
  };

  const removeToast = useCallback((toastId) => {
  console.log(`🗑️ Removing toast with ID: ${toastId}`);
  setToasts(prevToasts => prevToasts.filter(toast => toast.id !== toastId));
}, []);

    // Play again voting
  const [playAgainVotes, setPlayAgainVotes] = useState({
    votedPlayers: [],
    totalPlayers: 0,
    allVoted: false,
    creatorVoted: false,
    canStartGame: false,
    gameCreator: null
  });


  // Keep refs in sync with settings
  useEffect(() => {
    timerDurationRef.current = settings.timerDuration;
    timerWarningTimeRef.current = settings.timerWarningTime;
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
  
  // Send timer settings to server if in a game
  if (socket && gameState?.gameId) {
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

  useEffect(() => {
  console.log('⏰ Timer Settings Updated:', {
    enableTimer: settings.enableTimer,
    timerDuration: settings.timerDuration,
    timerWarningTime: settings.timerWarningTime,
    isActive: globalTimer.isActive,
    currentTime: globalTimer.timeLeft
  });
}, [settings.enableTimer, settings.timerDuration, settings.timerWarningTime, globalTimer.isActive, globalTimer.timeLeft]);

  // Reset drawing state when game state changes players
  useEffect(() => {
    if (gameState?.currentPlayerId !== playerId) {
      setHasDrawnThisTurn(false);
      setIsDrawing(false);
      setIsSkipping(false); 
    }
  }, [gameState?.currentPlayerId, playerId]);

  // Clear selected cards when turn changes
  useEffect(() => {
    const isMyTurn = gameState?.currentPlayerId === playerId;
    if (!isMyTurn) {
      setSelectedCards([]);
    }
  }, [gameState?.currentPlayerId, playerId]);

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
    ? 'https://crazy8s-production.up.railway.app'
    : 'http://localhost:3001';

  console.log('🔌 Connecting to:', BACKEND_URL);

  const newSocket = io(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    upgrade: true,
    rememberUpgrade: true,
    timeout: 20000,
    forceNew: false,
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 5,
    withCredentials: true,
    extraHeaders: process.env.NODE_ENV === 'production' ? {
      'Access-Control-Allow-Origin': window.location.origin
    } : {}
  });

  setSocket(newSocket);

  newSocket.on('connect', () => {
    setIsConnected(true);
    console.log('🔌 Connected to server with ID:', newSocket.id);
    // Set playerId to the socket ID
    setPlayerId(newSocket.id);
    removeToast();
  });

  newSocket.on('connect_success', (data) => {
    console.log('✅ Connection confirmed by server:', data);
  });

  newSocket.on('disconnect', () => {
    setIsConnected(false);
    console.log('❌ Disconnected from server');
  });

  newSocket.on('reconnect_error', (error) => {
    console.error('❌ Reconnection failed:', error);
  });

  newSocket.on('reconnect_failed', () => {
    console.error('❌ Failed to reconnect after maximum attempts');
    addToast('Failed to reconnect to server. Please refresh the page.', 'error');
  });

  newSocket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
    addToast('Connection failed. Please check your internet connection.', 'error');
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
    
    // Initialize play again voting when game finishes
    if (data.gameState === 'finished' && gameState?.gameState !== 'finished') {
      console.log('🎮 Game finished - initializing play again voting');
      setPlayAgainVotes({
        votedPlayers: [],
        totalPlayers: data.players.filter(p => p.isConnected).length,
        allVoted: false,
        creatorVoted: false,
        canStartGame: false,
        gameCreator: data.players[0]?.id || null // First player is typically the creator
      });
    }
    
    setGameState(data);
  });


  newSocket.on('handUpdate', (hand) => {
    console.log('🃏 Hand updated:', hand.length, 'cards');
    setPlayerHand(hand);
  });

  newSocket.on('error', (errorMsg) => {
    console.log('❌ [FRONTEND] Socket Error:', errorMsg);
    console.log('❌ Error:', errorMsg);
    // Don't show 'not your turn' errors if we just tried to skip after drawing
    if (errorMsg.includes('Not your turn') && hasDrawnThisTurnRef.current) {
      console.log('🔇 Suppressing "not your turn" error after drawing');
      return;
    }
    addToast(errorMsg, 'error');
  });

  newSocket.on('success', (successMsg) => {
    console.log('✅ Success:', successMsg);
    addToast(successMsg, 'success');
  });

  newSocket.on('cardPlayed', (data) => {
    console.log('🃏 Card played:', data);
    // Use the socket ID directly instead of playerId state
    if (data.playerId !== newSocket.id) {
      addToast(`${data.playerName}: ${data.message}`, 'info');
    }
  });

  newSocket.on('newDeckAdded', (data) => {
  console.log('🆕 New deck added:', data);
  addToast(data.message, 'info');
});

newSocket.on('playerDrewCards', (data) => {
  console.log('📚 Player drew cards:', data);
  
  let message = '';
  if (data.fromPenalty) {
    message = `${data.playerName} drew ${data.cardCount} penalty cards`;
  } else {
    message = `${data.playerName} drew ${data.cardCount} card(s)`;
  }
  
  if (data.newDeckAdded) {
    message += ' 🆕';
  }
  
  addToast(message, 'info');
});
  newSocket.on('drawComplete', (data) => {
    console.log('🎲 Draw completed:', data);
    setIsDrawing(false);
    setHasDrawnThisTurn(true);

    if (data.canPlayDrawnCard && data.playableDrawnCards.length > 0) {
      addToast(
        `Drew ${data.drawnCards.length} cards. ${data.playableDrawnCards.length} can be played!`,
        'info'
      );
    } else {
      addToast(
        `Drew ${data.drawnCards.length} cards. No playable cards drawn.`,
        'info'
      );
    }
  });

  newSocket.on('playerPassedTurn', (data) => {
    console.log('👤 Player passed turn:', data);
    addToast(`${data.playerName} passed their turn`, 'info');
  });

  // Listen for timer updates from server
  newSocket.on('timerUpdate', (timerData) => {
    console.log('⏰ Timer update received:', timerData);
    setGlobalTimer({
      timeLeft: timerData.timeLeft,
      isWarning: timerData.isWarning,
      isActive: true
    });
  });

  // Handler for play again errors
  newSocket.on('playAgainError', (errorMsg) => {
    console.log('❌ Play Again Error:', errorMsg);
    addToast(`Failed to start new game: ${errorMsg}`, 'error');
  });

    newSocket.on('playAgainVoteUpdate', (voteData) => {
    console.log('🗳️ [FRONTEND] Received playAgainVoteUpdate:', voteData);
    console.log('🗳️ Play again vote update:', voteData);
    
    setPlayAgainVotes({
      votedPlayers: voteData.votedPlayers || [],
      totalPlayers: voteData.totalPlayers || 0,
      allVoted: voteData.allVoted || false,
      creatorVoted: voteData.creatorVoted || false,
      canStartGame: voteData.canStartGame || false,
      gameCreator: voteData.gameCreator || null
    });
    
    // Show notification when someone votes
    const lastVoter = voteData.votedPlayers[voteData.votedPlayers.length - 1];
    if (lastVoter && lastVoter.id !== playerIdRef.current) {
      addToast(`${lastVoter.name} voted to play again (${voteData.votedPlayers.length}/${voteData.totalPlayers})`, 'info');
    }
  });

  newSocket.on('newGameStarted', (data) => {
    console.log('🎮 New game started:', data);
    
    // Reset local state for new game
    setSelectedCards([]);
    setHasDrawnThisTurn(false);
    setIsDrawing(false);
    setIsSkipping(false);
    
    // Reset play again votes
    setPlayAgainVotes({
      votedPlayers: [],
      totalPlayers: 0,
      allVoted: false,
      creatorVoted: false,
      canStartGame: false,
      gameCreator: null
    });
    
    // Show success notification
    addToast(`🎮 ${data.message} Started by ${data.startedBy}`, 'success');
    
    // Log the new game start
    console.log(`🎮 New game started with ${data.playerCount} players`);
  });

  return () => {
    console.log('🔌 Cleaning up socket connection');
    newSocket.close();
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Intentionally empty dependency array to prevent reconnection loops

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

    const playerCount = activePlayers;
    
    // NEW: Check if this is a pure Jack stack in a 2-player game
    const isPureJackStack = cardStack.every(card => card.rank === 'Jack');
    const is2PlayerGame = playerCount === 2;
    
    if (isPureJackStack && is2PlayerGame) {
      console.log('🎯 Pure Jack stack in 2-player game - original player keeps turn');
      return true; // Original player always keeps turn
    }
    
    // Original turn simulation logic for other cases
    let currentIndex = 0; // Start relative to the current player
    let direction = 1; // Assume normal direction
    let pendingSkips = 0;

    for (const card of cardStack) {
      if (card.rank === 'Jack') {
        // Accumulate skip effects; actual move applied when a non-Jack is processed
        if (playerCount !== 2) {
          pendingSkips += 1;
        }
        continue;
      }

      if (pendingSkips > 0) {
        if (playerCount !== 2) {
          currentIndex = (currentIndex + pendingSkips + 1) % playerCount;
        }
        pendingSkips = 0;
      }

      switch (card.rank) {
        case 'Queen':
          direction *= -1;
          currentIndex = (currentIndex + direction + playerCount) % playerCount;
          break;
        case 'Ace':
        case '2':
        case '8':
          currentIndex = (currentIndex + direction + playerCount) % playerCount;
          break;
        default:
          currentIndex = (currentIndex + direction + playerCount) % playerCount;
          break;
      }
    }

    if (pendingSkips > 0) {
      if (playerCount !== 2) {
        currentIndex = (currentIndex + pendingSkips + 1) % playerCount;
      }
    }

    // Player keeps the turn only if we end back at index 0
    return currentIndex === 0;
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

// Listen for timer updates from server
useEffect(() => {
  if (!socket) return;

  socket.on('timerUpdate', (timerData) => {
    console.log('⏰ Timer update received:', timerData);
    setGlobalTimer({
      timeLeft: timerData.timeLeft,
      isWarning: timerData.isWarning,
      isActive: true
    });
  });

  return () => {
    socket.off('timerUpdate');
  };
}, [socket]);

// Handle game state changes to manage timer visibility
useEffect(() => {
  if (gameState?.gameState !== 'playing') {
    setGlobalTimer(prev => ({ ...prev, isActive: false }));
  }
}, [gameState?.gameState]);

  const startGame = () => {
  console.log('🚀 Starting game:', gameState?.gameId);
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
    // Cancel any pending skip actions
    if (lastSkipTimeRef.current && Date.now() - lastSkipTimeRef.current < 1000) {
      lastSkipTimeRef.current = 0; // Reset to prevent stale skips
    }
  }
}, [gameState?.currentPlayerId, playerId]);

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
      addToast('Please enter both name and game ID', 'error');
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
      addToast('Please enter your name', 'error');
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
          addToast(validation.error || `Cannot stack ${card.rank} of ${card.suit} with current selection.`, 'error');
        }
      }
    }
  };

  const playSelectedCards = () => {
    if (selectedCards.length === 0) {
      addToast('Please select at least one card', 'error');
      return;
    }

    // Final validation before sending to server
    const activePlayers = gameState?.players?.length || 2;
    const validation = validateCardStack(selectedCards, activePlayers);
    
    if (!validation.isValid) {
      addToast(validation.error, 'error');
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
          addToast('When playing 8s with other cards, all must be the same suit', 'error');
          return;
        }
      }
      setShowSuitSelector(true);
    } else {
      console.log('🃏 Playing cards:', selectedCards);
      socket.emit('playCard', {
      gameId: gameState?.gameId,
      cards: selectedCards,
      timerSettings: {
        enableTimer: settings.enableTimer,
        timerDuration: settings.timerDuration,
        timerWarningTime: settings.timerWarningTime
      }
    });
      setSelectedCards([]);
      setHasDrawnThisTurn(false);
      setIsDrawing(false);
    }
  };

  const handleSuitSelect = (suit) => {
    console.log('🃏 Playing wild card with suit:', suit);
    socket.emit('playCard', {
    gameId: gameState?.gameId,
    cards: selectedCards,
    declaredSuit: suit,
    timerSettings: {
      enableTimer: settings.enableTimer,
      timerDuration: settings.timerDuration,
      timerWarningTime: settings.timerWarningTime
    }
  });
    setSelectedCards([]);
    setShowSuitSelector(false);
    setHasDrawnThisTurn(false);
    setIsDrawing(false);
  };

  const drawCard = () => {
    const now = Date.now();
    
    // Prevent rapid-fire draw requests
    if (now - lastActionTime < 1000) {
      console.log('⚠️ Draw request ignored - too soon after last action');
      return;
    }

    // Check if it's our turn first
    if (!isMyTurn) {
      console.log('⚠️ Cannot draw card - not our turn');
      return;
    }

    if (isDrawing || hasDrawnThisTurn) {
      addToast('You have already drawn cards this turn', 'error');
      return;
    }

    console.log('📚 Drawing card');
    setLastActionTime(now);
    setIsDrawing(true);
    socket.emit('drawCard', {
      gameId: gameState?.gameId,
      timerSettings: { 
        enableTimer: settings.enableTimer,
        timerDuration: settings.timerDuration,
        timerWarningTime: settings.timerWarningTime
      }
    });
  };

  // Allow the player to manually skip their turn after drawing
  const skipTurn = () => {
    const now = Date.now();
    
    // Prevent duplicate skip requests within 2 seconds
    if (now - lastSkipTimeRef.current < 2000) {
      console.log('⚠️ Skip request ignored - too soon after last skip');
      return;
    }

    // Prevent duplicate skip requests
    if (isSkipping) {
      console.log('⚠️ Already skipping turn');
      return;
    }

    // Check if it's actually our turn before skipping
    if (!isMyTurn) {
      console.log('⚠️ Cannot skip turn - not our turn');
      return;
    }
    
    // Check if we have pending turn pass or have drawn this turn
    if (!hasDrawnThisTurn && gameState.pendingTurnPass !== playerId) {
      console.log('⚠️ Cannot skip turn - no pending turn pass or haven\'t drawn');
      addToast('You must draw a card before skipping your turn', 'error');
      return;
    }

    console.log('👋 Skipping turn');
    lastSkipTimeRef.current = now; // Record the skip time
    setIsSkipping(true);
    
    // IMPORTANT: Only send ONE event
    socket.emit('passTurnAfterDraw', {
      gameId: gameState?.gameId,
      timerSettings: { 
        enableTimer: settings.enableTimer,
        timerDuration: settings.timerDuration,
        timerWarningTime: settings.timerWarningTime
      }
    });
    
    setHasDrawnThisTurn(false);
    setIsDrawing(false);
    
    // Reset skipping state after a delay
    setTimeout(() => setIsSkipping(false), 1000);
  };


 const handlePlayAgainVote = () => {
    console.log('🗳️ [FRONTEND] handlePlayAgainVote called');
    console.log('🗳️ [FRONTEND] Socket exists:', !!socket);
    console.log('🗳️ [FRONTEND] Game ID:', gameState?.gameId);
    console.log('🗳️ [FRONTEND] Current playAgainVotes:', playAgainVotes);
  if (!socket || !gameState?.gameId) {
    addToast('Cannot vote for new game - no active game found', 'error');
    return;
  }

  // Check if already voted
  const hasVoted = playAgainVotes.votedPlayers.some(p => p.id === playerId);
  console.log('🗳️ [FRONTEND] Has already voted:', hasVoted);
  
  if (hasVoted) {
    // Remove vote
    console.log('🗳️ [FRONTEND] Removing play again vote for:', gameState.gameId);
    console.log('🗳️ Removing play again vote for:', gameState.gameId);
    socket.emit('removePlayAgainVote', {
      gameId: gameState.gameId
    });
  } else {
    console.log('🗳️ [FRONTEND] Voting for play again in:', gameState.gameId);
    // Add vote
    console.log('🗳️ Voting for play again in:', gameState.gameId);
    socket.emit('votePlayAgain', {
      gameId: gameState.gameId
    });
  }
};

const handleStartNewGame = () => {
  if (!socket || !gameState?.gameId) {
    addToast('Cannot start new game - no active game found', 'error');
    return;
  }

  if (playerId !== playAgainVotes.gameCreator) {
    addToast('Only the game creator can start the new game', 'error');
    return;
  }

  if (!playAgainVotes.canStartGame) {
    addToast('Cannot start game - not all players have voted', 'error');
    return;
  }

  console.log('🚀 Starting new game as creator:', gameState.gameId);
  
  socket.emit('startNewGame', {
    gameId: gameState.gameId
  });
  
  addToast('Starting new game...', 'info');
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
              🏠 Return to Lobby
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

export default App;
