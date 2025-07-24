/**
 * Adaptive Timeout Handler
 * 
 * Dynamically adjusts timeout values based on game state, player count,
 * and real-time performance metrics. Optimizes for 8-player games with
 * complex card stacking scenarios.
 */

const logger = require('./logger');
const timeoutMonitor = require('./timeoutMonitor');
const { calculateAdaptiveTurnTimeout, calculateAdaptiveDbTimeout, getTimeout } = require('../config/timeouts');

class AdaptiveTimeoutHandler {
  constructor() {
    this.gameMetrics = new Map(); // gameId -> metrics
    this.playerLoadMetrics = new Map(); // playerCount -> performance metrics
    this.networkQualityCache = new Map(); // socketId -> network quality
    
    // Performance thresholds
    this.thresholds = {
      slowOperationMs: 5000,
      verySlowOperationMs: 15000,
      highLoadPlayerCount: 6,
      criticalLoadPlayerCount: 8
    };
    
    // Start periodic optimization
    this.startPeriodicOptimization();
    
    logger.info('AdaptiveTimeoutHandler initialized');
  }
  
  /**
   * Get adaptive timeout for a specific operation
   * @param {string} type - Timeout type (socket, database, game, session)
   * @param {string} operation - Specific operation
   * @param {Object} context - Context information
   * @returns {number} Adaptive timeout in milliseconds
   */
  getAdaptiveTimeout(type, operation, context = {}) {
    const baseTimeout = this.getBaseTimeout(type, operation);
    const multiplier = this.calculateTimeoutMultiplier(type, operation, context);
    const adaptiveTimeout = Math.round(baseTimeout * multiplier);
    
    logger.debug(`Adaptive timeout calculated: ${type}.${operation}`, {
      base: baseTimeout,
      multiplier: multiplier.toFixed(2),
      adaptive: adaptiveTimeout,
      context: this.sanitizeContext(context)
    });
    
    return adaptiveTimeout;
  }
  
  /**
   * Get base timeout value
   * @param {string} type - Timeout type
   * @param {string} operation - Operation
   * @returns {number} Base timeout in milliseconds
   */
  getBaseTimeout(type, operation) {
    switch (type) {
      case 'socket':
        return getTimeout('socket')[operation] || 30000;
      case 'database':
        return getTimeout('database', 'postgresql')[operation] || 60000;
      case 'game':
        if (operation === 'turn') {
          return getTimeout('game').baseTurnTimeout * 1000;
        }
        return getTimeout('game')[operation] || 5000;
      case 'session':
        return getTimeout('session')[operation] || 10000;
      default:
        return 30000;
    }
  }
  
  /**
   * Calculate timeout multiplier based on various factors
   * @param {string} type - Timeout type
   * @param {string} operation - Operation
   * @param {Object} context - Context information
   * @returns {number} Multiplier value
   */
  calculateTimeoutMultiplier(type, operation, context) {
    let multiplier = 1.0;
    
    // Player count factor
    if (context.playerCount) {
      multiplier *= this.getPlayerCountMultiplier(context.playerCount);
    }
    
    // Game complexity factor
    if (context.gameState) {
      multiplier *= this.getGameComplexityMultiplier(context.gameState);
    }
    
    // Network quality factor
    if (context.socketId) {
      multiplier *= this.getNetworkQualityMultiplier(context.socketId);
    }
    
    // System load factor
    multiplier *= this.getSystemLoadMultiplier();
    
    // Operation history factor
    if (context.gameId) {
      multiplier *= this.getOperationHistoryMultiplier(context.gameId, type, operation);
    }
    
    // Apply reasonable bounds
    return Math.max(0.5, Math.min(multiplier, 5.0));
  }
  
  /**
   * Get multiplier based on player count
   * @param {number} playerCount - Number of players
   * @returns {number} Multiplier
   */
  getPlayerCountMultiplier(playerCount) {
    if (playerCount <= 2) return 0.8;        // Faster for small games
    if (playerCount <= 4) return 1.0;        // Normal for medium games
    if (playerCount <= 6) return 1.3;        // Slower for larger games
    if (playerCount <= 8) return 1.6;        // Much slower for max games
    return 2.0;                               // Very slow for over-capacity
  }
  
