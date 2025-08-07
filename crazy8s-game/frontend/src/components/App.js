import React, { useState, useEffect, useRef } from 'react';
import CardSortingPreferences from './CardSortingPreferences';
import { AuthModal, UserDashboard } from './auth';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ConnectionProvider, useConnection } from '../contexts/ConnectionContext';
import { CardSelectionProvider } from '../contexts/CardSelectionContext';
import { DragProvider } from '../contexts/DragContext';
import MainMenu from './MainMenu';
import {
  validateCardStackFrontend,
  canStackCardsFrontend
} from '../utils/cardValidation';

// Import extracted utilities
import { isSameCard, getValidCardsForSelection } from '../utils/cardUtils';
import { fireConfetti } from '../utils/animationUtils';

// Import extracted hooks
import { useToasts } from '../hooks/useToasts';

// Import React Icons
import { 
  FaBullseye, FaBook, FaSync, FaCog, FaTimes, FaGamepad, 
  FaComments, FaTrophy, FaRocket, FaFlag, FaChartBar, FaHome, 
  FaExclamationTriangle
} from 'react-icons/fa';
import { GiSpadeSkull } from 'react-icons/gi';
import { useSettings } from '../hooks/useSettings';
import { useModals } from '../hooks/useModals';
import { useGameState } from '../hooks/useGameState';
import { usePlayerHand } from '../hooks/usePlayerHand';
import { useTimer } from '../hooks/useTimer';
import { useTournament } from '../hooks/useTournament';
import { usePlayAgainVoting } from '../hooks/usePlayAgainVoting';

// Import extracted components
import Card from './Card'; // Updated to use our new drag-enabled Card
import ToastContainer from './ui/ToastContainer';
import TurnTimer from './ui/TurnTimer';
import DragPreview from './DragPreview';
import { useDragHandler } from '../hooks/useDragHandler';
import DropZone from './DropZone';




// Functions moved to utils/cardUtils.js

