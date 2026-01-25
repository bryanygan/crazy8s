/**
 * Enhanced API Timeout Handler with Retry Mechanisms
 * 
 * Provides robust timeout handling for all API requests with:
 * - Configurable timeouts based on request type
 * - Exponential backoff retry logic
 * - Connection quality adaptation
 * - User-friendly error handling
 * - Performance monitoring
 */

import { API_TIMEOUTS, calculateAdaptiveTimeout } from '../config/timeouts';

// Error types for different timeout scenarios
export const TIMEOUT_ERROR_TYPES = {
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  ABORT_ERROR: 'ABORT_ERROR',
  RETRY_EXHAUSTED: 'RETRY_EXHAUSTED'
};

// Request priority levels for timeout adjustments
export const REQUEST_PRIORITIES = {
  CRITICAL: 'CRITICAL', // Auth, game join/leave
  HIGH: 'HIGH', // Game actions, real-time updates
  NORMAL: 'NORMAL', // General API calls
  LOW: 'LOW', // Analytics, optional features
  BACKGROUND: 'BACKGROUND' // Prefetching, caching
};

// Priority-based timeout multipliers
const PRIORITY_MULTIPLIERS = {
  [REQUEST_PRIORITIES.CRITICAL]: 2.0, // Double timeout for critical requests
  [REQUEST_PRIORITIES.HIGH]: 1.5, // 50% increase for high priority
  [REQUEST_PRIORITIES.NORMAL]: 1.0, // Standard timeout
  [REQUEST_PRIORITIES.LOW]: 0.8, // 20% reduction for low priority
  [REQUEST_PRIORITIES.BACKGROUND]: 0.5 // Half timeout for background requests
};

// Connection quality detection (simple heuristic)
let connectionQuality = 'UNKNOWN';
let lastRequestTime = Date.now();
let requestLatencies = [];

const updateConnectionQuality = (latency) => {
  requestLatencies.push(latency);
  
  // Keep only last 10 measurements
  if (requestLatencies.length > 10) {
    requestLatencies.shift();
  }
  
  // Calculate average latency
  const avgLatency = requestLatencies.reduce((sum, lat) => sum + lat, 0) / requestLatencies.length;
  
  if (avgLatency < 100) connectionQuality = 'EXCELLENT';
  else if (avgLatency < 300) connectionQuality = 'GOOD';
  else if (avgLatency < 800) connectionQuality = 'FAIR';
  else connectionQuality = 'POOR';
  
  return connectionQuality;
};

// Create timeout-aware AbortController
const createTimeoutController = (timeout) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  return { controller, timeoutId };
};

