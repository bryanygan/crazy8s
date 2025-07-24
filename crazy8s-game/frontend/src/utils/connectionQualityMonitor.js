/**
 * Connection Quality Monitor
 * 
 * Provides adaptive timeout logic based on real-time connection quality assessment:
 * - Latency measurement and tracking
 * - Network stability analysis
 * - Adaptive timeout recommendations
 * - Connection quality reporting
 */

import { calculateAdaptiveTimeout, CONNECTION_QUALITY_MULTIPLIERS } from '../config/timeouts';

class ConnectionQualityMonitor {
  constructor() {
    this.measurements = [];
    this.currentQuality = 'UNKNOWN';
    this.listeners = [];
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.stabilityHistory = [];
    this.lastQualityChange = Date.now();
    
    // Configuration
    this.config = {
      maxMeasurements: 50, // Keep last 50 measurements
      measurementInterval: 30000, // 30 seconds between measurements
      stabilityWindowSize: 10, // Check last 10 measurements for stability
      qualityChangeThreshold: 2, // Number of consecutive changes to update quality
    };
    
    // Quality thresholds (in milliseconds)
    this.thresholds = {
      excellent: 50,
      good: 150,
      fair: 400,
      poor: 1000
    };
    
    // Initialize with browser connection API if available
    this.initializeConnectionAPI();
  }
  
