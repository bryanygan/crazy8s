import React, { useState, useEffect } from 'react';
import { useConnection } from '../contexts/ConnectionContext';
import { 
  FaCircle, FaUnlock, FaTimes, FaSpinner, FaWifi 
} from 'react-icons/fa';

const ConnectionStatus = ({ position = 'top-right' }) => {
  const {
    isReconnecting,
    reconnectAttempts,
    connectionStatus,
    connectionLatency,
    connectionError,
    connectionStability,
    lastErrorTime,
    errorCount,
    sessionValid,
    clearConnectionError
  } = useConnection();

  const [showDetails, setShowDetails] = useState(false);
  const [lastStatusChange, setLastStatusChange] = useState(Date.now());

  useEffect(() => {
    setLastStatusChange(Date.now());
  }, [connectionStatus]);

  const getStatusColor = () => {
    // Factor in stability for color determination
    if (connectionStatus === 'connected') {
      switch (connectionStability) {
        case 'stable':
          return '#27ae60'; // Green
        case 'unstable':
          return '#f39c12'; // Orange
        case 'critical':
          return '#e67e22'; // Dark orange
        default:
          return '#27ae60';
      }
    }
    
    switch (connectionStatus) {
      case 'connecting':
        return '#f39c12';
      case 'reconnecting':
        return '#e67e22';
      case 'disconnected':
        return '#95a5a6';
      case 'failed':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getStatusIcon = () => {
    // Factor in stability and session validity
    if (connectionStatus === 'connected') {
      if (!sessionValid) return <FaUnlock />; // Unlocked (session invalid)
      
      switch (connectionStability) {
        case 'stable':
          return <FaCircle style={{ color: '#27ae60' }} />; // Green
        case 'unstable':
          return <FaCircle style={{ color: '#f39c12' }} />; // Yellow
        case 'critical':
          return <FaCircle style={{ color: '#e67e22' }} />; // Orange
        default:
          return <FaCircle style={{ color: '#27ae60' }} />;
      }
    }
    
    switch (connectionStatus) {
      case 'connecting':
        return <FaSpinner className="spin" />;
      case 'reconnecting':
        return <FaSpinner className="spin" />;
      case 'disconnected':
        return <FaWifi style={{ opacity: 0.5 }} />;
      case 'failed':
        return <FaTimes />;
      default:
        return <FaCircle style={{ color: '#95a5a6' }} />;
    }
  };

  const getStatusText = () => {
    if (connectionStatus === 'connected') {
      if (!sessionValid) return 'Session Invalid';
      
      switch (connectionStability) {
        case 'stable':
          return 'Connected';
        case 'unstable':
          return 'Connected (Unstable)';
        case 'critical':
          return 'Connected (Critical)';
        default:
          return 'Connected';
      }
    }
    
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return `Reconnecting... (${reconnectAttempts}/8)`;
      case 'disconnected':
        return 'Disconnected';
      case 'failed':
        return 'Connection Failed';
      default:
        return 'Unknown';
    }
  };

  const getLatencyText = () => {
    if (!connectionLatency) return 'N/A';
    
    if (connectionLatency < 100) return 'Excellent';
    if (connectionLatency < 300) return 'Good';
    if (connectionLatency < 500) return 'Fair';
    return 'Poor';
  };

  const getLatencyColor = () => {
    if (!connectionLatency) return '#95a5a6';
    
    if (connectionLatency < 100) return '#27ae60';
    if (connectionLatency < 300) return '#f39c12';
    if (connectionLatency < 500) return '#e67e22';
    return '#e74c3c';
  };

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed',
      zIndex: 1000,
      userSelect: 'none'
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: '10px', left: '10px' };
      case 'top-right':
        return { ...baseStyles, top: '10px', right: '10px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '10px', left: '10px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '10px', right: '10px' };
      default:
        return { ...baseStyles, top: '10px', right: '10px' };
    }
  };

  return (
    <div style={getPositionStyles()}>
      {/* Main Status Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          border: `2px solid ${getStatusColor()}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
        onClick={() => setShowDetails(!showDetails)}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        <span style={{ fontSize: '14px' }}>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
        {connectionLatency && (
          <span
            style={{
              fontSize: '10px',
              color: getLatencyColor(),
              marginLeft: '4px'
            }}
          >
            {connectionLatency}ms
          </span>
        )}
      </div>

      {/* Detailed Status Panel */}
      {showDetails && (
        <div
          style={{
            position: 'absolute',
            top: '45px',
            right: '0',
            minWidth: '280px',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: '#fff',
            borderRadius: '10px',
            padding: '15px',
            fontSize: '12px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>
            Connection Details
          </h4>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>Status:</strong> {getStatusText()}
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>Stability:</strong>{' '}
            <span style={{ color: getStatusColor() }}>
              {connectionStability.charAt(0).toUpperCase() + connectionStability.slice(1)}
            </span>
          </div>
          
          {!sessionValid && (
            <div style={{ marginBottom: '8px', color: '#e74c3c' }}>
              <strong>Session:</strong> Invalid
            </div>
          )}
          
          {connectionLatency && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Latency:</strong>{' '}
              <span style={{ color: getLatencyColor() }}>
                {connectionLatency}ms ({getLatencyText()})
              </span>
            </div>
          )}
          
          {isReconnecting && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Reconnect Attempts:</strong> {reconnectAttempts}/8
            </div>
          )}
          
          {errorCount > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Error Count:</strong> {errorCount}
            </div>
          )}
          
          {lastErrorTime && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Last Error:</strong>{' '}
              {new Date(lastErrorTime).toLocaleTimeString()}
            </div>
          )}
          
          <div style={{ marginBottom: '8px' }}>
            <strong>Last Status Change:</strong>{' '}
            {new Date(lastStatusChange).toLocaleTimeString()}
          </div>

          {connectionError && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px',
                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                borderRadius: '5px',
                border: '1px solid rgba(231, 76, 60, 0.4)'
              }}
            >
              <strong style={{ color: '#e74c3c' }}>Error:</strong>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>
                {connectionError}
              </div>
              <button
                style={{
                  marginTop: '6px',
                  padding: '4px 8px',
                  backgroundColor: '#e74c3c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  clearConnectionError();
                }}
              >
                Clear Error
              </button>
            </div>
          )}
          
          <div style={{ marginTop: '10px', fontSize: '10px', opacity: 0.7 }}>
            Click to toggle details
          </div>
        </div>
      )}

      {/* Reconnection Progress Animation */}
      {isReconnecting && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '30px',
            height: '30px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid #e67e22',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ConnectionStatus;