// Enhanced fetch with timeout and retry logic
export const fetchWithTimeout = async (url, options = {}) => {
  const {
    timeout = API_TIMEOUTS.DEFAULT_REQUEST_TIMEOUT,
    retryAttempts = API_TIMEOUTS.RETRY_ATTEMPTS,
    retryDelay = API_TIMEOUTS.RETRY_DELAY_BASE,
    priority = REQUEST_PRIORITIES.NORMAL,
    onRetry = null,
    onTimeout = null,
    onProgress = null,
    connectionQualityOverride = null,
    ...fetchOptions
  } = options;
  
  const startTime = Date.now();
  let lastError = null;
  
  // Calculate adaptive timeout
  const currentConnectionQuality = connectionQualityOverride || connectionQuality;
  const priorityMultiplier = PRIORITY_MULTIPLIERS[priority] || 1.0;
  const adaptiveTimeout = calculateAdaptiveTimeout(timeout, {
    connectionQuality: currentConnectionQuality
  }) * priorityMultiplier;
  
  console.log(`🌐 API Request: ${url} (timeout: ${adaptiveTimeout}ms, priority: ${priority})`);
  
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      // Create timeout controller
      const { controller, timeoutId } = createTimeoutController(adaptiveTimeout);
      
      // Report progress
      if (onProgress) {
        onProgress({
          stage: 'requesting',
          attempt: attempt + 1,
          maxAttempts: retryAttempts + 1,
          timeout: adaptiveTimeout
        });
      }
      
      // Make the request
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Calculate and track latency
      const latency = Date.now() - startTime;
      updateConnectionQuality(latency);
      
      // Check if response is ok
      if (!response.ok) {
        const errorType = response.status >= 500 ? 
          TIMEOUT_ERROR_TYPES.SERVER_ERROR : 
          TIMEOUT_ERROR_TYPES.NETWORK_ERROR;
        
        throw new APITimeoutError(
          `HTTP ${response.status}: ${response.statusText}`,
          errorType,
          { 
            status: response.status, 
            statusText: response.statusText,
            url,
            attempt: attempt + 1,
            latency
          }
        );
      }
      
      console.log(`✅ API Success: ${url} (${latency}ms, attempt ${attempt + 1})`);
      
      return response;
      
    } catch (error) {
      lastError = error;
      
      // Handle different error types
      let errorType = TIMEOUT_ERROR_TYPES.NETWORK_ERROR;
      let shouldRetry = true;
      
      if (error.name === 'AbortError') {
        errorType = TIMEOUT_ERROR_TYPES.REQUEST_TIMEOUT;
        console.warn(`⏰ API Timeout: ${url} (${adaptiveTimeout}ms, attempt ${attempt + 1})`);
        
        if (onTimeout) {
          onTimeout({
            url,
            timeout: adaptiveTimeout,
            attempt: attempt + 1,
            maxAttempts: retryAttempts + 1
          });
        }
      } else if (error instanceof APITimeoutError) {
        errorType = error.type;
        shouldRetry = error.retryable;
      } else {
        console.error(`❌ API Error: ${url}`, error);
      }
      
      // Don't retry on last attempt or non-retryable errors
      if (attempt === retryAttempts || !shouldRetry) {
        const finalError = new APITimeoutError(
          `Request failed after ${attempt + 1} attempts: ${error.message}`,
          errorType === TIMEOUT_ERROR_TYPES.REQUEST_TIMEOUT && attempt === retryAttempts ? 
            TIMEOUT_ERROR_TYPES.RETRY_EXHAUSTED : errorType,
          {
            originalError: error,
            url,
            totalAttempts: attempt + 1,
            timeout: adaptiveTimeout,
            connectionQuality: currentConnectionQuality
          }
        );
        
        console.error(`💥 API Failed: ${url} (${attempt + 1} attempts, ${Date.now() - startTime}ms total)`);
        throw finalError;
      }
      
      // Calculate retry delay with exponential backoff and jitter
      const backoffDelay = Math.min(
        retryDelay * Math.pow(API_TIMEOUTS.RETRY_BACKOFF_FACTOR, attempt),
        API_TIMEOUTS.RETRY_DELAY_MAX
      );
      const jitteredDelay = backoffDelay + (Math.random() * 1000); // Add up to 1s jitter
      
      console.log(`🔄 API Retry: ${url} in ${Math.round(jitteredDelay)}ms (attempt ${attempt + 1}/${retryAttempts + 1})`);
      
      if (onRetry) {
        onRetry({
          url,
          error,
          attempt: attempt + 1,
          maxAttempts: retryAttempts + 1,
          delay: jitteredDelay,
          connectionQuality: currentConnectionQuality
        });
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
};

// Custom error class for API timeout errors
export class APITimeoutError extends Error {
  constructor(message, type = TIMEOUT_ERROR_TYPES.REQUEST_TIMEOUT, details = {}) {
    super(message);
    this.name = 'APITimeoutError';
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.retryable = this.isRetryable(type);
  }
  
  isRetryable(type) {
    const retryableTypes = [
      TIMEOUT_ERROR_TYPES.REQUEST_TIMEOUT,
      TIMEOUT_ERROR_TYPES.NETWORK_ERROR,
      TIMEOUT_ERROR_TYPES.SERVER_ERROR
    ];
    return retryableTypes.includes(type);
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      details: this.details,
      timestamp: this.timestamp,
      retryable: this.retryable
    };
  }
}

