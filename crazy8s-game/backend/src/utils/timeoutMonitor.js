/**
 * Timeout Monitor
 * 
 * Provides comprehensive monitoring and logging for all timeout events
 * across the Crazy 8's game backend. Tracks performance metrics and
 * provides recommendations for timeout optimization.
 */

const logger = require('./logger');
const { getTimeout, calculateAdaptiveTurnTimeout, calculateAdaptiveDbTimeout } = require('../config/timeouts');

class TimeoutMonitor {
  constructor() {
    // Initialize metrics storage
    this.metrics = {
      // Socket timeout metrics
      socketTimeouts: {
        ping: 0,
        connection: 0,
        upgrade: 0,
        total: 0
      },
      
      // Database timeout metrics
      databaseTimeouts: {
        query: 0,
        acquire: 0,
        transaction: 0,
        connection: 0,
        total: 0
      },
      
      // Game timeout metrics
      gameTimeouts: {
        turn: 0,
        action: 0,
        validation: 0,
        total: 0
      },
      
      // Session timeout metrics
      sessionTimeouts: {
        validation: 0,
        cleanup: 0,
        total: 0
      },
      
      // Performance metrics
      performance: {
        avgQueryTime: 0,
        maxQueryTime: 0,
        avgConnectionTime: 0,
        maxConnectionTime: 0,
        activeQueries: 0,
        activeConnections: 0,
        slowQueries: 0,
        failedConnections: 0
      },
      
      // Player-specific metrics
      playerMetrics: {
        totalPlayers: 0,
        maxConcurrentPlayers: 0,
        avgPlayersPerGame: 0,
        timeoutsByPlayerCount: new Map()
      },
      
      // Time-based metrics
      timeBasedMetrics: {
        hourlyTimeouts: new Array(24).fill(0),
        dailyTimeouts: new Array(7).fill(0),
        lastReset: Date.now()
      }
    };
    
    // Track active operations
    this.activeOperations = {
      queries: new Map(),
      connections: new Map(),
      gameActions: new Map()
    };
    
    // Configuration
    this.config = {
      slowQueryThreshold: 5000,    // 5 seconds
      slowConnectionThreshold: 10000, // 10 seconds
      reportingInterval: 60000,    // 1 minute
      alertThresholds: {
        timeoutRate: 0.1,          // 10% timeout rate is concerning
        slowQueryRate: 0.05,       // 5% slow query rate is concerning
        connectionFailureRate: 0.05 // 5% connection failure rate is concerning
      }
    };
    
    // Start periodic reporting
    this.startPeriodicReporting();
    
    logger.info('TimeoutMonitor initialized with comprehensive tracking');
  }
  
  /**
   * Record a timeout event
   * @param {string} type - Timeout type (socket, database, game, session)
   * @param {string} subtype - Specific timeout subtype
   * @param {number} duration - Duration before timeout in milliseconds
   * @param {Object} context - Additional context information
   */
  recordTimeout(type, subtype, duration, context = {}) {
    const timestamp = Date.now();
    
    // Update main metrics
    if (this.metrics[`${type}Timeouts`]) {
      this.metrics[`${type}Timeouts`][subtype]++;
      this.metrics[`${type}Timeouts`].total++;
    }
    
    // Update time-based metrics
    this.updateTimeBasedMetrics();
    
    // Update player-specific metrics if applicable
    if (context.playerCount) {
      this.updatePlayerMetrics(context.playerCount);
    }
    
    // Log timeout with severity based on frequency
    const severity = this.calculateTimeoutSeverity(type, subtype);
    const logLevel = severity >= 0.8 ? 'error' : severity >= 0.5 ? 'warn' : 'info';
    
    logger[logLevel](`Timeout detected: ${type}.${subtype}`, {
      duration: `${duration}ms`,
      context,
      severity: `${Math.round(severity * 100)}%`,
      timestamp
    });
    
    // Check for alert conditions
    this.checkAlertConditions(type, subtype, severity);
  }
  
