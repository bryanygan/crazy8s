const express = require('express');
const router = express.Router();
const sessionMonitoring = require('../utils/sessionMonitoring');
const SessionPersistence = require('../utils/sessionPersistence');
const logger = require('../utils/logger');

/**
 * Production health check and monitoring endpoints
 */

/**
 * Basic health check endpoint
 * GET /api/health
 */
router.get('/', (req, res) => {
    try {
        const healthCheck = sessionMonitoring.performHealthCheck();
        const statusCode = healthCheck.status === 'healthy' ? 200 : 
                          healthCheck.status === 'warning' ? 200 : 503;
        
        res.status(statusCode).json({
            status: healthCheck.status,
            timestamp: healthCheck.timestamp,
            service: 'crazy8s-backend',
            version: process.env.npm_package_version || '1.0.0',
            uptime: process.uptime(),
            issues: healthCheck.issues.length,
            sessionCount: healthCheck.metrics.totalSessions
        });
    } catch (error) {
        logger.error('Health check endpoint failed:', error);
        res.status(503).json({
            status: 'error',
            message: 'Health check failed',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Detailed session health endpoint
 * GET /api/health/sessions
 */
router.get('/sessions', (req, res) => {
    try {
        const healthCheck = sessionMonitoring.performHealthCheck();
        
        res.json({
            status: healthCheck.status,
            timestamp: healthCheck.timestamp,
            issues: healthCheck.issues,
            metrics: healthCheck.metrics,
            recommendations: healthCheck.recommendations
        });
    } catch (error) {
        logger.error('Session health endpoint failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Session health check failed',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Session statistics endpoint
 * GET /api/health/stats
 */
router.get('/stats', (req, res) => {
    try {
        const stats = SessionPersistence.getSessionStats();
        const metrics = sessionMonitoring.getMetrics();
        
        res.json({
            timestamp: new Date().toISOString(),
            sessionStore: stats,
            monitoring: {
                sessionsCreated: metrics.sessionsCreated,
                sessionsDestroyed: metrics.sessionsDestroyed,
                reconnectionAttempts: metrics.reconnectionAttempts,
                reconnectionSuccessRate: metrics.reconnectionAttempts > 0 
                    ? Math.round((metrics.reconnectionSuccesses / metrics.reconnectionAttempts) * 100) / 100
                    : 1,
                lastCleanupTime: new Date(metrics.lastCleanupTime).toISOString(),
                errorCount: metrics.errors.length
            },
            system: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                nodeVersion: process.version,
                platform: process.platform
            }
        });
    } catch (error) {
        logger.error('Stats endpoint failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Stats retrieval failed',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Debug information endpoint (for troubleshooting)
 * GET /api/health/debug
 */
router.get('/debug', (req, res) => {
    try {
        // Require authentication in production
        const isProduction = process.env.NODE_ENV === 'production';
        const debugKey = req.query.key;
        
        if (isProduction && (!debugKey || debugKey !== process.env.DEBUG_KEY)) {
            return res.status(401).json({
                status: 'error',
                message: 'Debug access requires valid key in production'
            });
        }
        
        const debugReport = sessionMonitoring.generateDebugReport();
        
        res.json(debugReport);
    } catch (error) {
        logger.error('Debug endpoint failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Debug report generation failed',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Force recovery endpoint (for emergency situations)
 * POST /api/health/recover
 */
router.post('/recover', (req, res) => {
    try {
        // Require authentication in production
        const isProduction = process.env.NODE_ENV === 'production';
        const adminKey = req.body.adminKey || req.query.adminKey;
        
        if (isProduction && (!adminKey || adminKey !== process.env.ADMIN_KEY)) {
            return res.status(401).json({
                status: 'error',
                message: 'Recovery requires admin key in production'
            });
        }
        
        logger.warn('Manual recovery initiated via API endpoint');
        const recoveryResults = sessionMonitoring.forceRecovery();
        
        res.json({
            status: 'success',
            message: 'Recovery procedures completed',
            timestamp: new Date().toISOString(),
            results: recoveryResults
        });
    } catch (error) {
        logger.error('Recovery endpoint failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Recovery failed',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * Force cleanup endpoint
 * POST /api/health/cleanup
 */
router.post('/cleanup', (req, res) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        const adminKey = req.body.adminKey || req.query.adminKey;
        
        if (isProduction && (!adminKey || adminKey !== process.env.ADMIN_KEY)) {
            return res.status(401).json({
                status: 'error',
                message: 'Cleanup requires admin key in production'
            });
        }
        
        const beforeStats = SessionPersistence.getSessionStats();
        const success = SessionPersistence.forceCleanup();
        const afterStats = SessionPersistence.getSessionStats();
        
        if (success) {
            sessionMonitoring.recordCleanup();
            res.json({
                status: 'success',
                message: 'Session cleanup completed',
                timestamp: new Date().toISOString(),
                sessionsRemoved: beforeStats.total - afterStats.total,
                remainingSessions: afterStats.total
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Session cleanup failed',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        logger.error('Cleanup endpoint failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Cleanup operation failed',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

module.exports = router;