const PlayerHand = ({ cards, validCards = [], selectedCards = [], onCardSelect, settings = {} }) => {

  // Helper function to get rank value for sorting
  const getRankValue = (rank) => {
    // Use custom rank order from settings if available
    const rankOrder = settings.cardSortingPreferences?.customRankOrder || 
                      ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King', 'Ace'];
    const index = rankOrder.indexOf(rank);
    return index === -1 ? rankOrder.length : index; // Place unknown cards at the end
  };

  // Helper function to get suit order
  const getSuitValue = (suit) => {
    const suitOrder = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
    return suitOrder.indexOf(suit);
  };

  // Updated card organizing function
  const organizeCards = () => {
    let organizedCards = [...cards];
    
    // Sort by rank if enabled
    if (settings.sortByRank) {
      organizedCards.sort((a, b) => {
        const rankA = getRankValue(a.rank);
        const rankB = getRankValue(b.rank);
        
        if (rankA !== rankB) {
          return rankA - rankB;
        }
        
        // If ranks are the same, sort by suit as a tiebreaker
        return getSuitValue(a.suit) - getSuitValue(b.suit);
      });
    }
    
    // Group by suit if enabled (applied after rank sorting)
    if (settings.groupBySuit) {
      organizedCards.sort((a, b) => {
        const suitA = getSuitValue(a.suit);
        const suitB = getSuitValue(b.suit);
        
        if (suitA !== suitB) {
          return suitA - suitB;
        }
        
        // If suits are the same, maintain the rank order established above
        return getRankValue(a.rank) - getRankValue(b.rank);
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
              {group.cards.map((card) => {
                const isPlayable = validCards.some(vc => isSameCard(vc, card));
                const isSelected = selectedCards.some(sc => isSameCard(sc, card));
                const selectedIndex = selectedCards.findIndex(sc => isSameCard(sc, card));
                const isBottomCard = selectedIndex === 0;
                const cardKey = card.id || `${card.suit}-${card.rank}`;
                
                return (
                  <Card
                    key={cardKey}
                    card={card}
                    isPlayable={isPlayable}
                    isSelected={isSelected}
                    selectedIndex={selectedIndex}
                    isBottomCard={isBottomCard && selectedCards.length > 1}
                    settings={settings}
                    onCardSelect={onCardSelect}
                    allCards={cards}
                  />
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
      justifyContent: 'center',
      alignItems: 'center',
      padding: '40px 20px',
      backgroundColor: '#27ae60',
      borderRadius: '20px',
      margin: '20px 0',
      minHeight: '180px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        gap: '40px',
        alignItems: 'flex-start',
        justifyContent: 'center'
      }}>
        {/* Draw Pile Column */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
            Draw Pile
          </div>
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
          
          {/* Draw Stack indicator under draw pile */}
          {gameState.drawStack > 0 && (
            <div style={{
              color: '#fff',
              backgroundColor: '#e67e22',
              padding: '4px 8px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              animation: 'pulse 2s infinite',
              textAlign: 'center',
              minWidth: '60px'
            }}>
              <FaBook style={{ marginRight: '4px', fontSize: '8px' }} />+{gameState.drawStack}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div style={{ 
          color: '#fff', 
          fontWeight: 'bold', 
          fontSize: '24px',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          alignSelf: 'flex-start',
          marginTop: '80px'
        }}>
          →
        </div>

        {/* Top Card Column with Drop Zone */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <DropZone
            id="discardPile"
            acceptCards={true}
            label=""
            style={{
              minWidth: '130px',
              minHeight: '160px',
              backgroundColor: topCard ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
              border: '2px solid rgba(255,255,255,0.3)',
              position: 'relative'
            }}
          >
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
              Discard Pile
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
              border: '2px dashed rgba(255,255,255,0.5)',
              borderRadius: '12px', // Increased to match
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#bdc3c7',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }}>
              Empty
            </div>
          )}
          </DropZone>
          
          {/* Reversed indicator under top card */}
          {gameState.direction === -1 && (
            <div style={{
              color: '#fff',
              backgroundColor: '#9b59b6',
              padding: '4px 8px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              textAlign: 'center',
              minWidth: '60px'
            }}>
              <FaSync style={{ marginRight: '4px', fontSize: '8px' }} />Reversed
            </div>
          )}
        </div>
      </div>

      {/* Declared Suit Indicator (centered) */}
      {gameState.declaredSuit && (
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          marginTop: '15px'
        }}>
          <div style={{
            color: '#fff',
            backgroundColor: '#e74c3c',
            padding: '8px 15px',
            borderRadius: '15px',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            <FaBullseye style={{ marginRight: '8px' }} />Current Suit: {gameState.declaredSuit}
          </div>
        </div>
      )}
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

// ToastContainer moved to components/ui/ToastContainer.js

// Toast moved to components/ui/Toast.js

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
      setMessages(prev => [...prev.slice(-50), `${data.playerName}: ${data.message}`]);
    });

    socket.on('playerDrewCards', (data) => {
      setMessages(prev => [...prev.slice(-50), `${data.playerName} drew ${data.cardCount} card(s)`]);
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
          padding: '8px 10px',
          borderBottom: '1px solid #ddd',
          fontWeight: 'bold',
          backgroundColor: '#f8f9fa',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#000',
          minHeight: '40px'
        }}
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}><FaComments style={{ marginRight: '8px' }} />Game Chat</span>
        <span style={{ fontSize: '12px', display: 'flex', alignItems: 'center' }}>{isMinimized ? '▲' : '▼'}</span>
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
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
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

// TurnTimer moved to components/ui/TurnTimer.js

// Tournament Components

// Tournament Status Display
const TournamentStatus = ({ gameState }) => {
  if (!gameState?.tournament?.active) return null;

  const tournament = gameState.tournament;
  
  return (
    <div style={{
      backgroundColor: '#2c3e50',
      color: '#fff',
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '20px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: 'gold' }}><FaTrophy style={{ marginRight: '8px' }} />Tournament Mode</h3>
        <div style={{ fontSize: '14px', opacity: 0.8, color: '#000' }}>
          Round {tournament.currentRound}
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '10px',
        fontSize: '12px'
      }}>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Active Players</div>
          <div style={{ color: '#3498db' }}>{tournament.activePlayers}</div>
        </div>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Safe This Round</div>
          <div style={{ color: '#27ae60' }}>{tournament.safeThisRound}</div>
        </div>
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Eliminated</div>
          <div style={{ color: '#e74c3c' }}>{tournament.eliminatedThisRound}</div>
        </div>
      </div>
    </div>
  );
};

// Safe Player Notification
const SafePlayerNotification = ({ isPlayerSafe, playerName, gameState, onStartNextRound, playerId, currentPlayerId }) => {
  // Trigger confetti only when current player becomes safe
  useEffect(() => {
    if (isPlayerSafe && playerId === currentPlayerId) {
      console.log('🎉 Current player became safe, triggering confetti!');
      fireConfetti();
    }
  }, [isPlayerSafe, playerId, currentPlayerId]);

  if (!isPlayerSafe) return null;

  const showStartButton = gameState?.tournament?.active && !gameState?.tournament?.roundInProgress;

  return (
    <div style={{
      backgroundColor: '#27ae60',
      color: '#fff',
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '20px',
      textAlign: 'center',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      animation: 'pulse 1s infinite'
    }}>
      <div style={{ fontSize: '24px', marginBottom: '8px' }}><FaTrophy /></div>
      <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
        You're Safe!
      </div>
      <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: showStartButton ? '15px' : '0' }}>
        You advance to the next round and cannot play more cards.
      </div>
      
      {showStartButton && (
        <button
          onClick={onStartNextRound}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2c3e50',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#34495e'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2c3e50'}
        >
          <FaRocket style={{ marginRight: '8px' }} />Start Next Round
        </button>
      )}
    </div>
  );
};

// Round End Modal
const RoundEndModal = ({ isOpen, roundData, nextRoundTimer, onClose, onStartNextRound, isPlayerSafe }) => {
  if (!isOpen || !roundData) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1500
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '15px',
        maxWidth: '500px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>
          <FaFlag style={{ marginRight: '8px' }} />Round {roundData.round} Complete!
        </h2>
        
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>
              Safe Players (Advancing):
            </div>
            <div style={{ color: '#27ae60', fontWeight: 'bold' }}>
              {roundData.safeePlayers.join(', ') || 'None'}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>
              Eliminated:
            </div>
            <div style={{ color: '#e74c3c', fontWeight: 'bold' }}>
              {roundData.eliminatedPlayers.join(', ') || 'None'}
            </div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          {isPlayerSafe && onStartNextRound && (
            <button
              onClick={onStartNextRound}
              style={{
                padding: '12px 25px',
                backgroundColor: '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2ecc71'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#27ae60'}
            >
              <FaRocket style={{ marginRight: '8px' }} />Start Next Round Now
            </button>
          )}
        </div>
        
        {nextRoundTimer > 0 && (
          <div style={{
            backgroundColor: '#3498db',
            color: '#fff',
            padding: '15px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '15px'
          }}>
            {isPlayerSafe ? 'Auto-start in' : 'Next round starts in'} {nextRoundTimer} second{nextRoundTimer !== 1 ? 's' : ''}...
          </div>
        )}
        
        <div style={{
          fontSize: '14px',
          color: '#7f8c8d'
        }}>
          {roundData.activePlayers} players remaining in tournament
          {isPlayerSafe && (
            <div style={{ marginTop: '5px', color: '#27ae60', fontWeight: 'bold' }}>
              ✨ You're advancing to the next round!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Tournament Winner Modal
const TournamentWinnerModal = ({ isOpen, winnerData, onClose }) => {
  if (!isOpen || !winnerData) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1500
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '20px',
        maxWidth: '600px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}><FaTrophy /></div>
        
        <h1 style={{ 
          color: '#f39c12', 
          marginBottom: '10px',
          fontSize: '32px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
        }}>
          Tournament Champion!
        </h1>
        
        <div style={{
          fontSize: '24px',
          color: '#2c3e50',
          fontWeight: 'bold',
          marginBottom: '30px'
        }}>
          🥇 {winnerData.winner.name}
        </div>
        
        {winnerData.stats && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '30px',
            textAlign: 'left'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px', textAlign: 'center' }}>
              <FaChartBar style={{ marginRight: '8px' }} />Tournament Statistics
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#7f8c8d' }}>Total Rounds:</div>
                <div style={{ color: '#2c3e50' }}>{winnerData.stats.totalRounds}</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#7f8c8d' }}>Total Players:</div>
                <div style={{ color: '#2c3e50' }}>{winnerData.stats.totalPlayers}</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#7f8c8d' }}>Duration:</div>
                <div style={{ color: '#2c3e50' }}>
                  {Math.floor(winnerData.stats.totalTime / 60000)} minutes
                </div>
              </div>
            </div>
            
            {winnerData.stats.eliminationOrder && winnerData.stats.eliminationOrder.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ fontWeight: 'bold', color: '#7f8c8d', marginBottom: '10px' }}>
                  Final Rankings:
                </div>
                <div style={{ fontSize: '12px' }}>
                  {winnerData.stats.eliminationOrder.map((entry, index) => (
                    <div key={index} style={{ 
                      padding: '4px 0',
                      borderBottom: index < winnerData.stats.eliminationOrder.length - 1 ? '1px solid #eee' : 'none'
                    }}>
                      #{entry.position}: {entry.player.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '15px 30px',
            backgroundColor: '#3498db',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
        >
          <FaHome style={{ marginRight: '8px' }} />Return to Lobby
        </button>
      </div>
    </div>
  );
};

// Tournament Player Display
const TournamentPlayerDisplay = ({ players, gameState }) => {
  if (!gameState?.tournament?.active) return null;

  const playingPlayers = players.filter(p => !p.isSafe && !p.isEliminated);
  const safePlayers = players.filter(p => p.isSafe);
  const eliminatedPlayers = players.filter(p => p.isEliminated);

  return (
    <div style={{
      backgroundColor: '#fff',
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>Tournament Status</h4>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
        fontSize: '14px'
      }}>
        {playingPlayers.length > 0 && (
          <div>
            <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}>
              <FaGamepad style={{ marginRight: '8px' }} />Still Playing ({playingPlayers.length})
            </div>
            {playingPlayers.map(player => (
              <div key={player.id} style={{
                padding: '6px 10px',
                margin: '2px 0',
                backgroundColor: player.isCurrentPlayer ? '#3498db' : '#ecf0f1',
                color: player.isCurrentPlayer ? '#fff' : '#2c3e50',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {player.name} ({player.handSize} cards)
                {player.isCurrentPlayer && <FaBullseye style={{ marginLeft: '8px' }} />}
              </div>
            ))}
          </div>
        )}
        
        {safePlayers.length > 0 && (
          <div>
            <div style={{ fontWeight: 'bold', color: '#27ae60', marginBottom: '8px' }}>
              <FaTrophy style={{ marginRight: '8px' }} />Safe ({safePlayers.length})
            </div>
            {safePlayers.map(player => (
              <div key={player.id} style={{
                padding: '6px 10px',
                margin: '2px 0',
                backgroundColor: '#d5f4e6',
                color: '#27ae60',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {player.name} ✓
              </div>
            ))}
          </div>
        )}
        
        {eliminatedPlayers.length > 0 && (
          <div>
            <div style={{ fontWeight: 'bold', color: '#e74c3c', marginBottom: '8px' }}>
              ❌ Eliminated ({eliminatedPlayers.length})
            </div>
            {eliminatedPlayers.map(player => (
              <div key={player.id} style={{
                padding: '6px 10px',
                margin: '2px 0',
                backgroundColor: '#fadbd8',
                color: '#e74c3c',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                {player.name}
              </div>
            ))}
          </div>
        )}
      </div>
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


// Main App component (wrapped with authentication)
const GameApp = () => {
  const { user, token, isAuthenticated, updateSettings, migrateLocalSettings: authMigrateSettings, logout } = useAuth();
  const { socket, isConnected, connectWithAuth, connectAsGuest, requestGameState, addConnectionListener } = useConnection();
  
  // Use extracted hooks
  const { gameState, setGameState, playerId, setPlayerId, playerName, setPlayerName, gameId, setGameId } = useGameState();
  const { playerHand, setPlayerHand, selectedCards, setSelectedCards, validCards, setValidCards } = usePlayerHand();
  const { toasts, addToast, removeToast, setToasts } = useToasts();
  const { settings, setSettings } = useSettings();
  const { 
    showSettings, showAuthModal, showUserDashboard, showSuitSelector,
    setShowSettings, setShowAuthModal, setShowUserDashboard, setShowSuitSelector 
  } = useModals();
  const [copiedGameId, setCopiedGameId] = useState(false);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(0);
  const [showTournamentInfo, setShowTournamentInfo] = useState(false);
  
  // Use extracted hooks for timer and tournament
  const { globalTimer, setGlobalTimer, timerDurationRef, timerWarningTimeRef } = useTimer(settings);
  
  // Handle card drops on discard pile
  const handleCardDrop = (dropZoneId, cards) => {
    if (dropZoneId === 'discardPile' && cards.length > 0) {
      // Use the existing playSelectedCards function since cards are already selected
      playSelectedCards();
    }
  };
  
  // Initialize drag handler
  useDragHandler(handleCardDrop);
  const {
    showRoundEndModal, setShowRoundEndModal, roundEndData, setRoundEndData,
    nextRoundTimer, setNextRoundTimer, showTournamentWinnerModal, setShowTournamentWinnerModal,
    tournamentWinnerData, setTournamentWinnerData, setTournamentStatus
  } = useTournament();
  const { playAgainVotes, setPlayAgainVotes } = usePlayAgainVoting();

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


  // Timer refs now provided by useTimer hook
  const playerIdRef = useRef(playerId);
  const hasDrawnThisTurnRef = useRef(hasDrawnThisTurn);
  const lastSkipTimeRef = useRef(0);
  const [isSkipping, setIsSkipping] = useState(false);

  // Toast functions now provided by useToasts hook

  // Play again voting now handled by usePlayAgainVoting hook


  // Keep refs in sync with settings
  useEffect(() => {
    timerDurationRef.current = settings.timerDuration;
    timerWarningTimeRef.current = settings.timerWarningTime;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Load settings from localStorage on component mount with enhanced compatibility
  useEffect(() => {
    if (playerId) {
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

      // Check if user is authenticated and has server settings
      if (isAuthenticated && user?.settings) {
        // Use server settings for authenticated users
        const serverSettings = { ...defaultSettings, ...user.settings };
        setSettings(serverSettings);
        console.log('📱 Loaded settings from user account');
      } else {
        // Fallback to localStorage for unauthenticated users
        const savedSettings = localStorage.getItem(`crazy8s_settings_${playerId}`);
        if (savedSettings) {
          try {
            const parsed = JSON.parse(savedSettings);
            const mergedSettings = { ...defaultSettings, ...parsed };
            setSettings(mergedSettings);
            console.log('📱 Loaded settings from localStorage');
          } catch (error) {
            console.log('❌ Error loading settings:', error);
            setSettings(defaultSettings);
          }
        } else {
          setSettings(defaultSettings);
        }
      }
    }
  }, [playerId, isAuthenticated, user, setSettings]);

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

  // Save settings with backward compatibility and server sync
  const handleSettingsChange = async (newSettings) => {
    const validatedSettings = validateTimerSettings(newSettings);
    
    // Check what local settings changed and show appropriate toast
    const oldSettings = settings;
    if (oldSettings.sortByRank !== validatedSettings.sortByRank) {
      addToast(validatedSettings.sortByRank ? 'Card sorting by rank enabled' : 'Card sorting by rank disabled', 'success');
    }
    if (oldSettings.groupBySuit !== validatedSettings.groupBySuit) {
      addToast(validatedSettings.groupBySuit ? 'Card grouping by suit enabled' : 'Card grouping by suit disabled', 'success');
    }
    if (oldSettings.experiencedMode !== validatedSettings.experiencedMode) {
      addToast(validatedSettings.experiencedMode ? 'Experienced mode enabled' : 'Experienced mode disabled', 'success');
    }
    
    setSettings(validatedSettings);
    
    // Save to appropriate storage based on authentication status
    if (isAuthenticated && updateSettings) {
      // Save to server for authenticated users
      try {
        await updateSettings(validatedSettings);
        console.log('✅ Settings synced to server');
      } catch (error) {
        console.error('❌ Failed to sync settings to server:', error);
        // Fallback to localStorage if server sync fails
        if (playerId) {
          localStorage.setItem(`crazy8s_settings_${playerId}`, JSON.stringify(validatedSettings));
        }
      }
    } else {
      // Save to localStorage for unauthenticated users
      if (playerId) {
        const settingsToSave = {
          ...validatedSettings,
          _metadata: {
            lastModified: new Date().toISOString(),
            version: '2.0.0',
            playerId: playerId
          }
        };
        localStorage.setItem(`crazy8s_settings_${playerId}`, JSON.stringify(settingsToSave));
        console.log('💾 Settings saved to localStorage');
      }
    }
    
    // Only send timer settings to server if timer settings actually changed
    const timerSettingsChanged = 
      oldSettings.enableTimer !== validatedSettings.enableTimer ||
      oldSettings.timerDuration !== validatedSettings.timerDuration ||
      oldSettings.timerWarningTime !== validatedSettings.timerWarningTime;
      
    if (socket && gameState?.gameId && timerSettingsChanged) {
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
    } else if (gameState?.currentPlayerId === playerId) {
      // When it becomes our turn, sync with backend's draw tracking
      const hasDrawnAccordingToServer = gameState?.playersWhoHaveDrawn?.includes(playerId) || false;
      setHasDrawnThisTurn(hasDrawnAccordingToServer);
    }
  }, [gameState?.currentPlayerId, gameState?.playersWhoHaveDrawn, playerId]);

  // Clear selected cards when turn changes
  useEffect(() => {
    const isMyTurn = gameState?.currentPlayerId === playerId;
    if (!isMyTurn) {
      setSelectedCards([]);
    }
  }, [gameState?.currentPlayerId, playerId, setSelectedCards]);

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

  // Initialize socket connection with authentication support and enhanced reconnection
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('🔌 Creating authenticated socket connection');
      connectWithAuth(token);
    } else {
      console.log('🔌 Creating guest socket connection');
      connectAsGuest();
    }
  }, [isAuthenticated, token, connectWithAuth, connectAsGuest]);

  // Game event handlers - set up when socket is available
  useEffect(() => {
    if (!socket) return;

    const handleGameUpdate = (data) => {
      console.log('🎮 Game state updated:', data);
      console.log('  📊 Current Player:', data.currentPlayer, '(ID:', data.currentPlayerId, ')');
      console.log('  🆔 My Player ID:', playerIdRef.current);
      console.log('  🎯 Is My Turn:', data.currentPlayerId === playerIdRef.current);
    
    if (data.currentPlayerId !== playerIdRef.current) {
      setHasDrawnThisTurn(false);
      setIsDrawing(false);
    } else {
      // Sync with backend's authoritative draw tracking
      const hasDrawnAccordingToServer = data.playersWhoHaveDrawn?.includes(playerIdRef.current) || false;
      setHasDrawnThisTurn(hasDrawnAccordingToServer);
    }
    
    // Initialize play again voting when game finishes
    if (data.gameState === 'finished' && gameState?.gameState !== 'finished') {
      console.log('🎮 Game finished - initializing play again voting');
      
      // Check if current player is the winner and trigger confetti
      const winner = data.players.find(p => !p.isEliminated);
      if (winner && winner.id === playerIdRef.current) {
        console.log('🎉 Current player won the game!');
        fireConfetti();
      }
      
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
    };

    const handleHandUpdate = (hand) => {
    console.log('🃏 Hand updated:', hand.length, 'cards');
    console.log('🔍 First few cards:', hand.slice(0, 3).map(card => ({ id: card.id, suit: card.suit, rank: card.rank })));
    
      setPlayerHand(hand);
    };

    const handleError = (errorMsg) => {
    console.log('❌ [FRONTEND] Socket Error:', errorMsg);
    console.log('❌ Error:', errorMsg);
    // Don't show 'not your turn' errors if we just tried to skip after drawing
    if (errorMsg.includes('Not your turn') && hasDrawnThisTurnRef.current) {
      console.log('🔇 Suppressing "not your turn" error after drawing');
      return;
    }
      addToast(errorMsg, 'error');
    };

    const handleSuccess = (successMsg) => {
    console.log('✅ Success:', successMsg);
      addToast(successMsg, 'success');
    };

    const handleCardPlayed = (data) => {
    console.log('🃏 Card played:', data);
      // Use the socket ID directly instead of playerId state
      if (data.playerId !== socket.id) {
        addToast(`${data.playerName}: ${data.message}`, 'info');
      }
    };

    const handleNewDeckAdded = (data) => {
    console.log('🆕 New deck added:', data);
      addToast(data.message, 'info');
    };

    const handlePlayerDrewCards = (data) => {
    console.log('📚 Player drew cards:', data);
    
    let message = '';
    if (data.fromPenalty) {
      message = `${data.playerName} drew ${data.cardCount} penalty cards`;
    } else {
      message = `${data.playerName} drew ${data.cardCount} card(s)`;
    }
    
    if (data.newDeckAdded) {
      message += ' NEW';
    }
    
      addToast(message, 'info');
    };
  
    const handleDrawComplete = (data) => {
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
        `Drew ${data.drawnCards.length} cards.`,
        'info'
      );
      }
    };

    const handlePlayerPassedTurn = (data) => {
    console.log('👤 Player passed turn:', data);
      addToast(`${data.playerName} passed their turn`, 'info');
    };

    // Listen for timer updates from server
    const handleTimerUpdate = (timerData) => {
    console.log('⏰ Timer update received:', timerData);
    setGlobalTimer({
      timeLeft: timerData.timeLeft,
      isWarning: timerData.isWarning,
      isActive: true
      });
    };

    // Handler for play again errors
    const handlePlayAgainError = (errorMsg) => {
    console.log('❌ Play Again Error:', errorMsg);
      addToast(`Failed to start new game: ${errorMsg}`, 'error');
    };

    const handlePlayAgainVoteUpdate = (voteData) => {
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
    };

    const handleNewGameStarted = (data) => {
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
    addToast(`${data.message} Started by ${data.startedBy}`, 'success');
    
    // Log the new game start
    console.log(`🎮 New game started with ${data.playerCount} players`);
    };

    // Tournament-specific socket listeners
    const handlePlayerSafe = (data) => {
    console.log('🏆 Player safe:', data);
    addToast(`${data.message}`, 'success');
    // Trigger confetti only for the player who became safe
    if (data.playerId === playerIdRef.current) {
      fireConfetti();
      }
    };

    const handleRoundEnded = (data) => {
    console.log('🏁 Round ended:', data);
    setRoundEndData(data);
    setShowRoundEndModal(true);
    setNextRoundTimer(data.nextRoundStartsIn);
    
    // Start countdown timer
    const timer = setInterval(() => {
      setNextRoundTimer(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowRoundEndModal(false);
          return 0;
        }
        return prev - 1;
        });
      }, 1000);
    };

    const handleTournamentFinished = (data) => {
    console.log('🏆 Tournament finished:', data);
    setTournamentWinnerData(data);
    setShowTournamentWinnerModal(true);
    addToast(`${data.message}`, 'success');
    
    // Trigger confetti only for the tournament winner
    if (data.winnerId === playerIdRef.current) {
      fireConfetti();
      
      // Prompt guest winners to create account to save their achievement
      if (!isAuthenticated) {
        setTimeout(() => {
          const shouldCreateAccount = window.confirm(
            '🎉 Congratulations on winning!\n\n' +
            'Want to save this victory?\n' +
            'Create an account to:\n' +
            '• Track your wins and achievements\n' +
            '• Build your gaming statistics\n' +
            '• Show off your victories to friends\n\n' +
            'Create account now?'
          );
          
          if (shouldCreateAccount) {
            setShowAuthModal(true);
          }
        }, 2000); // Show after confetti
      }
    } else {
      // Also prompt non-winners to create accounts for stats tracking
      if (!isAuthenticated) {
        setTimeout(() => {
          const shouldCreateAccount = window.confirm(
            'Great game!\n\n' +
            'Want to track your gaming progress?\n' +
            'Create an account to:\n' +
            '• Save your game statistics\n' +
            '• Track improvements over time\n' +
            '• Unlock achievements\n\n' +
            'Create account now?'
          );
          
          if (shouldCreateAccount) {
            setShowAuthModal(true);
          }
        }, 3000); // Show after celebration
      }
      }
    };

    const handleTournamentStatus = (data) => {
    console.log('📊 Tournament status:', data);
      setTournamentStatus(data);
    };

    const handleRoundStarted = (data) => {
    console.log('🚀 Round started:', data);
    addToast(`${data.message}`, 'success');
    setShowRoundEndModal(false);
      setNextRoundTimer(0);
    };

    // Register all event handlers
    socket.on('gameUpdate', handleGameUpdate);
    socket.on('handUpdate', handleHandUpdate);
    socket.on('error', handleError);
    socket.on('success', handleSuccess);
    socket.on('cardPlayed', handleCardPlayed);
    socket.on('newDeckAdded', handleNewDeckAdded);
    socket.on('playerDrewCards', handlePlayerDrewCards);
    socket.on('drawComplete', handleDrawComplete);
    socket.on('playerPassedTurn', handlePlayerPassedTurn);
    socket.on('timerUpdate', handleTimerUpdate);
    socket.on('playAgainError', handlePlayAgainError);
    socket.on('playAgainVoteUpdate', handlePlayAgainVoteUpdate);
    socket.on('newGameStarted', handleNewGameStarted);
    socket.on('playerSafe', handlePlayerSafe);
    socket.on('roundEnded', handleRoundEnded);
    socket.on('tournamentFinished', handleTournamentFinished);
    socket.on('tournamentStatus', handleTournamentStatus);
    socket.on('roundStarted', handleRoundStarted);


    // Cleanup function
    return () => {
      console.log('🔌 Cleaning up game socket event listeners');
      socket.off('gameUpdate', handleGameUpdate);
      socket.off('handUpdate', handleHandUpdate);
      socket.off('error', handleError);
      socket.off('success', handleSuccess);
      socket.off('cardPlayed', handleCardPlayed);
      socket.off('newDeckAdded', handleNewDeckAdded);
      socket.off('playerDrewCards', handlePlayerDrewCards);
      socket.off('drawComplete', handleDrawComplete);
      socket.off('playerPassedTurn', handlePlayerPassedTurn);
      socket.off('timerUpdate', handleTimerUpdate);
      socket.off('playAgainError', handlePlayAgainError);
      socket.off('playAgainVoteUpdate', handlePlayAgainVoteUpdate);
      socket.off('newGameStarted', handleNewGameStarted);
      socket.off('playerSafe', handlePlayerSafe);
      socket.off('roundEnded', handleRoundEnded);
      socket.off('tournamentFinished', handleTournamentFinished);
      socket.off('tournamentStatus', handleTournamentStatus);
      socket.off('roundStarted', handleRoundStarted);
    };
  }, [socket, gameState, playerId, isAuthenticated, addToast, isDrawing, playerIdRef, setHasDrawnThisTurn, setIsDrawing, setIsSkipping, setSelectedCards, setGameState, setPlayerHand, hasDrawnThisTurnRef, setPlayAgainVotes, setRoundEndData, setShowRoundEndModal, setNextRoundTimer, setTournamentWinnerData, setShowTournamentWinnerModal, setShowAuthModal, setTournamentStatus, setGlobalTimer]); // Dependencies for game event handlers

  // Set playerId when socket is available and connected
  useEffect(() => {
    if (socket && socket.connected && socket.id) {
      console.log('🔌 Setting playerId from socket:', socket.id);
      setPlayerId(socket.id);
    }
  }, [socket, socket?.connected, socket?.id, setPlayerId]);

  // Listen for connection events from ConnectionContext
  useEffect(() => {
    const handleConnectionEvent = (event, data) => {
      if (event === 'connected' && data.socketId) {
        console.log('🔌 Connection established, setting playerId:', data.socketId);
        setPlayerId(data.socketId);
        removeToast();
        
        // Request game state if we were in a game
        if (gameId || (gameState && gameState.gameState !== 'waiting')) {
          console.log('🎮 Requesting game state restoration after connection');
          requestGameState();
        }
      }
    };

    const unsubscribe = addConnectionListener(handleConnectionEvent);
    return () => unsubscribe();
  }, [addConnectionListener, gameId, gameState, requestGameState, removeToast, setPlayerId]);

  // Authentication event handlers
  useEffect(() => {
    if (!socket) return;

    const handleAuthenticated = (data) => {
      console.log('✅ Socket authenticated as user:', data.user?.username);
      if (data.user) {
        setPlayerName(data.user.displayName || data.user.username);
        // Migrate settings from localStorage if this is first login
        if (playerId) {
          authMigrateSettings(playerId);
        }
      }
    };

    const handleGuestConnected = () => {
      console.log('✅ Connected as guest');
    };

    const handleConnectSuccess = (data) => {
      console.log('✅ Connection confirmed by server:', data);
    };

    socket.on('authenticated', handleAuthenticated);
    socket.on('guest_connected', handleGuestConnected);
    socket.on('connect_success', handleConnectSuccess);

    return () => {
      socket.off('authenticated', handleAuthenticated);
      socket.off('guest_connected', handleGuestConnected);
      socket.off('connect_success', handleConnectSuccess);
    };
  }, [socket, playerId, authMigrateSettings, setPlayerName]);

  const parseTopCard = (cardString) => {
    if (!cardString) return null;
    const parts = cardString.split(' of ');
    if (parts.length !== 2) return null;
    return { rank: parts[0], suit: parts[1] };
  };

  // Update valid cards when playerHand or gameState changes
  useEffect(() => {
    if (gameState && playerHand.length > 0) {
      const topCard = parseTopCard(gameState.topCard);
      if (!topCard) return;

      // Calculate valid cards with empty selection for UI highlighting
      const valid = getValidCardsForSelection(playerHand, gameState, [], topCard);
      setValidCards(valid);
      
      // Clear invalid selected cards when top card changes
      setSelectedCards(prev => {
        if (prev.length > 0) {
          const stillValid = prev.filter(selectedCard => 
            valid.some(validCard => validCard.id === selectedCard.id)
          );
          
          if (stillValid.length !== prev.length) {
            console.log('🔄 Clearing invalid selected cards due to game state change');
            return stillValid;
          }
        }
        return prev;
      });
    } else {
      setValidCards([]);
      setSelectedCards([]); // Clear selected cards when no valid cards
    }
  }, [playerHand, gameState, setSelectedCards, setValidCards]);

  // Update valid cards when selected cards change (for stacking)
  useEffect(() => {
    if (gameState && playerHand.length > 0) {
      const topCard = parseTopCard(gameState.topCard);
      if (!topCard) return;

      // Calculate valid cards with current selection for stacking logic
      const valid = getValidCardsForSelection(playerHand, gameState, selectedCards, topCard);
      setValidCards(valid);
    }
  }, [selectedCards, playerHand, gameState, setValidCards]);

// Handle game state changes to manage timer visibility
useEffect(() => {
  if (gameState?.gameState !== 'playing') {
    setGlobalTimer(prev => ({ ...prev, isActive: false }));
  }
}, [gameState?.gameState, setGlobalTimer]);

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
    setSelectedCards([]); // Clear selected cards when it's not our turn
    // Cancel any pending skip actions
    if (lastSkipTimeRef.current && Date.now() - lastSkipTimeRef.current < 1000) {
      lastSkipTimeRef.current = 0; // Reset to prevent stale skips
    }
  }
}, [gameState?.currentPlayerId, playerId, setSelectedCards]);

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


  

  const handleCardSelect = (card) => {
    console.log(`🎯 Selecting card: ${card.rank} of ${card.suit} (ID: ${card.id})`);
    
    // Only allow card selection when it's the player's turn
    if (!isMyTurn) {
      addToast('⏳ Wait for your turn to select cards', 'warning');
      return;
    }
    
    const isSelected = selectedCards.some(sc => isSameCard(sc, card));
    
    if (isSelected) {
      // If the card is already selected, handle reordering/deselection
      if (selectedCards.length === 1) {
        // Only one card selected (the bottom card) - deselect it
        setSelectedCards([]);
      } else {
        // Multiple cards selected - remove this card for reordering
        setSelectedCards(prev => prev.filter(sc => !isSameCard(sc, card)));
      }
    } else {
      if (selectedCards.length === 0) {
        // No cards selected, select this card as bottom card
        setSelectedCards([card]);
      } else {
        // Check if this card can be stacked with the current selection using frontend validation
        const activePlayers = gameState?.players?.length || 2;
        
        if (canStackCardsFrontend(selectedCards, card, activePlayers)) {
          setSelectedCards(prev => [...prev, card]);
        } else {
          // Can't stack - show specific error message from frontend validation
          const validation = validateCardStackFrontend([...selectedCards, card], activePlayers);
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

    // Check if it's the player's turn
    if (!isMyTurn) {
      addToast('⏳ Wait for your turn to play cards', 'warning');
      return;
    }
    
    // Validate that all selected cards are still valid against current game state
    const topCard = parseTopCard(gameState.topCard);
    if (!topCard) {
      addToast('Unable to determine current top card', 'error');
      return;
    }
    
    const validCards = getValidCardsForSelection(playerHand, gameState, selectedCards, topCard);
    const allSelectedAreValid = selectedCards.every(selectedCard => 
      validCards.some(validCard => validCard.id === selectedCard.id)
    );
    
    if (!allSelectedAreValid) {
      addToast('Selected cards are no longer valid - game state has changed', 'error');
      setSelectedCards([]); // Clear invalid selection
      return;
    }

    // Final validation before sending to server
    const activePlayers = gameState?.players?.length || 2;
    const validation = validateCardStackFrontend(selectedCards, activePlayers);
    
    if (!validation.isValid) {
      addToast(validation.error, 'error');
      return;
    }

    const hasWild = selectedCards.some(card => card.rank === '8');
    
    if (hasWild) {
      // Check if ALL selected cards are 8s (can't mix 8s with other ranks unless same suit)
      const validation = validateCardStackFrontend(selectedCards, activePlayers);
        if (!validation.isValid) {
          addToast(validation.error, 'error');
          return;
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

const handleStartNextRound = () => {
  if (!socket || !gameState?.gameId) {
    addToast('Cannot start next round - no active game found', 'error');
    return;
  }

  console.log('🚀 Starting next round manually');
  socket.emit('startNextRound', { gameId: gameState.gameId });
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

// Show auth upgrade prompt for guests (currently unused, kept for future features)
// const showAuthUpgradePrompt = (action = 'access this feature') => {
//   if (isAuthenticated) return false;
//   
//   const shouldUpgrade = window.confirm(
//     `🎮 Want to ${action}?\n\n` +
//     '✨ Create an account to:\n' +
//     '• Save your game progress and statistics\n' +
//     '• Track achievements and leaderboards\n' +
//     '• Sync settings across devices\n' +
//     '• Access social features\n\n' +
//     'Continue as guest or create account?'
//   );
//   
//   if (shouldUpgrade) {
//     setShowAuthModal(true);
//     return true;
//   }
//   
//   return false;
// };

// Handle logout with confirmation
const handleLogout = async () => {
  // Show confirmation dialog
  const confirmLogout = window.confirm(
    '🚪 Are you sure you want to logout?\n\n' +
    '• Your current game will continue\n' +
    '• Your settings will be saved\n' +
    '• You can sign back in anytime'
  );

  if (!confirmLogout) {
    return;
  }

  try {
    // Save current game state info for toast
    const wasInGame = gameState?.gameId && gameState?.gameState !== 'waiting';
    
    // Perform logout
    await logout();
    
    // Show success message
    if (wasInGame) {
      addToast('✅ Logged out successfully. Your game continues as guest.', 'success');
    } else {
      addToast('✅ Logged out successfully. You can continue playing as guest.', 'success');
    }
    
    // Close any open modals
    setShowAuthModal(false);
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    addToast('❌ Logout failed. Please try again.', 'error');
  }
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
        
        {/* Toast Notifications */}
        <ToastContainer 
          toasts={toasts}
          onRemoveToast={removeToast}
        />
      </div>
    );
  }

  if (!gameState) {
    return (
      <>
        <MainMenu 
          onGameCreated={({ playerName, resetLoading }) => {
            setPlayerName(playerName);
            if (!playerName.trim()) {
              addToast('Please enter your name', 'error');
              if (resetLoading) resetLoading();
              return;
            }
            console.log('🎮 Creating game as:', playerName);
            
            // Store resetLoading callback to call it when we get a response
            const resetLoadingRef = { current: resetLoading };
            
            // Set up one-time listeners for the response
            const handleGameCreatedSuccess = (data) => {
              console.log('✅ Game created successfully:', data);
              if (resetLoadingRef.current) resetLoadingRef.current();
              socket.off('gameUpdate', handleGameCreatedSuccess);
              socket.off('error', handleGameCreatedError);
            };
            
            const handleGameCreatedError = (error) => {
              console.log('❌ Game creation failed:', error);
              if (resetLoadingRef.current) resetLoadingRef.current();
              socket.off('gameUpdate', handleGameCreatedSuccess);
              socket.off('error', handleGameCreatedError);
            };
            
            socket.once('gameUpdate', handleGameCreatedSuccess);
            socket.once('error', handleGameCreatedError);
            
            socket.emit('createGame', {
              playerName: playerName.trim()
            });
          }}
          onGameJoined={({ gameId, playerName }) => {
            setPlayerName(playerName);
            setGameId(gameId);
            if (!playerName.trim() || !gameId.trim()) {
              addToast('Please enter both name and game ID', 'error');
              return;
            }
            console.log('🚪 Joining game:', gameId, 'as', playerName);
            socket.emit('joinGame', {
              gameId: gameId.trim(),
              playerName: playerName.trim()
            });
          }}
        />
        
        {/* Toast Notifications */}
        <ToastContainer 
          toasts={toasts}
          onRemoveToast={removeToast}
        />
      </>
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
      {/* Enhanced Header with User Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        backgroundColor: '#fff',
        padding: '15px 20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Game Title */}
        <h1 style={{ 
          color: '#2c3e50', 
          margin: 0, 
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🎴 Crazy 8's
        </h1>

        {/* User Info & Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          {/* User Status Display */}
          {isAuthenticated ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#27ae60',
                  borderRadius: '50%'
                }}></div>
                <span style={{
                  color: '#2c3e50',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {user?.displayName || user?.username}
                </span>
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6c757d',
                borderLeft: '1px solid #dee2e6',
                paddingLeft: '8px'
              }}>
                Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#fff3cd',
              borderRadius: '8px',
              border: '1px solid #ffeaa7'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                backgroundColor: '#f39c12',
                borderRadius: '50%'
              }}></div>
              <span style={{
                color: '#856404',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                Playing as Guest
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setShowUserDashboard(true)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#3498db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  👤 Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#e74c3c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  🚪 Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                🔑 Sign In / Register
              </button>
            )}
            
          </div>
        </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', textAlign: 'left' }}>
            <strong style={{ color: '#000' }}>Round:</strong> <span style={{ color: '#000' }}>{gameState.roundNumber}</span>
          </div>
          
          <div style={{ flex: '1', textAlign: 'center' }}>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#95a5a6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#7f8c8d'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#95a5a6'}
            >
              ⚙️ Settings
            </button>
          </div>
          
          <div style={{ flex: '1', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#000' }}>Game ID:</strong> 
              <span style={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#f8f9fa', 
                padding: '2px 6px', 
                borderRadius: '4px',
                marginLeft: '5px',
                color: '#000'
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
                height: '24px',
                flexShrink: 0
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
            
            {/* Auth Upgrade Hint for Guests */}
            {!isAuthenticated && (
              <div style={{
                marginTop: '10px',
                padding: '8px 12px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#856404'
              }}>
                💡 <strong>Tip:</strong> Create an account to save your game stats and track achievements!{' '}
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#27ae60',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  Sign up now
                </button>
              </div>
            )}
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
        
        {/* Tournament Dropdown Toggle - Only show if tournament is active */}
        {gameState?.tournament?.active && (
          <>
            <div 
              onClick={() => setShowTournamentInfo(!showTournamentInfo)}
              style={{
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #dee2e6',
                padding: '8px 20px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#6c757d',
                transition: 'all 0.2s ease',
                marginTop: '10px',
                borderRadius: '0 0 10px 10px'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e9ecef'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            >
              <FaTrophy style={{ fontSize: '12px', color: 'gold' }} />
              <span>Tournament Info</span>
              <span style={{
                transform: showTournamentInfo ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                fontSize: '10px'
              }}>
                ▼
              </span>
            </div>
            
            {/* Tournament Info Dropdown */}
            <div style={{
              maxHeight: showTournamentInfo ? '500px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
              backgroundColor: '#fff',
              borderRadius: '0 0 10px 10px'
            }}>
              <div style={{ 
                padding: showTournamentInfo ? '15px 20px' : '0 20px',
                transition: 'padding 0.3s ease-in-out'
              }}>
                <TournamentStatus gameState={gameState} />
                <SafePlayerNotification 
                  isPlayerSafe={(gameState?.players?.find(p => p.id === playerId)?.isSafe || false) && gameState?.gameState !== 'finished' && gameState?.tournament?.currentRound > 1}
                  playerName={playerName}
                  gameState={gameState}
                  onStartNextRound={handleStartNextRound}
                  playerId={playerId}
                  currentPlayerId={playerId}
                />
                <TournamentPlayerDisplay players={gameState?.players || []} gameState={gameState} />
              </div>
            </div>
          </>
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
            padding: '8px 16px',
            backgroundColor: player.isCurrentPlayer ? '#3498db' : '#95a5a6',
            color: '#fff',
            borderRadius: '20px',
            fontWeight: 'bold',
            textAlign: 'center',
            minWidth: '100px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            transform: player.isCurrentPlayer ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.3s ease',
            position: 'relative'
            }}
        >
            <div style={{ fontSize: '14px' }}>
            {player.name} ({player.handSize})
            {!player.isConnected && ' 🔴'}
            {player.id === playerId && ' (YOU)'}
            {player.isSafe && ' ✅'}
            {player.isEliminated && ' ❌'}
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
              <FaHome style={{ marginRight: '8px' }} />Return to Lobby
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
      
      {/* Drag Preview */}
      <DragPreview />

      {/* Settings Modal */}
      <Settings 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        setToasts={setToasts}
      />


      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {/* User Dashboard Modal */}
      {showUserDashboard && (
        <UserDashboard 
          onClose={() => setShowUserDashboard(false)}
          onJoinGame={() => {
            setShowUserDashboard(false);
            // Game is already active, just close dashboard
          }}
          currentGameState={gameState}
        />
      )}

      {/* Tournament Modals */}
      <RoundEndModal 
        isOpen={showRoundEndModal}
        roundData={roundEndData}
        nextRoundTimer={nextRoundTimer}
        onClose={() => setShowRoundEndModal(false)}
        onStartNextRound={handleStartNextRound}
        isPlayerSafe={gameState?.players?.find(p => p.id === playerId)?.isSafe || false}
      />
      
      <TournamentWinnerModal 
        isOpen={showTournamentWinnerModal}
        winnerData={tournamentWinnerData}
        onClose={() => setShowTournamentWinnerModal(false)}
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

// Main App component with AuthProvider and ConnectionProvider wrapper
const App = () => {
  return (
    <AuthProvider>
      <ConnectionProvider>
        <CardSelectionProvider>
          <DragProvider>
            <GameApp />
          </DragProvider>
        </CardSelectionProvider>
      </ConnectionProvider>
    </AuthProvider>
  );
};

export default App;
