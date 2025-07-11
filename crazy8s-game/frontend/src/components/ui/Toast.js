import React, { useState, useEffect, useRef } from 'react';

const Toast = ({ toast, index, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // Create a stable reference to onClose to prevent timer resets
    const stableOnClose = () => {
      console.log(`🍞 Auto-closing toast: ${toast.message}`);
      setIsExiting(true);
      setTimeout(() => {
        onClose();
      }, 300);
    };

    // Auto-close timer with stable reference
    timerRef.current = setTimeout(stableOnClose, 4000);
    
    console.log(`🍞 Toast timer started for: ${toast.message}`);

    return () => {
      if (timerRef.current) {
        console.log(`🍞 Toast timer cleared for: ${toast.message}`);
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]); // ONLY depend on toast.id, NOT onClose

  const handleManualClose = () => {
    console.log(`🍞 Manual close toast: ${toast.message}`);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success': return '#27ae60';
      case 'error': return '#e74c3c';
      case 'info': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const getTransform = () => {
    if (isExiting) {
      return 'translateX(100%) scale(0.8)';
    }
    return `translateY(${index * 5}px) scale(${1 - index * 0.05})`;
  };

  const getOpacity = () => {
    if (isExiting) return 0;
    return Math.max(0.3, 1 - index * 0.15);
  };

  const getZIndex = () => {
    return 2500 - index;
  };

  return (
    <div 
      style={{
        padding: '15px 20px',
        backgroundColor: getBackgroundColor(),
        color: '#fff',
        borderRadius: '8px',
        boxShadow: `0 ${4 + index * 2}px ${8 + index * 4}px rgba(0,0,0,${0.2 + index * 0.1})`,
        fontSize: '14px',
        cursor: 'pointer',
        transform: getTransform(),
        opacity: getOpacity(),
        zIndex: getZIndex(),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transformOrigin: 'top right',
        position: 'relative',
        overflow: 'hidden',
        border: index === 0 ? '2px solid rgba(255,255,255,0.3)' : 'none'
      }}
      onClick={handleManualClose}
    >
      {/* Progress bar for the newest notification */}
      {index === 0 && !isExiting && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          backgroundColor: 'rgba(255,255,255,0.5)',
          animation: 'progressBar 4s linear forwards',
          borderRadius: '0 0 6px 6px'
        }} />
      )}
      
      {/* Stack indicator for older notifications */}
      {index > 0 && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          fontSize: '10px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          padding: '2px 6px',
          borderRadius: '10px',
          fontWeight: 'bold'
        }}>
          +{index}
        </div>
      )}
      
      {toast.message}
    </div>
  );
};

export default Toast;