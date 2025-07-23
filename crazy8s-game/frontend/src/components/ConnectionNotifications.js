import React, { useEffect, useState } from 'react';
import { useConnection } from '../contexts/ConnectionContext';
import { FaTimes } from 'react-icons/fa';

const ConnectionNotifications = () => {
  const { addConnectionListener } = useConnection();
  const [notifications, setNotifications] = useState([]);
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    const handleConnectionEvent = (event, data = {}) => {
      let message = '';
      let type = 'info';
      let duration = 3000;
      let showNotification = true;

      switch (event) {
        case 'connected':
          message = '✅ Connected to server';
          type = 'success';
          break;
        case 'reconnected':
          // Only show notifications for user-impacting reconnections
          if (data.userImpacting !== false) {
            const durationText = data.duration ? ` (${Math.round(data.duration / 1000)}s offline)` : '';
            message = `🔄 Reconnected after ${data.attempts || 1} attempts${durationText}`;
            type = 'success';
            duration = 4000;
          } else {
            showNotification = false; // Don't show notification for technical reconnections
          }
          break;
        case 'technical_reconnected':
          // Never show notifications for technical reconnections
          showNotification = false;
          console.log(`🔇 Technical reconnection (${data.reason}, ${data.duration}ms) - notification suppressed`);
          break;
        case 'disconnected':
          if (data.planned) {
            showNotification = false; // Don't show notification for planned disconnects
          } else {
            message = '🔌 Connection lost - attempting to reconnect...';
            type = 'warning';
            duration = 5000;
          }
          break;
        case 'reconnecting':
          if (data.attempt === 1) {
            message = '🔄 Reconnecting to server...';
            type = 'info';
            duration = 4000;
          } else {
            message = `🔄 Reconnection attempt ${data.attempt}/5`;
            type = 'info';
            duration = 3000;
          }
          break;
        case 'connect_error':
          message = `❌ Connection failed: ${data.error || 'Unknown error'}`;
          type = 'error';
          duration = 6000;
          break;
        case 'reconnect_failed':
          message = '❌ Failed to reconnect - please refresh the page';
          type = 'error';
          duration = 10000;
          break;
        case 'auth_error':
          message = `🔐 Authentication failed: ${data.error || 'Unknown error'}`;
          type = 'error';
          duration = 6000;
          break;
        case 'authenticated':
          message = '🔐 Successfully authenticated';
          type = 'success';
          break;
        case 'guest_connected':
          message = '👤 Connected as guest';
          type = 'info';
          break;
        case 'game_state_requested':
          message = '🎮 Requesting game state...';
          type = 'info';
          duration = 2000;
          break;
        default:
          showNotification = false;
      }

      if (showNotification) {
        const notification = {
          id: nextId,
          message,
          type,
          duration,
          timestamp: Date.now()
        };
        
        setNotifications(prev => [...prev, notification]);
        setNextId(prev => prev + 1);

        // Auto-remove notification after duration
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, duration);
      }
    };

    const unsubscribe = addConnectionListener(handleConnectionEvent);
    return () => {
      unsubscribe();
    };
  }, [addConnectionListener, nextId]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getNotificationStyles = (type) => {
    const baseStyles = {
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minWidth: '300px',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      animation: 'slideIn 0.3s ease-out'
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(39, 174, 96, 0.9)',
          color: '#fff',
          border: '1px solid rgba(39, 174, 96, 0.6)'
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(243, 156, 18, 0.9)',
          color: '#fff',
          border: '1px solid rgba(243, 156, 18, 0.6)'
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(231, 76, 60, 0.9)',
          color: '#fff',
          border: '1px solid rgba(231, 76, 60, 0.6)'
        };
      case 'info':
      default:
        return {
          ...baseStyles,
          backgroundColor: 'rgba(52, 152, 219, 0.9)',
          color: '#fff',
          border: '1px solid rgba(52, 152, 219, 0.6)'
        };
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}
      >
        {notifications.map(notification => (
          <div
            key={notification.id}
            style={getNotificationStyles(notification.type)}
          >
            <span style={{ flexGrow: 1 }}>
              {notification.message}
            </span>
            <button
              style={{
                marginLeft: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.7
              }}
              onClick={() => removeNotification(notification.id)}
              onMouseEnter={(e) => e.target.style.opacity = '1'}
              onMouseLeave={(e) => e.target.style.opacity = '0.7'}
            >
              <FaTimes />
            </button>
          </div>
        ))}
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default ConnectionNotifications;