  /**
   * Record the start of an operation
   * @param {string} type - Operation type
   * @param {string} id - Unique operation ID
   * @param {Object} context - Operation context
   */
  recordOperationStart(type, id, context = {}) {
    this.activeOperations[type].set(id, {
      startTime: Date.now(),
      context
    });
    
    // Update active operation counts
    if (type === 'queries') {
      this.metrics.performance.activeQueries++;
    } else if (type === 'connections') {
      this.metrics.performance.activeConnections++;
    }
  }
  
  /**
   * Record the completion of an operation
   * @param {string} type - Operation type
   * @param {string} id - Unique operation ID
   * @param {boolean} success - Whether operation succeeded
   */
  recordOperationEnd(type, id, success = true) {
    const operation = this.activeOperations[type].get(id);
    if (!operation) return;
    
    const duration = Date.now() - operation.startTime;
    this.activeOperations[type].delete(id);
    
    // Update performance metrics
    if (type === 'queries') {
      this.metrics.performance.activeQueries--;
      this.updateQueryMetrics(duration, success);
    } else if (type === 'connections') {
      this.metrics.performance.activeConnections--;
      this.updateConnectionMetrics(duration, success);
    }
  }
  
  /**
   * Update query performance metrics
   * @param {number} duration - Query duration
   * @param {boolean} success - Query success
   */
  updateQueryMetrics(duration, success) {
    if (success) {
      // Update average query time
      this.metrics.performance.avgQueryTime = 
        (this.metrics.performance.avgQueryTime + duration) / 2;
      
      // Update max query time
      if (duration > this.metrics.performance.maxQueryTime) {
        this.metrics.performance.maxQueryTime = duration;
      }
      
      // Track slow queries
      if (duration > this.config.slowQueryThreshold) {
        this.metrics.performance.slowQueries++;
        logger.warn(`Slow query detected: ${duration}ms`);
      }
    }
  }
  
  /**
   * Update connection performance metrics
   * @param {number} duration - Connection duration
   * @param {boolean} success - Connection success
   */
  updateConnectionMetrics(duration, success) {
    if (success) {
      this.metrics.performance.avgConnectionTime = 
        (this.metrics.performance.avgConnectionTime + duration) / 2;
      
      if (duration > this.metrics.performance.maxConnectionTime) {
        this.metrics.performance.maxConnectionTime = duration;
      }
    } else {
      this.metrics.performance.failedConnections++;
    }
  }
  
