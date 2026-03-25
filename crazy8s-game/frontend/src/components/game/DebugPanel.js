import React from 'react';

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

export default DebugPanel;
