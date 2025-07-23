const logger = require('./logger');
const SessionPersistence = require('./sessionPersistence');

/**
 * Production-ready session monitoring and health check utilities
 */
class SessionMonitoring {
    constructor() {
        this.healthCheckInterval = null;
        this.alertThresholds = {
            maxSessions: 1000,
            sessionCleanupFrequency: 300000, // 5 minutes
            reconnectionFailureRate: 0.1, // 10%
            memoryUsageThreshold: 0.8 // 80%
        };
        this.metrics = {
            sessionsCreated: 0,
            sessionsDestroyed: 0,
            reconnectionAttempts: 0,
            reconnectionSuccesses: 0,
            reconnectionFailures: 0,
            lastCleanupTime: Date.now(),
            errors: []
        };
    }

    /**
     * Start comprehensive session monitoring
     * @param {number} intervalMs - Health check interval in milliseconds (default: 5 minutes)
     */
    startMonitoring(intervalMs = 300000) {
        if (this.healthCheckInterval) {
            logger.warn('Session monitoring already started');
            return;
        }

        logger.info(`Starting session monitoring with ${intervalMs}ms interval`);
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, intervalMs);

        // Prevent the interval from keeping the process alive
        this.healthCheckInterval.unref();
    }

    /**
     * Stop session monitoring
     */
    stopMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
            logger.info('Session monitoring stopped');
        }
    }

    /**
     * Perform comprehensive health check
     * @returns {Object} Health check results
     */
    performHealthCheck() {
        const healthReport = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            issues: [],
            metrics: {},
            recommendations: []
        };

        try {
            // Get current session statistics
            const stats = SessionPersistence.getSessionStats();
            healthReport.metrics = {
                totalSessions: stats.total,
                activeSessions: stats.active,
                expiredSessions: stats.expired || 0,
                gamesWithSessions: Object.keys(stats.games || {}).length,
                sessionTimeout: stats.sessionTimeout,
                cleanupInterval: stats.cleanupInterval,
                ...this.metrics
            };

            // Check 1: Session count thresholds
            if (stats.total > this.alertThresholds.maxSessions) {
                healthReport.status = 'warning';
                healthReport.issues.push({
                    severity: 'warning',
                    type: 'high_session_count',
                    message: `High session count: ${stats.total} (threshold: ${this.alertThresholds.maxSessions})`,
                    recommendation: 'Consider increasing cleanup frequency or reducing session timeout'
                });
            }

            // Check 2: Reconnection failure rate
            const reconnectionFailureRate = this.metrics.reconnectionAttempts > 0 
                ? this.metrics.reconnectionFailures / this.metrics.reconnectionAttempts 
                : 0;
            
            if (reconnectionFailureRate > this.alertThresholds.reconnectionFailureRate) {
                healthReport.status = 'warning';
                healthReport.issues.push({
                    severity: 'warning',
                    type: 'high_reconnection_failure_rate',
                    message: `High reconnection failure rate: ${(reconnectionFailureRate * 100).toFixed(1)}%`,
                    recommendation: 'Review session persistence logic and connection handling'
                });
            }

            // Check 3: Memory usage (if available)
            const memoryUsage = process.memoryUsage();
            const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
            const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
            const memoryUsageRatio = memoryUsage.heapUsed / memoryUsage.heapTotal;

            healthReport.metrics.memoryUsage = {
                heapUsedMB: Math.round(heapUsedMB),
                heapTotalMB: Math.round(heapTotalMB),
                usageRatio: Math.round(memoryUsageRatio * 100) / 100
            };

            if (memoryUsageRatio > this.alertThresholds.memoryUsageThreshold) {
                healthReport.status = 'critical';
                healthReport.issues.push({
                    severity: 'critical',
                    type: 'high_memory_usage',
                    message: `High memory usage: ${Math.round(memoryUsageRatio * 100)}%`,
                    recommendation: 'Force session cleanup and monitor for memory leaks'
                });
            }

            // Check 4: Cleanup frequency
            const timeSinceLastCleanup = Date.now() - this.metrics.lastCleanupTime;
            if (timeSinceLastCleanup > this.alertThresholds.sessionCleanupFrequency) {
                healthReport.status = 'warning';
                healthReport.issues.push({
                    severity: 'warning',
                    type: 'delayed_cleanup',
                    message: `Session cleanup delayed: ${Math.round(timeSinceLastCleanup / 1000)}s ago`,
                    recommendation: 'Check cleanup timer and force cleanup if necessary'
                });
            }

            // Check 5: Recent errors
            const recentErrors = this.metrics.errors.filter(error => 
                Date.now() - error.timestamp < 300000 // Last 5 minutes
            );
            
            if (recentErrors.length > 5) {
                healthReport.status = 'critical';
                healthReport.issues.push({
                    severity: 'critical',
                    type: 'high_error_rate',
                    message: `High error rate: ${recentErrors.length} errors in last 5 minutes`,
                    recommendation: 'Review recent error logs and investigate root causes'
                });
            }

            // Log health status
            if (healthReport.status === 'healthy') {
                logger.info('Session health check: ✅ HEALTHY', {
                    totalSessions: stats.total,
                    activeSessions: stats.active,
                    memoryUsedMB: healthReport.metrics.memoryUsage.heapUsedMB
                });
            } else {
                logger.warn(`Session health check: ⚠️ ${healthReport.status.toUpperCase()}`, {
                    issues: healthReport.issues.length,
                    status: healthReport.status,
                    totalSessions: stats.total
                });
            }

            return healthReport;

        } catch (error) {
            logger.error('Health check failed:', error);
            healthReport.status = 'error';
            healthReport.issues.push({
                severity: 'critical',
                type: 'health_check_failure',
                message: `Health check failed: ${error.message}`,
                recommendation: 'Investigate session monitoring system'
            });
            
            this.recordError('health_check_failure', error);
            return healthReport;
        }
    }

    /**
     * Record session creation for monitoring
     */
    recordSessionCreation() {
        this.metrics.sessionsCreated++;
    }

    /**
     * Record session destruction for monitoring
     */
    recordSessionDestruction() {
        this.metrics.sessionsDestroyed++;
    }

    /**
     * Record reconnection attempt
     * @param {boolean} success - Whether the reconnection was successful
     * @param {string} reason - Reason for failure (if applicable)
     */
    recordReconnectionAttempt(success, reason = null) {
        this.metrics.reconnectionAttempts++;
        
        if (success) {
            this.metrics.reconnectionSuccesses++;
            logger.info('Session reconnection successful');
        } else {
            this.metrics.reconnectionFailures++;
            logger.warn(`Session reconnection failed: ${reason || 'unknown reason'}`);
            this.recordError('reconnection_failure', new Error(reason || 'Unknown reconnection failure'));
        }
    }

    /**
     * Record cleanup operation
     */
    recordCleanup() {
        this.metrics.lastCleanupTime = Date.now();
        logger.info('Session cleanup completed');
    }

    /**
     * Record error for monitoring
     * @param {string} type - Error type
     * @param {Error} error - The error object
     */
    recordError(type, error) {
        const errorRecord = {
            type,
            message: error.message,
            stack: error.stack,
            timestamp: Date.now()
        };

        this.metrics.errors.push(errorRecord);
        
        // Keep only last 100 errors to prevent memory issues
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-100);
        }

        logger.error(`Session monitoring error [${type}]:`, error);
    }

    /**
     * Get current monitoring metrics
     * @returns {Object} Current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            sessionStats: SessionPersistence.getSessionStats(),
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        };
    }

    /**
     * Generate debugging report for troubleshooting
     * @returns {Object} Comprehensive debugging information
     */
    generateDebugReport() {
        const sessions = SessionPersistence.getAllActiveSessions();
        const stats = SessionPersistence.getSessionStats();
        
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalSessions: stats.total,
                activeSessions: stats.active,
                expiredSessions: stats.expired || 0,
                gamesWithSessions: Object.keys(stats.games || {}).length
            },
            sessions: sessions.map(session => ({
                sessionId: session.sessionId,
                playerId: session.playerId,
                playerName: session.playerName,
                gameId: session.gameId,
                lastActivity: new Date(session.lastActivity).toISOString(),
                reconnectionCount: session.reconnectionCount || 0,
                ageMinutes: Math.round((Date.now() - session.createdAt) / 60000)
            })),
            metrics: this.getMetrics(),
            healthCheck: this.performHealthCheck(),
            recentErrors: this.metrics.errors.slice(-10) // Last 10 errors
        };
    }

    /**
     * Force cleanup and health recovery
     * @returns {Object} Recovery results
     */
    forceRecovery() {
        logger.warn('Forcing session recovery procedures');
        
        const results = {
            cleanupPerformed: false,
            sessionsCleared: 0,
            memoryFreed: false,
            errors: []
        };

        try {
            // Force cleanup expired sessions
            const beforeStats = SessionPersistence.getSessionStats();
            const cleanupSuccess = SessionPersistence.forceCleanup();
            const afterStats = SessionPersistence.getSessionStats();
            
            results.cleanupPerformed = cleanupSuccess;
            results.sessionsCleared = beforeStats.total - afterStats.total;
            
            if (results.sessionsCleared > 0) {
                logger.info(`Recovery: Cleared ${results.sessionsCleared} expired sessions`);
                this.recordCleanup();
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
                results.memoryFreed = true;
                logger.info('Recovery: Forced garbage collection');
            }

            logger.info('Session recovery completed successfully');

        } catch (error) {
            logger.error('Session recovery failed:', error);
            results.errors.push(error.message);
            this.recordError('recovery_failure', error);
        }

        return results;
    }
}

// Create singleton instance
const sessionMonitoring = new SessionMonitoring();

module.exports = sessionMonitoring;