  // Initialize with browser Network Information API
  initializeConnectionAPI() {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      // Listen for connection changes
      connection.addEventListener('change', () => {
        this.handleConnectionChange(connection);
      });
      
      // Initial assessment
      this.handleConnectionChange(connection);
    }
  }
  
  // Handle browser connection API changes
  handleConnectionChange(connection) {
    const connectionInfo = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
      timestamp: Date.now()
    };
    
    console.log('📶 Browser connection info:', connectionInfo);
    
    // Estimate quality based on browser API
    let estimatedQuality = 'UNKNOWN';
    if (connection.rtt < this.thresholds.excellent) {
      estimatedQuality = 'EXCELLENT';
    } else if (connection.rtt < this.thresholds.good) {
      estimatedQuality = 'GOOD';
    } else if (connection.rtt < this.thresholds.fair) {
      estimatedQuality = 'FAIR';
    } else {
      estimatedQuality = 'POOR';
    }
    
    // Update quality if we don't have recent measurements
    if (this.measurements.length === 0 || 
        Date.now() - this.measurements[this.measurements.length - 1].timestamp > 60000) {
      this.updateQuality(estimatedQuality, 'browser_api');
    }
  }
  
  // Start monitoring connection quality
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🔍 Starting connection quality monitoring');
    
    // Perform immediate measurement
    this.measureLatency();
    
    // Set up periodic measurements
    this.monitoringInterval = setInterval(() => {
      this.measureLatency();
    }, this.config.measurementInterval);
  }
  
  // Stop monitoring
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('⏹️ Stopped connection quality monitoring');
  }
  
  // Measure latency using various methods
  async measureLatency() {
    const results = await Promise.allSettled([
      this.measureServerLatency(),
      this.measureAPILatency(),
      this.measureImageLatency()
    ]);
    
    const validResults = results
      .filter(result => result.status === 'fulfilled' && result.value > 0)
      .map(result => result.value);
    
    if (validResults.length > 0) {
      // Use median of valid measurements
      const median = this.calculateMedian(validResults);
      this.recordMeasurement(median, 'combined');
    } else {
      console.warn('⚠️ All latency measurements failed');
    }
  }
  
  // Measure latency to game server (if socket is available)
  measureServerLatency() {
    return new Promise((resolve) => {
      // Try to get socket from global context or connection context
      const socket = window.gameSocket || window.socket;
      
      if (!socket || !socket.connected) {
        resolve(-1);
        return;
      }
      
      const startTime = Date.now();
      const timeout = setTimeout(() => resolve(-1), 5000); // 5s timeout
      
      const handlePong = () => {
        clearTimeout(timeout);
        const latency = Date.now() - startTime;
        socket.off('pong', handlePong);
        resolve(latency);
      };
      
      socket.on('pong', handlePong);
      socket.emit('ping');
    });
  }
  
  // Measure API latency using a lightweight endpoint
  async measureAPILatency() {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        return Date.now() - startTime;
      }
      
      return -1;
    } catch (error) {
      return -1;
    }
  }
  
  // Measure latency using image loading
  measureImageLatency() {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const img = new Image();
      const timeout = setTimeout(() => resolve(-1), 5000);
      
      img.onload = () => {
        clearTimeout(timeout);
        resolve(Date.now() - startTime);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(-1);
      };
      
      // Use a small 1x1 pixel image with cache-busting
      img.src = `data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7?${Date.now()}`;
    });
  }
  
  // Record a latency measurement
  recordMeasurement(latency, method = 'unknown') {
    const measurement = {
      latency,
      method,
      timestamp: Date.now(),
      quality: this.classifyLatency(latency)
    };
    
    this.measurements.push(measurement);
    
    // Keep only recent measurements
    if (this.measurements.length > this.config.maxMeasurements) {
      this.measurements.shift();
    }
    
    // Update quality assessment
    this.assessQuality();
    
    console.log(`📊 Latency measurement: ${latency}ms (${method}) -> ${measurement.quality}`);
  }
  
  // Classify individual latency measurement
  classifyLatency(latency) {
    if (latency < this.thresholds.excellent) return 'EXCELLENT';
    if (latency < this.thresholds.good) return 'GOOD';
    if (latency < this.thresholds.fair) return 'FAIR';
    return 'POOR';
  }
  
  // Assess overall connection quality
  assessQuality() {
    if (this.measurements.length < 3) {
      return; // Need at least 3 measurements
    }
    
    const recentMeasurements = this.measurements.slice(-this.config.stabilityWindowSize);
    const latencies = recentMeasurements.map(m => m.latency);
    
    // Calculate statistics
    const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const medianLatency = this.calculateMedian(latencies);
    const variability = this.calculateVariability(latencies);
    
    // Determine quality based on median latency and stability
    let baseQuality = this.classifyLatency(medianLatency);
    
    // Adjust quality based on variability (connection stability)
    if (variability > 200) {
      // High variability degrades quality
      const qualityLevels = ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'];
      const currentIndex = qualityLevels.indexOf(baseQuality);
      if (currentIndex < qualityLevels.length - 1) {
        baseQuality = qualityLevels[currentIndex + 1];
      }
    }
    
    // Update quality if it has changed significantly
    if (baseQuality !== this.currentQuality) {
      const timeSinceLastChange = Date.now() - this.lastQualityChange;
      
      // Require stability before changing quality (avoid oscillation)
      if (timeSinceLastChange > 30000) { // 30 seconds minimum
        this.updateQuality(baseQuality, 'assessment', {
          avgLatency,
          medianLatency,
          variability,
          measurementCount: recentMeasurements.length
        });
      }
    }
  }
  
  // Update current quality and notify listeners
  updateQuality(newQuality, source = 'unknown', details = {}) {
    const oldQuality = this.currentQuality;
    this.currentQuality = newQuality;
    this.lastQualityChange = Date.now();
    
    const qualityUpdate = {
      oldQuality,
      newQuality,
      source,
      timestamp: Date.now(),
      details
    };
    
    console.log(`📶 Connection quality updated: ${oldQuality} -> ${newQuality} (${source})`);
    
    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(qualityUpdate);
      } catch (error) {
        console.error('Error in quality listener:', error);
      }
    });
  }
  
  // Add quality change listener
  addListener(listener) {
    this.listeners.push(listener);
    
    // Immediately notify with current quality
    listener({
      oldQuality: 'UNKNOWN',
      newQuality: this.currentQuality,
      source: 'initial',
      timestamp: Date.now(),
      details: this.getStats()
    });
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  // Get current connection quality
  getCurrentQuality() {
    return this.currentQuality;
  }
  
  // Get adaptive timeout for operation
  getAdaptiveTimeout(baseTimeout, options = {}) {
    return calculateAdaptiveTimeout(baseTimeout, {
      connectionQuality: this.currentQuality,
      ...options
    });
  }
  
  // Get quality statistics
  getStats() {
    if (this.measurements.length === 0) {
      return {
        currentQuality: this.currentQuality,
        measurementCount: 0,
        avgLatency: null,
        medianLatency: null,
        variability: null,
        isMonitoring: this.isMonitoring
      };
    }
    
    const recentMeasurements = this.measurements.slice(-10);
    const latencies = recentMeasurements.map(m => m.latency);
    
    return {
      currentQuality: this.currentQuality,
      measurementCount: this.measurements.length,
      avgLatency: Math.round(latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length),
      medianLatency: Math.round(this.calculateMedian(latencies)),
      variability: Math.round(this.calculateVariability(latencies)),
      isMonitoring: this.isMonitoring,
      lastMeasurement: this.measurements[this.measurements.length - 1],
      qualityMultiplier: CONNECTION_QUALITY_MULTIPLIERS[this.currentQuality] || 1.0
    };
  }
  
  // Calculate median of array
  calculateMedian(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    return sorted[mid];
  }
  
  // Calculate variability (standard deviation)
  calculateVariability(arr) {
    const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
    const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / arr.length;
    return Math.sqrt(variance);
  }
  
  // Force quality update (for testing or manual override)
  forceQualityUpdate(quality) {
    if (['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNKNOWN'].includes(quality)) {
      this.updateQuality(quality, 'manual_override');
    }
  }
  
  // Reset all measurements and quality
  reset() {
    this.measurements.length = 0;
    this.stabilityHistory.length = 0;
    this.currentQuality = 'UNKNOWN';
    this.lastQualityChange = Date.now();
    
    console.log('🔄 Connection quality monitor reset');
  }
}

