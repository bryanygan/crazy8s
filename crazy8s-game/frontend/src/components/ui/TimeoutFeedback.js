/**
 * Enhanced Timeout Feedback Components
 * 
 * Provides user-friendly feedback for various timeout scenarios:
 * - Loading states with timeout awareness
 * - Retry mechanisms with visual feedback
 * - Connection quality indicators
 * - Timeout error handling
 */

import React, { useState, useEffect, useRef } from 'react';
import { FaSpinner, FaExclamationTriangle, FaWifi, FaRedo, FaClock, FaCheck, FaTimes } from 'react-icons/fa';
import { UI_TIMEOUTS } from '../../config/timeouts';

// Enhanced loading indicator with timeout awareness
export const TimeoutAwareLoader = ({ 
  isLoading = false, 
  timeout = UI_TIMEOUTS.LOADING_SPINNER_DELAY,
  onTimeout = null,
  size = 'medium',
  message = 'Loading...',
  showProgress = false,
  progress = 0,
  connectionQuality = 'UNKNOWN',
  variant = 'spinner'
}) => {
  const [showSpinner, setShowSpinner] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const timeoutRef = useRef(null);
  const delayRef = useRef(null);
  
  useEffect(() => {
    if (isLoading && !hasTimedOut) {
      // Delay showing spinner to avoid flickering for fast requests
      delayRef.current = setTimeout(() => {
        setShowSpinner(true);
      }, UI_TIMEOUTS.LOADING_SPINNER_DELAY);
      
      // Set timeout for loading operation
      if (timeout > 0) {
        timeoutRef.current = setTimeout(() => {
          setHasTimedOut(true);
          if (onTimeout) {
            onTimeout();
          }
        }, timeout);
      }
    } else {
      setShowSpinner(false);
      setHasTimedOut(false);
      
      if (delayRef.current) {
        clearTimeout(delayRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
    
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoading, timeout, onTimeout, hasTimedOut]);
  
  if (!isLoading && !hasTimedOut) return null;
  
  const sizeStyles = {
    small: { fontSize: '14px', iconSize: '12px', padding: '8px 12px' },
    medium: { fontSize: '16px', iconSize: '16px', padding: '12px 20px' },
    large: { fontSize: '18px', iconSize: '20px', padding: '16px 24px' }
  };
  
  const style = sizeStyles[size] || sizeStyles.medium;
  
  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'EXCELLENT': return '#27ae60';
      case 'GOOD': return '#2ecc71';
      case 'FAIR': return '#f39c12';
      case 'POOR': return '#e74c3c';
      default: return '#95a5a6';
    }
  };
  
  if (hasTimedOut) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: style.padding,
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        color: '#856404',
        fontSize: style.fontSize
      }}>
        <FaExclamationTriangle style={{ fontSize: style.iconSize }} />
        <span>Operation timed out</span>
      </div>
    );
  }
  
  if (!showSpinner) return null;
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      padding: style.padding,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(4px)',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      fontSize: style.fontSize,
      color: '#2c3e50'
    }}>
      {variant === 'spinner' && (
        <FaSpinner 
          style={{ 
            fontSize: style.iconSize,
            animation: 'spin 1s linear infinite'
          }} 
        />
      )}
      
      {variant === 'dots' && (
        <div style={{ display: 'flex', gap: '4px' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#3498db',
                animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`
              }}
            />
          ))}
        </div>
      )}
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span>{message}</span>
        
        {showProgress && (
          <div style={{
            width: '120px',
            height: '4px',
            backgroundColor: '#ecf0f1',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, Math.max(0, progress))}%`,
              height: '100%',
              backgroundColor: '#3498db',
              transition: 'width 0.3s ease',
              borderRadius: '2px'
            }} />
          </div>
        )}
        
        {connectionQuality !== 'UNKNOWN' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: getConnectionQualityColor()
          }}>
            <FaWifi style={{ fontSize: '10px' }} />
            <span>{connectionQuality.toLowerCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Retry feedback component
export const RetryFeedback = ({
  isRetrying = false,
  currentAttempt = 1,
  maxAttempts = 3,
  nextRetryIn = 0,
  onRetry = null,
  onCancel = null,
  error = null,
  autoRetry = true
}) => {
  const [countdown, setCountdown] = useState(nextRetryIn);
  
  useEffect(() => {
    if (nextRetryIn > 0 && isRetrying) {
      setCountdown(nextRetryIn);
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            if (autoRetry && onRetry) {
              onRetry();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [nextRetryIn, isRetrying, autoRetry, onRetry]);
  
  if (!isRetrying && !error) return null;
  
  return (
    <div style={{
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      padding: '16px',
      margin: '8px 0',
      fontSize: '14px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        color: '#856404'
      }}>
        <FaExclamationTriangle />
        <span style={{ fontWeight: 'bold' }}>
          {isRetrying ? `Retry attempt ${currentAttempt}/${maxAttempts}` : 'Request failed'}
        </span>
      </div>
      
      {error && (
        <div style={{
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          padding: '8px',
          borderRadius: '4px',
          marginBottom: '12px',
          fontSize: '13px',
          color: '#c0392b'
        }}>
          {error.message || 'An error occurred'}
        </div>
      )}
      
      {isRetrying && countdown > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          color: '#856404'
        }}>
          <FaClock />
          <span>Next retry in {countdown} seconds...</span>
        </div>
      )}
      
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: '6px 12px',
              backgroundColor: '#95a5a6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FaTimes style={{ fontSize: '10px' }} />
            Cancel
          </button>
        )}
        
        {onRetry && !autoRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            style={{
              padding: '6px 12px',
              backgroundColor: isRetrying ? '#bdc3c7' : '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isRetrying ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FaRedo style={{ fontSize: '10px' }} />
            {isRetrying ? 'Retrying...' : 'Retry Now'}
          </button>
        )}
      </div>
    </div>
  );
};

