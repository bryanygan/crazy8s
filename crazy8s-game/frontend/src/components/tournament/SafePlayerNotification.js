import React, { useEffect } from 'react';
import { fireConfetti } from '../../utils/animationUtils';
import { FaTrophy, FaRocket } from 'react-icons/fa';

const SafePlayerNotification = ({ isPlayerSafe, playerName, gameState, onStartNextRound, playerId, currentPlayerId }) => {
  // Trigger confetti only when current player becomes safe
  useEffect(() => {
    if (isPlayerSafe && playerId === currentPlayerId) {
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

export default SafePlayerNotification;