// Global connection quality monitor instance
const globalConnectionMonitor = new ConnectionQualityMonitor();

// Auto-start monitoring when module loads
if (typeof window !== 'undefined') {
  // Start monitoring after a short delay to allow socket connections to establish
  setTimeout(() => {
    globalConnectionMonitor.startMonitoring();
  }, 2000);
  
  // Stop monitoring when page unloads
  window.addEventListener('beforeunload', () => {
    globalConnectionMonitor.stopMonitoring();
  });
}

// Export the monitor and utility functions
export const connectionQualityMonitor = globalConnectionMonitor;

// Hook for React components to use connection quality
export const useConnectionQuality = (callback = null) => {
  const [quality, setQuality] = React.useState(globalConnectionMonitor.getCurrentQuality());
  const [stats, setStats] = React.useState(globalConnectionMonitor.getStats());
  
  React.useEffect(() => {
    const unsubscribe = globalConnectionMonitor.addListener((update) => {
      setQuality(update.newQuality);
      setStats(globalConnectionMonitor.getStats());
      
      if (callback) {
        callback(update);
      }
    });
    
    return unsubscribe;
  }, [callback]);
  
  return {
    quality,
    stats,
    getAdaptiveTimeout: (baseTimeout, options) => 
      globalConnectionMonitor.getAdaptiveTimeout(baseTimeout, options),
    forceUpdate: (newQuality) => 
      globalConnectionMonitor.forceQualityUpdate(newQuality)
  };
};

// Utility functions for external use
export const getCurrentConnectionQuality = () => globalConnectionMonitor.getCurrentQuality();
export const getConnectionStats = () => globalConnectionMonitor.getStats();
export const getAdaptiveTimeout = (baseTimeout, options = {}) => 
  globalConnectionMonitor.getAdaptiveTimeout(baseTimeout, options);
export const addConnectionQualityListener = (listener) => 
  globalConnectionMonitor.addListener(listener);
export const forceConnectionQualityUpdate = (quality) => 
  globalConnectionMonitor.forceQualityUpdate(quality);

console.log('📶 Connection quality monitor initialized');