  /**
   * Get multiplier based on game complexity
   * @param {Object} gameState - Current game state
   * @returns {number} Multiplier
   */
  getGameComplexityMultiplier(gameState) {
    let multiplier = 1.0;
    
    // Stack complexity
    if (gameState.stackedCards && gameState.stackedCards.length > 0) {
      // Add 10% per stacked card, up to 50% extra
      multiplier += Math.min(gameState.stackedCards.length * 0.1, 0.5);
    }
    
    // Active effects complexity
    if (gameState.activeEffects && gameState.activeEffects.length > 0) {
      // Add 15% per active effect, up to 60% extra
      multiplier += Math.min(gameState.activeEffects.length * 0.15, 0.6);
    }
    
    // Card count in hands (more cards = more validation)
    if (gameState.players) {
      const totalCards = gameState.players.reduce((sum, player) => {
        return sum + (player.cards ? player.cards.length : 0);
      }, 0);
      
      if (totalCards > 50) {
        multiplier += 0.2; // 20% extra for many cards
      }
    }
    
    // Game phase complexity
    if (gameState.gamePhase === 'crazy8s_selection' || gameState.gamePhase === 'special_action') {
      multiplier += 0.3; // 30% extra for complex phases
    }
    
    return multiplier;
  }
  
  /**
   * Get multiplier based on network quality
   * @param {string} socketId - Socket ID
   * @returns {number} Multiplier
   */
  getNetworkQualityMultiplier(socketId) {
    const quality = this.networkQualityCache.get(socketId);
    
    switch (quality) {
      case 'poor': return 2.0;    // Double timeout for poor connections
      case 'fair': return 1.4;    // 40% extra for fair connections
      case 'good': return 1.0;    // Normal for good connections
      case 'excellent': return 0.8; // Faster for excellent connections
      default: return 1.2;        // Slightly conservative for unknown
    }
  }
  
  /**
   * Get multiplier based on system load
   * @returns {number} Multiplier
   */
  getSystemLoadMultiplier() {
    const report = timeoutMonitor.getReport();
    const recentTimeouts = report.summary.totalTimeouts;
    const activeQueries = report.summary.activeOperations.queries;
    const activeConnections = report.summary.activeOperations.connections;
    
    let multiplier = 1.0;
    
    // Adjust based on recent timeout frequency
    if (recentTimeouts > 10) {
      multiplier += 0.5; // 50% extra if many recent timeouts
    } else if (recentTimeouts > 5) {
      multiplier += 0.2; // 20% extra if some recent timeouts
    }
    
    // Adjust based on active operations
    if (activeQueries > 20) {
      multiplier += 0.3; // 30% extra for high query load
    }
    
    if (activeConnections > 30) {
      multiplier += 0.3; // 30% extra for high connection load
    }
    
    return multiplier;
  }
  
  /**
   * Get multiplier based on operation history for this game
   * @param {string} gameId - Game ID
   * @param {string} type - Operation type
   * @param {string} operation - Specific operation
   * @returns {number} Multiplier
   */
  getOperationHistoryMultiplier(gameId, type, operation) {
    const metrics = this.gameMetrics.get(gameId);
    if (!metrics) return 1.0;
    
    const operationKey = `${type}_${operation}`;
    const history = metrics.operationHistory.get(operationKey);
    
    if (!history || history.length === 0) return 1.0;
    
    // Calculate average operation time
    const avgTime = history.reduce((sum, time) => sum + time, 0) / history.length;
    const baseTimeout = this.getBaseTimeout(type, operation);
    
    // If operations are consistently slower, increase timeout
    if (avgTime > baseTimeout * 0.8) {
      return 1.4; // 40% extra if operations are consistently slow
    } else if (avgTime > baseTimeout * 0.6) {
      return 1.2; // 20% extra if operations are moderately slow
    } else if (avgTime < baseTimeout * 0.3) {
      return 0.8; // 20% reduction if operations are consistently fast
    }
    
    return 1.0;
  }
  
