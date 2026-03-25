import React from 'react';
import { FaTrophy, FaChartBar, FaHome } from 'react-icons/fa';

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

export default TournamentWinnerModal;
