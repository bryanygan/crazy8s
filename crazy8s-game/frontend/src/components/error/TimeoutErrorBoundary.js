/**
 * Comprehensive Timeout Error Boundary and Monitoring System
 * 
 * Provides robust error handling and monitoring for timeout-related issues:
 * - React Error Boundary for timeout errors
 * - Global timeout event monitoring
 * - Performance metrics collection
 * - Error reporting and analytics
 */

import React, { Component } from 'react';
import { FaExclamationTriangle, FaRedo, FaClock, FaChartBar, FaBug } from 'react-icons/fa';
import { connectionQualityMonitor } from '../../utils/connectionQualityMonitor';
import { globalRequestTracker } from '../../utils/apiTimeoutHandler';

// Timeout monitoring and analytics
class TimeoutMonitor {
  constructor() {
    this.timeoutEvents = [];
    this.performanceMetrics = {
      totalTimeouts: 0,
      timeoutsByType: {},
      averageResolutionTime: 0,
      userRetryRate: 0,
      sessionTimeouts: 0
    };
    
    this.listeners = [];
    this.isCollectingMetrics = true;
    
    // Initialize global error listeners
    this.initializeGlobalListeners();
  }
  
  initializeGlobalListeners() {
    // Catch unhandled promise rejections (timeout errors)
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isTimeoutError(event.reason)) {
        this.recordTimeoutEvent({
          type: 'unhandled_promise_rejection',
          error: event.reason,
          timestamp: Date.now(),
          source: 'global'
        });
      }
    });
    
    // Catch general errors
    window.addEventListener('error', (event) => {
      if (this.isTimeoutError(event.error)) {
        this.recordTimeoutEvent({
          type: 'global_error',
          error: event.error,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: Date.now(),
          source: 'global'
        });
      }
    });
    
    // Monitor fetch timeouts
    this.monitorFetchTimeouts();
    
    // Monitor socket timeouts
    this.monitorSocketTimeouts();
  }
  
  isTimeoutError(error) {
    if (!error) return false;
    
    const timeoutIndicators = [
      'timeout',
      'TIMEOUT',
      'AbortError',
      'REQUEST_TIMEOUT',
      'NETWORK_TIMEOUT',
      'CONNECTION_TIMEOUT',
      'apiTimeoutError'
    ];
    
    const errorString = error.toString().toLowerCase();
    const errorName = error.name || '';
    const errorType = error.type || '';
    
    return timeoutIndicators.some(indicator => 
      errorString.includes(indicator.toLowerCase()) ||
      errorName.includes(indicator) ||
      errorType.includes(indicator)
    );
  }
  
  monitorFetchTimeouts() {
    // Override fetch to monitor timeouts
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      
      try {
        const response = await originalFetch(...args);
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        if (this.isTimeoutError(error)) {
          this.recordTimeoutEvent({
            type: 'fetch_timeout',
            error,
            url: args[0],
            duration,
            timestamp: Date.now(),
            source: 'fetch_override'
          });
        }
        
        throw error;
      }
    };
  }
  
  monitorSocketTimeouts() {
    // Try to monitor socket timeouts if socket.io is available
    if (typeof window !== 'undefined' && window.io) {
      const originalConnect = window.io;
      
      window.io = (...args) => {
        const socket = originalConnect(...args);
        
        socket.on('connect_error', (error) => {
          if (this.isTimeoutError(error)) {
            this.recordTimeoutEvent({
              type: 'socket_connect_timeout',
              error,
              timestamp: Date.now(),
              source: 'socket_monitor'
            });
          }
        });
        
        socket.on('reconnect_error', (error) => {
          if (this.isTimeoutError(error)) {
            this.recordTimeoutEvent({
              type: 'socket_reconnect_timeout',
              error,
              timestamp: Date.now(),
              source: 'socket_monitor'
            });
          }
        });
        
        return socket;
      };
    }
  }
  
  recordTimeoutEvent(event) {
    if (!this.isCollectingMetrics) return;
    
    // Add connection quality context
    event.connectionQuality = connectionQualityMonitor.getCurrentQuality();
    event.connectionStats = connectionQualityMonitor.getStats();
    
    // Add API performance context
    event.apiStats = globalRequestTracker.getStats();
    
    this.timeoutEvents.push(event);
    
    // Keep only recent events
    if (this.timeoutEvents.length > 100) {
      this.timeoutEvents.shift();
    }
    
    // Update metrics
    this.updateMetrics(event);
    
    // Notify listeners
    this.notifyListeners(event);
    
    console.warn('⏰ Timeout event recorded:', event);
  }
  
  updateMetrics(event) {
    this.performanceMetrics.totalTimeouts++;
    
    const eventType = event.type || 'unknown';
    this.performanceMetrics.timeoutsByType[eventType] = 
      (this.performanceMetrics.timeoutsByType[eventType] || 0) + 1;
    
    // Update session timeout count
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.performanceMetrics.sessionTimeouts = this.timeoutEvents.filter(
      e => e.timestamp > oneHourAgo
    ).length;
  }
  
  recordRetryAttempt(eventId, successful = false) {
    const event = this.timeoutEvents.find(e => e.id === eventId);
    if (event) {
      event.retryAttempted = true;
      event.retrySuccessful = successful;
      event.retryTimestamp = Date.now();
      
      if (successful) {
        event.resolutionTime = Date.now() - event.timestamp;
      }
    }
    
    // Update retry rate
    const retriedEvents = this.timeoutEvents.filter(e => e.retryAttempted);
    this.performanceMetrics.userRetryRate = 
      retriedEvents.length / Math.max(1, this.timeoutEvents.length);
    
    // Update average resolution time
    const resolvedEvents = retriedEvents.filter(e => e.retrySuccessful && e.resolutionTime);
    if (resolvedEvents.length > 0) {
      this.performanceMetrics.averageResolutionTime = 
        resolvedEvents.reduce((sum, e) => sum + e.resolutionTime, 0) / resolvedEvents.length;
    }
  }
  
  addListener(listener) {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in timeout event listener:', error);
      }
    });
  }
  
  getMetrics() {
    const recentEvents = this.timeoutEvents.filter(
      e => e.timestamp > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    );
    
    return {
      ...this.performanceMetrics,
      recentEventCount: recentEvents.length,
      eventsByHour: this.groupEventsByHour(recentEvents),
      topTimeoutTypes: this.getTopTimeoutTypes(),
      connectionQualityImpact: this.analyzeConnectionQualityImpact()
    };
  }
  
  groupEventsByHour(events) {
    const hourlyGroups = {};
    
    events.forEach(event => {
      const hour = new Date(event.timestamp).toISOString().split('T')[1].split(':')[0];
      hourlyGroups[hour] = (hourlyGroups[hour] || 0) + 1;
    });
    
    return hourlyGroups;
  }
  
  getTopTimeoutTypes() {
    return Object.entries(this.performanceMetrics.timeoutsByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }
  
  analyzeConnectionQualityImpact() {
    const qualityGroups = {};
    
    this.timeoutEvents.forEach(event => {
      const quality = event.connectionQuality || 'UNKNOWN';
      qualityGroups[quality] = (qualityGroups[quality] || 0) + 1;
    });
    
    return qualityGroups;
  }
  
  exportDiagnosticData() {
    return {
      timeoutEvents: this.timeoutEvents.slice(-50), // Last 50 events
      metrics: this.getMetrics(),
      connectionStats: connectionQualityMonitor.getStats(),
      apiStats: globalRequestTracker.getStats(),
      browserInfo: {
        userAgent: navigator.userAgent,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : null
      },
      timestamp: Date.now()
    };
  }
  
  enableMetricsCollection() {
    this.isCollectingMetrics = true;
  }
  
  disableMetricsCollection() {
    this.isCollectingMetrics = false;
  }
  
  clearMetrics() {
    this.timeoutEvents.length = 0;
    this.performanceMetrics = {
      totalTimeouts: 0,
      timeoutsByType: {},
      averageResolutionTime: 0,
      userRetryRate: 0,
      sessionTimeouts: 0
    };
  }
}

