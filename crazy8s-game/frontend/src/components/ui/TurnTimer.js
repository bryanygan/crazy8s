import React from 'react';

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

export default TurnTimer;