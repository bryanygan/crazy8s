import React from 'react';
import { FaGamepad, FaTrophy, FaBullseye } from 'react-icons/fa';

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

export default TournamentPlayerDisplay;
