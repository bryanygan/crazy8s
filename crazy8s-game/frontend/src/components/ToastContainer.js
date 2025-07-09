// ToastContainer.js - Notification display components
import React, { useState, useEffect, useRef } from 'react';

export const ToastContainer = ({ toasts, onRemoveToast }) => (
  <div style={{
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 2500,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '300px',
  }}>
    {toasts.map((toast, index) => (
      <Toast
        key={toast.id}
        toast={toast}
        index={index}
        onClose={() => onRemoveToast(toast.id)}
      />
    ))}
  </div>
);

const Toast = ({ toast, index, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const stableOnClose = () => {
      setIsExiting(true);
      setTimeout(() => onClose(), 300);
    };
    timerRef.current = setTimeout(stableOnClose, 4000);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [toast.id, onClose]);

  const handleManualClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsExiting(true);
    setTimeout(() => onClose(), 300);
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return '#27ae60';
      case 'error':
        return '#e74c3c';
      case 'info':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  return (
    <div
      style={{
        padding: '15px 20px',
        backgroundColor: getBackgroundColor(),
        color: '#fff',
        borderRadius: '8px',
        fontSize: '14px',
        cursor: 'pointer',
        transform: isExiting
          ? 'translateX(100%) scale(0.8)'
          : `translateY(${index * 5}px) scale(${1 - index * 0.05})`,
        opacity: isExiting ? 0 : Math.max(0.3, 1 - index * 0.15),
        zIndex: 2500 - index,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transformOrigin: 'top right',
        position: 'relative',
        overflow: 'hidden',
        border: index === 0 ? '2px solid rgba(255,255,255,0.3)' : 'none',
      }}
      onClick={handleManualClose}
    >
      {index === 0 && !isExiting && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            backgroundColor: 'rgba(255,255,255,0.5)',
            animation: 'progressBar 4s linear forwards',
            borderRadius: '0 0 6px 6px',
          }}
        />
      )}
      {index > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            fontSize: '10px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '2px 6px',
            borderRadius: '10px',
            fontWeight: 'bold',
          }}
        >
          +{index}
        </div>
      )}
      {toast.message}
    </div>
  );
};

export default ToastContainer;