// Specialized API methods with pre-configured timeouts
export const apiRequest = {
  // Authentication requests (critical priority, longer timeout)
  auth: (url, options = {}) => fetchWithTimeout(url, {
    timeout: API_TIMEOUTS.AUTH_REQUEST_TIMEOUT,
    priority: REQUEST_PRIORITIES.CRITICAL,
    retryAttempts: 2, // Fewer retries for auth to avoid lockouts
    ...options
  }),
  
  // Game action requests (high priority, standard timeout)
  game: (url, options = {}) => fetchWithTimeout(url, {
    timeout: API_TIMEOUTS.DEFAULT_REQUEST_TIMEOUT,
    priority: REQUEST_PRIORITIES.HIGH,
    ...options
  }),
  
  // File upload requests (longer timeout, fewer retries)
  upload: (url, options = {}) => fetchWithTimeout(url, {
    timeout: API_TIMEOUTS.UPLOAD_REQUEST_TIMEOUT,
    priority: REQUEST_PRIORITIES.HIGH,
    retryAttempts: 1, // Fewer retries for uploads
    ...options
  }),
  
  // Background requests (lower priority, shorter timeout)
  background: (url, options = {}) => fetchWithTimeout(url, {
    timeout: API_TIMEOUTS.DEFAULT_REQUEST_TIMEOUT * 0.5,
    priority: REQUEST_PRIORITIES.BACKGROUND,
    retryAttempts: 1,
    ...options
  }),
  
  // Standard requests
  standard: (url, options = {}) => fetchWithTimeout(url, {
    ...options
  })
};

// Request progress tracking
export class RequestProgressTracker {
  constructor() {
    this.activeRequests = new Map();
    this.completedRequests = [];
    this.listeners = [];
  }
  
  trackRequest(url, options = {}) {
    const requestId = `${url}_${Date.now()}_${Math.random()}`;
    const startTime = Date.now();
    
    const requestInfo = {
      id: requestId,
      url,
      startTime,
      options,
      status: 'pending'
    };
    
    this.activeRequests.set(requestId, requestInfo);
    this.notifyListeners('started', requestInfo);
    
    return {
      requestId,
      updateProgress: (progress) => {
        const request = this.activeRequests.get(requestId);
        if (request) {
          request.progress = progress;
          this.notifyListeners('progress', request);
        }
      },
      complete: (success, error = null) => {
        const request = this.activeRequests.get(requestId);
        if (request) {
          request.endTime = Date.now();
          request.duration = request.endTime - request.startTime;
          request.status = success ? 'success' : 'error';
          request.error = error;
          
          this.activeRequests.delete(requestId);
          this.completedRequests.push(request);
          
          // Keep only last 100 completed requests
          if (this.completedRequests.length > 100) {
            this.completedRequests.shift();
          }
          
          this.notifyListeners('completed', request);
        }
      }
    };
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
  
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in request progress listener:', error);
      }
    });
  }
  
  getActiveRequests() {
    return Array.from(this.activeRequests.values());
  }
  
  getStats() {
    const completed = this.completedRequests;
    const active = this.activeRequests.size;
    
    if (completed.length === 0) {
      return { active, completed: 0, averageLatency: 0, successRate: 0 };
    }
    
    const successful = completed.filter(r => r.status === 'success').length;
    const totalDuration = completed.reduce((sum, r) => sum + r.duration, 0);
    
    return {
      active,
      completed: completed.length,
      successful,
      failed: completed.length - successful,
      successRate: (successful / completed.length) * 100,
      averageLatency: totalDuration / completed.length,
      connectionQuality
    };
  }
}

// Global request tracker instance
export const globalRequestTracker = new RequestProgressTracker();

// Helper function to get current connection quality
export const getConnectionQuality = () => connectionQuality;

// Helper function to manually update connection quality
export const setConnectionQuality = (quality) => {
  if (Object.values(['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'UNKNOWN']).includes(quality)) {
    connectionQuality = quality;
  }
};

// Performance monitoring and reporting
export const getAPIPerformanceReport = () => {
  const stats = globalRequestTracker.getStats();
  const recentLatencies = requestLatencies.slice(-10);
  
  return {
    ...stats,
    recentLatencies,
    connectionQuality,
    recommendations: generatePerformanceRecommendations(stats)
  };
};

const generatePerformanceRecommendations = (stats) => {
  const recommendations = [];
  
  if (stats.successRate < 90) {
    recommendations.push({
      type: 'reliability',
      message: 'Low success rate detected. Consider increasing retry attempts or timeouts.',
      priority: 'high'
    });
  }
  
  if (stats.averageLatency > 2000) {
    recommendations.push({
      type: 'performance', 
      message: 'High average latency detected. Check network connection or server performance.',
      priority: 'medium'
    });
  }
  
  if (connectionQuality === 'POOR') {
    recommendations.push({
      type: 'connection',
      message: 'Poor connection quality detected. Enable offline mode or increase timeouts.',
      priority: 'high'
    });
  }
  
  return recommendations;
};

console.log('🚀 API Timeout Handler initialized with enhanced retry mechanisms');