  /**
   * Update time-based metrics
   */
  updateTimeBasedMetrics() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    this.metrics.timeBasedMetrics.hourlyTimeouts[hour]++;
    this.metrics.timeBasedMetrics.dailyTimeouts[day]++;
  }
  
  /**
   * Update player-specific metrics
   * @param {number} playerCount - Current player count
   */
  updatePlayerMetrics(playerCount) {
    this.metrics.playerMetrics.totalPlayers = Math.max(
      this.metrics.playerMetrics.totalPlayers, playerCount
    );
    
    if (playerCount > this.metrics.playerMetrics.maxConcurrentPlayers) {
      this.metrics.playerMetrics.maxConcurrentPlayers = playerCount;
    }
    
    // Track timeouts by player count
    const current = this.metrics.playerMetrics.timeoutsByPlayerCount.get(playerCount) || 0;
    this.metrics.playerMetrics.timeoutsByPlayerCount.set(playerCount, current + 1);
  }
  
  /**
   * Calculate timeout severity based on frequency and impact
   * @param {string} type - Timeout type
   * @param {string} subtype - Timeout subtype
   * @returns {number} Severity score (0-1)
   */
  calculateTimeoutSeverity(type, subtype) {
    const typeMetrics = this.metrics[`${type}Timeouts`];
    if (!typeMetrics) return 0;
    
    const subtypeCount = typeMetrics[subtype] || 0;
    const totalCount = typeMetrics.total || 1;
    
    // Calculate frequency-based severity
    const frequency = subtypeCount / totalCount;
    
    // Apply type-specific weights
    const typeWeights = {
      socket: { ping: 0.3, connection: 0.9, upgrade: 0.5 },
      database: { query: 0.8, acquire: 0.9, transaction: 0.9 },
      game: { turn: 0.7, action: 0.4, validation: 0.6 },
      session: { validation: 0.5, cleanup: 0.2 }
    };
    
    const weight = typeWeights[type]?.[subtype] || 0.5;
    
    return Math.min(frequency * weight, 1.0);
  }
  
  /**
   * Check for alert conditions
   * @param {string} type - Timeout type
   * @param {string} subtype - Timeout subtype
   * @param {number} severity - Calculated severity
   */
  checkAlertConditions(type, subtype, severity) {
    if (severity >= 0.8) {
      logger.error(`HIGH SEVERITY TIMEOUT ALERT: ${type}.${subtype}`, {
        severity: `${Math.round(severity * 100)}%`,
        recommendation: this.generateRecommendation(type, subtype, severity)
      });
    }
  }
  
  /**
   * Generate timeout optimization recommendations
   * @param {string} type - Timeout type
   * @param {string} subtype - Timeout subtype
   * @param {number} severity - Severity score
   * @returns {string} Recommendation
   */
  generateRecommendation(type, subtype, severity) {
    const recommendations = {
      socket: {
        ping: 'Consider increasing pingTimeout or improving network infrastructure',
        connection: 'Check server load and consider increasing connection pool size',
        upgrade: 'Verify WebSocket transport configuration and client compatibility'
      },
      database: {
        query: 'Optimize database queries or increase query timeout',
        acquire: 'Increase connection pool size or acquire timeout',
        transaction: 'Review transaction complexity or increase transaction timeout'
      },
      game: {
        turn: 'Consider adaptive turn timers based on game complexity',
        action: 'Review action throttling configuration',
        validation: 'Optimize card validation logic or increase timeout'
      },
      session: {
        validation: 'Optimize session validation or increase timeout',
        cleanup: 'Review session cleanup frequency'
      }
    };
    
    return recommendations[type]?.[subtype] || 'Review timeout configuration for this component';
  }
  
  /**
   * Get timeout recommendations based on current metrics
   * @returns {Array} Array of recommendations
   */
  getRecommendations() {
    const recommendations = [];
    
    // Check timeout rates
    Object.keys(this.metrics).forEach(type => {
      if (type.endsWith('Timeouts')) {
        const metrics = this.metrics[type];
        Object.keys(metrics).forEach(subtype => {
          if (subtype !== 'total') {
            const severity = this.calculateTimeoutSeverity(
              type.replace('Timeouts', ''), subtype
            );
            if (severity > 0.5) {
              recommendations.push({
                type: type.replace('Timeouts', ''),
                subtype,
                severity,
                recommendation: this.generateRecommendation(
                  type.replace('Timeouts', ''), subtype, severity
                )
              });
            }
          }
        });
      }
    });
    
    // Check performance metrics
    if (this.metrics.performance.slowQueries > 10) {
      recommendations.push({
        type: 'performance',
        subtype: 'queries',
        severity: 0.7,
        recommendation: 'High number of slow queries detected. Consider database optimization.'
      });
    }
    
    if (this.metrics.performance.failedConnections > 5) {
      recommendations.push({
        type: 'performance',
        subtype: 'connections',
        severity: 0.8,
        recommendation: 'High connection failure rate. Check database connectivity and pool settings.'
      });
    }
    
    return recommendations.sort((a, b) => b.severity - a.severity);
  }
  
  /**
   * Get comprehensive timeout report
   * @returns {Object} Detailed timeout report
   */
  getReport() {
    const now = Date.now();
    const uptime = now - this.metrics.timeBasedMetrics.lastReset;
    
    return {
      timestamp: now,
      uptime: `${Math.round(uptime / (60 * 1000))}min`,
      summary: {
        totalTimeouts: Object.values(this.metrics)
          .filter(m => m.total !== undefined)
          .reduce((sum, m) => sum + m.total, 0),
        criticalTimeouts: this.getCriticalTimeoutCount(),
        activeOperations: {
          queries: this.metrics.performance.activeQueries,
          connections: this.metrics.performance.activeConnections
        }
      },
      metrics: this.metrics,
      recommendations: this.getRecommendations(),
      configuration: this.getOptimizedTimeoutSuggestions()
    };
  }
  
  /**
   * Get count of critical timeouts
   * @returns {number} Number of critical timeouts
   */
  getCriticalTimeoutCount() {
    let critical = 0;
    
    // Count database timeouts as critical
    critical += this.metrics.databaseTimeouts.total;
    
    // Count game turn timeouts as critical
    critical += this.metrics.gameTimeouts.turn;
    
    // Count socket connection timeouts as critical
    critical += this.metrics.socketTimeouts.connection;
    
    return critical;
  }
  
  /**
   * Get optimized timeout configuration suggestions
   * @returns {Object} Suggested timeout configurations
   */
  getOptimizedTimeoutSuggestions() {
    const suggestions = {};
    
    // Suggest socket timeout adjustments based on ping timeout frequency
    if (this.metrics.socketTimeouts.ping > 5) {
      suggestions.socket = {
        pingTimeout: Math.max(getTimeout('socket').pingTimeout * 1.5, 180000),
        pingInterval: Math.max(getTimeout('socket').pingInterval * 1.2, 36000)
      };
    }
    
    // Suggest database timeout adjustments based on query timeouts
    if (this.metrics.databaseTimeouts.query > 3) {
      suggestions.database = {
        queryTimeout: Math.max(getTimeout('database', 'postgresql').queryTimeout * 1.5, 90000),
        acquireTimeout: Math.max(getTimeout('database', 'postgresql').acquireTimeout * 1.2, 60000)
      };
    }
    
    // Suggest game timeout adjustments based on turn timeouts
    if (this.metrics.gameTimeouts.turn > 2) {
      suggestions.game = {
        baseTurnTimeout: Math.max(getTimeout('game').baseTurnTimeout * 1.3, 90),
        turnTimeoutPerPlayer: Math.max(getTimeout('game').turnTimeoutPerPlayer * 1.2, 7)
      };
    }
    
    return suggestions;
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics() {
    Object.keys(this.metrics).forEach(key => {
      if (typeof this.metrics[key] === 'object' && this.metrics[key].total !== undefined) {
        Object.keys(this.metrics[key]).forEach(subkey => {
          this.metrics[key][subkey] = 0;
        });
      }
    });
    
    this.metrics.timeBasedMetrics.lastReset = Date.now();
    this.metrics.playerMetrics.timeoutsByPlayerCount.clear();
    
    logger.info('TimeoutMonitor metrics reset');
  }
  
  /**
   * Start periodic reporting
   */
  startPeriodicReporting() {
    setInterval(() => {
      const report = this.getReport();
      const summary = report.summary;
      
      if (summary.totalTimeouts > 0) {
        logger.info('Timeout Monitor Periodic Report:', {
          totalTimeouts: summary.totalTimeouts,
          criticalTimeouts: summary.criticalTimeouts,
          activeQueries: summary.activeOperations.queries,
          activeConnections: summary.activeOperations.connections,
          recommendations: report.recommendations.length
        });
        
        // Log high-priority recommendations
        report.recommendations
          .filter(r => r.severity > 0.7)
          .forEach(r => {
            logger.warn(`Timeout Recommendation (${Math.round(r.severity * 100)}%): ${r.recommendation}`);
          });
      }
    }, this.config.reportingInterval);
  }
}

// Create singleton instance
const timeoutMonitor = new TimeoutMonitor();

module.exports = timeoutMonitor;