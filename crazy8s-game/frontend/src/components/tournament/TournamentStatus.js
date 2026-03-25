import React from 'react';
import { FaTrophy } from 'react-icons/fa';

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

export default TournamentStatus;
