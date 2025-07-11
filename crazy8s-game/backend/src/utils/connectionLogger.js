const logger = require('./logger');

class ConnectionLogger {
    constructor() {
        this.sessionMetrics = new Map(); // Track connection metrics per session
    }

    /**
     * Log initial connection
     */
    logConnection(socket, userInfo = null) {
        const connectionInfo = {
            socketId: socket.id,
            ip: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent'],
            timestamp: Date.now(),
            isAuthenticated: !!userInfo,
            userId: userInfo?.id || null,
            username: userInfo?.username || null
        };

        if (userInfo) {
            logger.info(`🔌 Authenticated connection: ${userInfo.username} (${socket.id}) from ${connectionInfo.ip}`);
        } else {
            logger.info(`🔌 Guest connection: ${socket.id} from ${connectionInfo.ip}`);
        }

        this.sessionMetrics.set(socket.id, {
            ...connectionInfo,
            events: [],
            disconnections: 0,
            reconnections: 0,
            lastActivity: Date.now()
        });

        return connectionInfo;
    }

    /**
     * Log disconnection with detailed reason analysis
     */
    logDisconnection(socket, reason, gameInfo = null) {
        const metrics = this.sessionMetrics.get(socket.id);
        const disconnectionInfo = {
            socketId: socket.id,
            reason: reason,
            timestamp: Date.now(),
            gameId: gameInfo?.gameId || null,
            playerName: gameInfo?.playerName || null,
            sessionDuration: metrics ? Date.now() - metrics.timestamp : 0
        };

        // Categorize disconnection reason
        const reasonCategory = this.categorizeDisconnectionReason(reason);
        
        if (metrics) {
            metrics.disconnections++;
            metrics.lastDisconnection = disconnectionInfo;
            
            logger.info(`🔌❌ Disconnection: ${metrics.username || socket.id} - Reason: ${reason} (${reasonCategory}) - Session: ${Math.round(disconnectionInfo.sessionDuration / 1000)}s`);
            
            if (gameInfo) {
                logger.info(`🎮❌ Game disconnection: ${gameInfo.playerName} left game ${gameInfo.gameId} - Reason: ${reason}`);
            }
        } else {
            logger.warn(`🔌❌ Disconnection from unknown session: ${socket.id} - Reason: ${reason}`);
        }

        return { ...disconnectionInfo, category: reasonCategory };
    }

    /**
     * Log reconnection attempt and success/failure
     */
    logReconnectionAttempt(socket, attemptInfo, success = false) {
        const metrics = this.sessionMetrics.get(socket.id);
        const reconnectionInfo = {
            socketId: socket.id,
            gameId: attemptInfo.gameId,
            playerName: attemptInfo.playerName,
            success: success,
            timestamp: Date.now(),
            method: attemptInfo.method || 'manual', // auto, manual
            downtime: attemptInfo.downtime || 0
        };

        if (metrics) {
            metrics.reconnections++;
            metrics.lastReconnection = reconnectionInfo;
        }

        if (success) {
            logger.info(`🔌✅ Reconnection successful: ${attemptInfo.playerName} to game ${attemptInfo.gameId} (${socket.id}) - Method: ${reconnectionInfo.method} - Downtime: ${Math.round(reconnectionInfo.downtime / 1000)}s`);
        } else {
            logger.warn(`🔌❌ Reconnection failed: ${attemptInfo.playerName} to game ${attemptInfo.gameId} (${socket.id}) - Method: ${reconnectionInfo.method}`);
        }

        return reconnectionInfo;
    }

    /**
     * Log session preservation
     */
    logSessionPreservation(sessionInfo, preservationDetails) {
        logger.info(`💾 Session preserved: ${sessionInfo.playerName} in game ${sessionInfo.gameId} - Valid for ${Math.round(preservationDetails.validityDuration / 60000)} minutes`);
    }

    /**
     * Log session restoration
     */
    logSessionRestoration(sessionInfo, restorationDetails) {
        const metrics = this.sessionMetrics.get(restorationDetails.newSocketId);
        
        if (metrics) {
            metrics.sessionRestorations = (metrics.sessionRestorations || 0) + 1;
        }

        logger.info(`💾✅ Session restored: ${sessionInfo.playerName} in game ${sessionInfo.gameId} - New socket: ${restorationDetails.newSocketId} - Preservation time: ${Math.round(restorationDetails.preservationTime / 1000)}s`);
    }

    /**
     * Log network quality issues
     */
    logNetworkIssue(socket, issueDetails) {
        const metrics = this.sessionMetrics.get(socket.id);
        
        if (metrics) {
            if (!metrics.networkIssues) metrics.networkIssues = [];
            metrics.networkIssues.push({
                ...issueDetails,
                timestamp: Date.now()
            });
        }

        logger.warn(`🌐⚠️ Network issue detected: ${socket.id} - ${issueDetails.type}: ${issueDetails.description}`);
    }

    /**
     * Log heartbeat metrics
     */
    logHeartbeat(socket, heartbeatData) {
        const metrics = this.sessionMetrics.get(socket.id);
        
        if (metrics) {
            metrics.lastActivity = Date.now();
            if (!metrics.heartbeats) metrics.heartbeats = [];
            
            metrics.heartbeats.push({
                latency: heartbeatData.latency,
                timestamp: Date.now()
            });

            // Keep only last 10 heartbeats
            if (metrics.heartbeats.length > 10) {
                metrics.heartbeats = metrics.heartbeats.slice(-10);
            }
        }

        if (heartbeatData.latency > 1000) { // High latency
            logger.warn(`💓⚠️ High latency detected: ${socket.id} - ${heartbeatData.latency}ms`);
        }
    }