  /**
   * Update network quality for a socket
   * @param {string} socketId - Socket ID
   * @param {number} latency - Measured latency in ms
   */
  updateNetworkQuality(socketId, latency) {
    let quality;
    
    if (latency < 50) quality = 'excellent';
    else if (latency < 150) quality = 'good';
    else if (latency < 300) quality = 'fair';
    else quality = 'poor';
    
    this.networkQualityCache.set(socketId, quality);
    
    // Clean up old entries periodically
    if (this.networkQualityCache.size > 1000) {
      const entries = Array.from(this.networkQualityCache.entries());
      entries.slice(0, 500).forEach(([id]) => {
        this.networkQualityCache.delete(id);
      });
    }
  }
  
  /**
   * Record operation completion for future optimization
   * @param {string} gameId - Game ID
   * @param {string} type - Operation type
   * @param {string} operation - Specific operation
   * @param {number} duration - Operation duration in ms
   * @param {boolean} success - Whether operation succeeded
   */
  recordOperationCompletion(gameId, type, operation, duration, success = true) {
    if (!this.gameMetrics.has(gameId)) {
      this.initializeGameMetrics(gameId);
    }
    
    const metrics = this.gameMetrics.get(gameId);
    const operationKey = `${type}_${operation}`;
    
    if (!metrics.operationHistory.has(operationKey)) {
      metrics.operationHistory.set(operationKey, []);
    }
    
    const history = metrics.operationHistory.get(operationKey);
    history.push(duration);
    
    // Keep only last 20 operations to prevent memory growth
    if (history.length > 20) {
      history.shift();
    }
    
    // Update success rate
    if (!metrics.successRates.has(operationKey)) {
      metrics.successRates.set(operationKey, { successes: 0, total: 0 });
    }
    
    const successRate = metrics.successRates.get(operationKey);
    successRate.total++;
    if (success) successRate.successes++;
    
    // Update game performance metrics
    metrics.lastActivity = Date.now();
    
    logger.debug(`Recorded operation completion: ${gameId} ${operationKey}`, {
      duration,
      success,
      avgDuration: Math.round(history.reduce((a, b) => a + b, 0) / history.length),
      successRate: `${Math.round((successRate.successes / successRate.total) * 100)}%`
    });
  }
  
  /**
   * Initialize metrics for a new game
   * @param {string} gameId - Game ID
   */
  initializeGameMetrics(gameId) {
    this.gameMetrics.set(gameId, {
      operationHistory: new Map(),
      successRates: new Map(),
      lastActivity: Date.now(),
      playerCount: 0,
      complexity: 'normal'
    });
  }
  
  /**
   * Update game complexity assessment
   * @param {string} gameId - Game ID
   * @param {Object} gameState - Current game state
   */
  updateGameComplexity(gameId, gameState) {
    if (!this.gameMetrics.has(gameId)) {
      this.initializeGameMetrics(gameId);
    }
    
    const metrics = this.gameMetrics.get(gameId);
    metrics.playerCount = gameState.players ? gameState.players.length : 0;
    
    // Assess complexity
    let complexityScore = 0;
    
    if (gameState.stackedCards && gameState.stackedCards.length > 2) complexityScore += 2;
    if (gameState.activeEffects && gameState.activeEffects.length > 1) complexityScore += 2;
    if (metrics.playerCount >= 6) complexityScore += 2;
    if (gameState.gamePhase === 'crazy8s_selection') complexityScore += 1;
    
    if (complexityScore >= 5) metrics.complexity = 'high';
    else if (complexityScore >= 3) metrics.complexity = 'medium';
    else metrics.complexity = 'low';
    
    metrics.lastActivity = Date.now();
  }
  