// Global timeout monitor instance
const globalTimeoutMonitor = new TimeoutMonitor();

// React Error Boundary for timeout errors
class TimeoutErrorBoundary extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      showDetails: false,
      eventId: null
    };
  }
  
  static getDerivedStateFromError(error) {
    // Update state to trigger error UI
    return {
      hasError: true,
      error,
      eventId: `boundary_${Date.now()}_${Math.random()}`
    };
  }
  
  componentDidCatch(error, errorInfo) {
    // Record timeout event
    if (globalTimeoutMonitor.isTimeoutError(error)) {
      globalTimeoutMonitor.recordTimeoutEvent({
        type: 'react_boundary_timeout',
        error,
        errorInfo,
        component: this.props.componentName || 'unknown',
        timestamp: Date.now(),
        source: 'error_boundary',
        id: this.state.eventId
      });
    }
    
    this.setState({
      error,
      errorInfo
    });
    
    // Report to external service if configured
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }
  
  handleRetry = () => {
    const { retryCount, eventId } = this.state;
    
    // Record retry attempt
    globalTimeoutMonitor.recordRetryAttempt(eventId, false);
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: retryCount + 1,
      showDetails: false
    });
    
    // Call custom retry handler if provided
    if (this.props.onRetry) {
      this.props.onRetry(retryCount + 1);
    }
  };
  
  handleReportProblem = () => {
    const diagnosticData = globalTimeoutMonitor.exportDiagnosticData();
    
    // Copy diagnostic data to clipboard
    navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2))
      .then(() => {
        alert('Diagnostic data copied to clipboard. Please paste it when reporting the issue.');
      })
      .catch(() => {
        console.log('Diagnostic data:', diagnosticData);
        alert('Diagnostic data logged to console. Please copy it when reporting the issue.');
      });
  };
  
  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount, showDetails } = this.state;
      const isTimeoutError = globalTimeoutMonitor.isTimeoutError(error);
      
      // Use custom fallback if provided and this is a timeout error
      if (isTimeoutError && this.props.timeoutFallback) {
        return this.props.timeoutFallback(error, this.handleRetry, retryCount);
      }
      
      // Default timeout error UI
      return (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '20px',
          margin: '16px 0',
          color: '#721c24'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '12px'
          }}>
            {isTimeoutError ? <FaClock /> : <FaExclamationTriangle />}
            <span>
              {isTimeoutError ? 'Operation Timed Out' : 'Something Went Wrong'}
            </span>
          </div>
          
          <div style={{ fontSize: '14px', marginBottom: '16px', lineHeight: '1.4' }}>
            {isTimeoutError ? (
              <>
                This operation took longer than expected to complete. This might be due to:
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  <li>Slow network connection</li>
                  <li>Server overload</li>
                  <li>Temporary connectivity issues</li>
                </ul>
              </>
            ) : (
              'An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.'
            )}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '16px'
          }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FaRedo style={{ fontSize: '12px' }} />
              Try Again {retryCount > 0 && `(${retryCount})`}
            </button>
            
            <button
              onClick={() => this.setState({ showDetails: !showDetails })}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FaBug style={{ fontSize: '12px' }} />
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
            
            <button
              onClick={this.handleReportProblem}
              style={{
                padding: '8px 16px',
                backgroundColor: '#17a2b8',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <FaChartBar style={{ fontSize: '12px' }} />
              Report Problem
            </button>
          </div>
          
          {showDetails && (
            <details style={{
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                Technical Details
              </summary>
              <div>
                <strong>Error:</strong> {error?.toString()}<br />
                {error?.stack && (
                  <>
                    <strong>Stack:</strong><br />
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                      {error.stack}
                    </pre>
                  </>
                )}
                {errorInfo?.componentStack && (
                  <>
                    <strong>Component Stack:</strong><br />
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '11px' }}>
                      {errorInfo.componentStack}
                    </pre>
                  </>
                )}
                <strong>Connection Quality:</strong> {connectionQualityMonitor.getCurrentQuality()}<br />
                <strong>Retry Count:</strong> {retryCount}
              </div>
            </details>
          )}
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Timeout metrics dashboard component
export const TimeoutMetricsDashboard = ({ compact = false }) => {
  const [metrics, setMetrics] = React.useState(globalTimeoutMonitor.getMetrics());
  const [isVisible, setIsVisible] = React.useState(false);
  
  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(globalTimeoutMonitor.getMetrics());
    };
    
    const unsubscribe = globalTimeoutMonitor.addListener(updateMetrics);
    
    // Update metrics every 30 seconds
    const interval = setInterval(updateMetrics, 30000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);
  
  if (compact) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999
      }}>
        ⏰ {metrics.sessionTimeouts} timeouts | 📶 {connectionQualityMonitor.getCurrentQuality()}
      </div>
    );
  }
  
  return (
    <div>
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          fontSize: '16px',
          zIndex: 9998,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
        }}
      >
        📊
      </button>
      
      {isVisible && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '300px',
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <div style={{
            padding: '12px',
            borderBottom: '1px solid #eee',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Timeout Metrics</span>
            <button
              onClick={() => setIsVisible(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{ padding: '12px', fontSize: '13px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Session Timeouts:</strong> {metrics.sessionTimeouts}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Total Timeouts:</strong> {metrics.totalTimeouts}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Retry Rate:</strong> {(metrics.userRetryRate * 100).toFixed(1)}%
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Connection Quality:</strong> {connectionQualityMonitor.getCurrentQuality()}
            </div>
            
            {metrics.topTimeoutTypes.length > 0 && (
              <div>
                <strong>Top Timeout Types:</strong>
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {metrics.topTimeoutTypes.map(([type, count]) => (
                    <li key={type}>{type}: {count}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Export components and utilities
export default TimeoutErrorBoundary;
export { globalTimeoutMonitor };
export const useTimeoutMetrics = () => {
  const [metrics, setMetrics] = React.useState(globalTimeoutMonitor.getMetrics());
  
  React.useEffect(() => {
    const updateMetrics = () => setMetrics(globalTimeoutMonitor.getMetrics());
    const unsubscribe = globalTimeoutMonitor.addListener(updateMetrics);
    
    return unsubscribe;
  }, []);
  
  return metrics;
};