    /**
     * Log game state restoration events
     */
    logGameStateRestoration(socket, gameId, restorationDetails) {
        const metrics = this.sessionMetrics.get(socket.id);
        
        if (metrics) {
            if (!metrics.gameStateRestorations) metrics.gameStateRestorations = [];
            metrics.gameStateRestorations.push({
                gameId: gameId,
                timestamp: Date.now(),
                ...restorationDetails
            });
        }

        logger.info(`🎮🔄 Game state restored: ${socket.id} in game ${gameId} - Phase: ${restorationDetails.gamePhase} - Turn: ${restorationDetails.isYourTurn ? 'Yes' : 'No'}`);
    }

    /**
     * Categorize disconnection reasons for analytics
     */
    categorizeDisconnectionReason(reason) {
        const categories = {
            'client namespace disconnect': 'intentional',
            'server namespace disconnect': 'server_initiated',
            'ping timeout': 'network_timeout',
            'transport close': 'network_issue',
            'transport error': 'network_error',
            'forced close': 'server_forced',
            'close': 'connection_closed'
        };

        return categories[reason] || 'unknown';
    }

    /**
     * Get connection statistics for monitoring
     */
    getConnectionStats() {
        const stats = {
            activeSessions: this.sessionMetrics.size,
            totalDisconnections: 0,
            totalReconnections: 0,
            averageSessionDuration: 0,
            networkIssuesCount: 0,
            reasonBreakdown: {},
            healthScore: 0
        };

        let totalDuration = 0;
        let sessionsWithDuration = 0;

        for (const [socketId, metrics] of this.sessionMetrics.entries()) {
            stats.totalDisconnections += metrics.disconnections;
            stats.totalReconnections += metrics.reconnections;
            
            if (metrics.lastDisconnection) {
                const reason = metrics.lastDisconnection.reason;
                const category = this.categorizeDisconnectionReason(reason);
                stats.reasonBreakdown[category] = (stats.reasonBreakdown[category] || 0) + 1;
            }

            if (metrics.networkIssues) {
                stats.networkIssuesCount += metrics.networkIssues.length;
            }

            const sessionDuration = Date.now() - metrics.timestamp;
            totalDuration += sessionDuration;
            sessionsWithDuration++;
        }

        if (sessionsWithDuration > 0) {
            stats.averageSessionDuration = Math.round(totalDuration / sessionsWithDuration);
        }

        // Calculate health score (0-100)
        const reconnectionRate = stats.totalDisconnections > 0 ? stats.totalReconnections / stats.totalDisconnections : 1;
        const networkHealthScore = Math.max(0, 100 - (stats.networkIssuesCount * 5));
        stats.healthScore = Math.round((reconnectionRate * 50) + (networkHealthScore * 0.5));

        return stats;
    }

    /**
     * Get detailed metrics for a specific session
     */
    getSessionMetrics(socketId) {
        return this.sessionMetrics.get(socketId) || null;
    }

    /**
     * Clean up old session metrics
     */
    cleanupOldMetrics(maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
        const cutoffTime = Date.now() - maxAge;
        let cleanedCount = 0;

        for (const [socketId, metrics] of this.sessionMetrics.entries()) {
            if (metrics.timestamp < cutoffTime) {
                this.sessionMetrics.delete(socketId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info(`🧹 Cleaned up ${cleanedCount} old connection metrics`);
        }

        return cleanedCount;
    }

    /**
     * Generate connection report
     */
    generateConnectionReport() {
        const stats = this.getConnectionStats();
        const report = {
            timestamp: Date.now(),
            summary: {
                activeSessions: stats.activeSessions,
                healthScore: stats.healthScore,
                reliability: stats.totalDisconnections > 0 ? 
                    Math.round((stats.totalReconnections / stats.totalDisconnections) * 100) + '%' : '100%'
            },
            metrics: stats,
            topIssues: this.getTopConnectionIssues()
        };

        logger.info(`📊 Connection Report - Active: ${report.summary.activeSessions}, Health: ${report.summary.healthScore}/100, Reliability: ${report.summary.reliability}`);
        
        return report;
    }

    /**
     * Get top connection issues for monitoring
     */
    getTopConnectionIssues() {
        const issues = [];
        
        for (const [socketId, metrics] of this.sessionMetrics.entries()) {
            if (metrics.networkIssues && metrics.networkIssues.length > 0) {
                issues.push({
                    socketId: socketId,
                    username: metrics.username,
                    issueCount: metrics.networkIssues.length,
                    lastIssue: metrics.networkIssues[metrics.networkIssues.length - 1]
                });
            }
        }

        return issues.sort((a, b) => b.issueCount - a.issueCount).slice(0, 5);
    }

    /**
     * Clear all metrics
     */
    clear() {
        this.sessionMetrics.clear();
        logger.info('🧹 Connection metrics cleared');
    }
}

// Create singleton instance
const connectionLogger = new ConnectionLogger();

module.exports = connectionLogger;