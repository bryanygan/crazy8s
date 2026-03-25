import React from 'react';
import { FaFlag, FaRocket } from 'react-icons/fa';

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

export default RoundEndModal;