// Connection quality indicator
export const ConnectionQualityIndicator = ({
  quality = 'UNKNOWN',
  latency = null,
  showDetails = true,
  compact = false
}) => {
  const getQualityConfig = () => {
    switch (quality) {
      case 'EXCELLENT':
        return { 
          color: '#27ae60', 
          icon: '🟢', 
          label: 'Excellent',
          description: 'Connection is very fast and stable'
        };
      case 'GOOD':
        return { 
          color: '#2ecc71', 
          icon: '🟢', 
          label: 'Good',
          description: 'Connection is fast and reliable'
        };
      case 'FAIR':
        return { 
          color: '#f39c12', 
          icon: '🟡', 
          label: 'Fair',
          description: 'Connection may be slow at times'
        };
      case 'POOR':
        return { 
          color: '#e74c3c', 
          icon: '🔴', 
          label: 'Poor',
          description: 'Connection is slow and may timeout'
        };
      default:
        return { 
          color: '#95a5a6', 
          icon: '⚪', 
          label: 'Unknown',
          description: 'Connection quality not determined'
        };
    }
  };
  
  const config = getQualityConfig();
  
  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        color: config.color
      }}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
        {latency && <span>({latency}ms)</span>}
      </div>
    );
  }
  
  return (
    <div style={{
      backgroundColor: '#f8f9fa',
      border: `1px solid ${config.color}`,
      borderRadius: '6px',
      padding: '8px 12px',
      fontSize: '13px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 'bold',
        color: config.color,
        marginBottom: showDetails ? '4px' : '0'
      }}>
        <FaWifi />
        <span>{config.label}</span>
        {latency && <span>({latency}ms)</span>}
      </div>
      
      {showDetails && (
        <div style={{
          fontSize: '11px',
          color: '#6c757d'
        }}>
          {config.description}
        </div>
      )}
    </div>
  );
};

// Timeout error boundary component
export const TimeoutErrorBoundary = ({
  children,
  fallback = null,
  onError = null
}) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const handleError = (event) => {
      if (event.error?.name === 'APITimeoutError' || 
          event.error?.type === 'REQUEST_TIMEOUT') {
        setHasError(true);
        setError(event.error);
        
        if (onError) {
          onError(event.error);
        }
      }
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, [onError]);
  
  if (hasError) {
    return fallback || (
      <div style={{
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '8px',
        padding: '16px',
        color: '#721c24'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          <FaExclamationTriangle />
          <span>Timeout Error</span>
        </div>
        
        <div style={{ fontSize: '14px', marginBottom: '12px' }}>
          The operation took too long to complete. This might be due to network issues or server load.
        </div>
        
        <button
          onClick={() => {
            setHasError(false);
            setError(null);
          }}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return children;
};

// Enhanced toast for timeout scenarios
export const TimeoutToast = ({
  type = 'timeout',
  message,
  duration = UI_TIMEOUTS.TOAST_ERROR_DURATION,
  onClose,
  onRetry = null,
  retryable = false
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(duration / 1000);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsVisible(false);
          setTimeout(onClose, 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [duration, onClose]);
  
  const getTypeConfig = () => {
    switch (type) {
      case 'timeout':
        return {
          backgroundColor: '#e74c3c',
          icon: <FaClock />,
          title: 'Request Timed Out'
        };
      case 'retry':
        return {
          backgroundColor: '#f39c12',
          icon: <FaRedo />,
          title: 'Retrying...'
        };
      case 'success':
        return {
          backgroundColor: '#27ae60',
          icon: <FaCheck />,
          title: 'Success'
        };
      default:
        return {
          backgroundColor: '#95a5a6',
          icon: <FaExclamationTriangle />,
          title: 'Notice'
        };
    }
  };
  
  const config = getTypeConfig();
  
  if (!isVisible) return null;
  
  return (
    <div style={{
      backgroundColor: config.backgroundColor,
      color: '#fff',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      maxWidth: '400px',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
      }}>
        {config.icon}
        <span style={{ fontWeight: 'bold' }}>{config.title}</span>
        <div style={{
          marginLeft: 'auto',
          fontSize: '12px',
          opacity: 0.8
        }}>
          {timeLeft}s
        </div>
      </div>
      
      <div style={{ fontSize: '14px', marginBottom: retryable ? '12px' : '0' }}>
        {message}
      </div>
      
      {retryable && onRetry && (
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onRetry}
            style={{
              padding: '4px 8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default {
  TimeoutAwareLoader,
  RetryFeedback,
  ConnectionQualityIndicator,
  TimeoutErrorBoundary,
  TimeoutToast
};