  /**
   * Clean up old game metrics
   */
  cleanupOldMetrics() {
    const cutoff = Date.now() - (2 * 60 * 60 * 1000); // 2 hours
    
    for (const [gameId, metrics] of this.gameMetrics.entries()) {
      if (metrics.lastActivity < cutoff) {
        this.gameMetrics.delete(gameId);
        logger.debug(`Cleaned up metrics for game ${gameId}`);
      }
    }
  }
  
  /**
   * Get optimization recommendations
   * @returns {Array} Array of recommendations
   */
  getOptimizationRecommendations() {
    const recommendations = [];
    const loadMetrics = this.analyzeLoadMetrics();
    
    // Analyze player count patterns
    const highLoadGames = Array.from(this.gameMetrics.values())
      .filter(m => m.playerCount >= this.thresholds.highLoadPlayerCount);
    
    if (highLoadGames.length > 5) {
      recommendations.push({
        category: 'player_load',
        severity: 'medium',
        message: `${highLoadGames.length} high-load games detected. Consider increasing base timeouts for 6+ player games.`,
        suggestion: 'Increase timeout multipliers for high player count scenarios'
      });
    }
    
    // Analyze network quality patterns
    const poorNetworkSockets = Array.from(this.networkQualityCache.values())
      .filter(quality => quality === 'poor').length;
    
    if (poorNetworkSockets > 10) {
      recommendations.push({
        category: 'network_quality',
        severity: 'high',
        message: `${poorNetworkSockets} sockets with poor network quality detected.`,
        suggestion: 'Consider implementing more aggressive timeout scaling for poor network conditions'
      });
    }
    
    return recommendations;
  }
  
  /**
   * Analyze load metrics across player counts
   * @returns {Object} Load analysis
   */
  analyzeLoadMetrics() {
    const analysis = {
      byPlayerCount: new Map(),
      overallTrends: {}
    };
    
    // Analyze by player count
    for (const [gameId, metrics] of this.gameMetrics.entries()) {
      const count = metrics.playerCount;
      if (!analysis.byPlayerCount.has(count)) {
        analysis.byPlayerCount.set(count, {
          games: 0,
          avgComplexity: 0,
          timeoutFrequency: 0
        });
      }
      
      const playerData = analysis.byPlayerCount.get(count);
      playerData.games++;
      
      // Update complexity average
      const complexityScore = metrics.complexity === 'high' ? 3 : 
                             metrics.complexity === 'medium' ? 2 : 1;
      playerData.avgComplexity = (playerData.avgComplexity + complexityScore) / 2;
    }
    
    return analysis;
  }
  
  /**
   * Sanitize context for logging
   * @param {Object} context - Original context
   * @returns {Object} Sanitized context
   */
  sanitizeContext(context) {
    return {
      playerCount: context.playerCount,
      gameId: context.gameId ? `${context.gameId.slice(0, 8)}...` : undefined,
      socketId: context.socketId ? `${context.socketId.slice(0, 8)}...` : undefined,
      hasGameState: !!context.gameState,
      complexity: context.gameState?.complexity || 'unknown'
    };
  }
  
  /**
   * Start periodic optimization
   */
  startPeriodicOptimization() {
    // Clean up old metrics every 30 minutes
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 30 * 60 * 1000);
    
    // Generate optimization report every 10 minutes
    setInterval(() => {
      const recommendations = this.getOptimizationRecommendations();
      if (recommendations.length > 0) {
        logger.info('Adaptive timeout optimization recommendations:', recommendations);
      }
    }, 10 * 60 * 1000);
  }
  
  /**
   * Get current stats
   * @returns {Object} Current statistics
   */
  getStats() {
    return {
      trackedGames: this.gameMetrics.size,
      trackedSockets: this.networkQualityCache.size,
      loadAnalysis: this.analyzeLoadMetrics(),
      recommendations: this.getOptimizationRecommendations()
    };
  }
}

// Create singleton instance
const adaptiveTimeoutHandler = new AdaptiveTimeoutHandler();

module.exports = adaptiveTimeoutHandler;