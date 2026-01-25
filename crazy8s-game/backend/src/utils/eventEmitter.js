const logger = require('./logger');

class GameEventEmitter {
    constructor(io) {
        this.io = io;
    }

    /**
     * Emit player disconnection events to all clients in the game
     */
    emitPlayerDisconnected(gameId, playerInfo, disconnectionDetails) {
        const event = {
            type: 'player_disconnected',
            gameId,
            player: {
                id: playerInfo.playerId,
                name: playerInfo.playerName,
                isAuthenticated: playerInfo.isAuthenticated || false
            },
            disconnection: {
                reason: disconnectionDetails.reason,
                timestamp: Date.now(),
                sessionPreserved: disconnectionDetails.sessionPreserved || true,
                gracePeriod: disconnectionDetails.gracePeriod || 30000 // 30 seconds default
            },
            gameState: disconnectionDetails.gameState
        };

        this.io.to(gameId).emit('player_disconnected', event);
        logger.info(`Emitted player_disconnected event for ${playerInfo.playerName} in game ${gameId}`);
    }

    /**
     * Emit player reconnection events to all clients in the game
     */
    emitPlayerReconnected(gameId, playerInfo, reconnectionDetails) {
        const event = {
            type: 'player_reconnected',
            gameId,
            player: {
                id: playerInfo.playerId,
                name: playerInfo.playerName,
                isAuthenticated: playerInfo.isAuthenticated || false
            },
            reconnection: {
                timestamp: Date.now(),
                reconnectionCount: reconnectionDetails.reconnectionCount || 0,
                wasQuickReconnect: reconnectionDetails.isQuickReconnect || false,
                downtime: reconnectionDetails.downtime || 0,
                specialState: reconnectionDetails.specialState || null
            },
            gameState: reconnectionDetails.gameState
        };

        this.io.to(gameId).emit('player_reconnected', event);
        logger.info(`Emitted player_reconnected event for ${playerInfo.playerName} in game ${gameId}`);
    }

    /**
     * Emit game state restoration event to a specific player
     */
    emitGameStateRestored(socket, gameId, restorationDetails) {
        const event = {
            type: 'game_state_restored',
            gameId,
            restoration: {
                timestamp: Date.now(),
                playerHand: restorationDetails.playerHand || [],
                isYourTurn: restorationDetails.isYourTurn || false,
                availableActions: restorationDetails.availableActions || [],
                missedEvents: restorationDetails.missedEvents || [],
                gamePhase: restorationDetails.gamePhase || 'playing'
            },
            gameState: restorationDetails.gameState
        };

        socket.emit('game_state_restored', event);
        logger.info(`Emitted game_state_restored event for player in game ${gameId}`);
    }

    /**
     * Emit session preservation notification
     */
    emitSessionPreserved(socket, sessionInfo) {
        const event = {
            type: 'session_preserved',
            session: {
                gameId: sessionInfo.gameId,
                playerName: sessionInfo.playerName,
                preservedAt: Date.now(),
                expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes from now
                reconnectionAttempts: sessionInfo.reconnectionCount || 0
            },
            message: 'Your session has been preserved. You can reconnect within 30 minutes.'
        };

        socket.emit('session_preserved', event);
        logger.info(`Emitted session_preserved event for ${sessionInfo.playerName}`);
    }

    /**
     * Emit connection quality warning
     */
    emitConnectionWarning(socket, warningDetails) {
        const event = {
            type: 'connection_warning',
            warning: {
                severity: warningDetails.severity || 'medium', // low, medium, high
                message: warningDetails.message,
                timestamp: Date.now(),
                suggestedAction: warningDetails.suggestedAction || 'Check your internet connection'
            }
        };

        socket.emit('connection_warning', event);
        logger.warn(`Emitted connection_warning to ${socket.id}: ${warningDetails.message}`);
    }

    /**
     * Emit automatic reconnection notification to a specific player
     */
    emitAutoReconnectAttempt(socket, attemptDetails) {
        const event = {
            type: 'auto_reconnect_attempt',
            attempt: {
                gameId: attemptDetails.gameId,
                playerName: attemptDetails.playerName,
                attemptNumber: attemptDetails.attemptNumber || 1,
                maxAttempts: attemptDetails.maxAttempts || 3,
                timestamp: Date.now(),
                nextAttemptIn: attemptDetails.nextAttemptDelay || 5000
            }
        };

        socket.emit('auto_reconnect_attempt', event);
        logger.info(`Emitted auto_reconnect_attempt for ${attemptDetails.playerName} (attempt ${attemptDetails.attemptNumber})`);
    }

    /**
     * Emit heartbeat response for connection monitoring
     */
    emitHeartbeatResponse(socket, heartbeatData) {
        const event = {
            type: 'heartbeat_response',
            heartbeat: {
                timestamp: Date.now(),
                latency: heartbeatData.latency || 0,
                connectionStable: heartbeatData.connectionStable !== false
            }
        };

        socket.emit('heartbeat_response', event);
    }

    /**
     * Emit turn timeout warning
     */
    emitTurnTimeoutWarning(gameId, playerInfo, timeoutDetails) {
        const event = {
            type: 'turn_timeout_warning',
            gameId,
            player: {
                id: playerInfo.playerId,
                name: playerInfo.playerName
            },
            timeout: {
                timeRemaining: timeoutDetails.timeRemaining,
                warningThreshold: timeoutDetails.warningThreshold || 10000, // 10 seconds
                timestamp: Date.now()
            }
        };

        this.io.to(gameId).emit('turn_timeout_warning', event);
        logger.info(`Emitted turn_timeout_warning for ${playerInfo.playerName} in game ${gameId}`);
    }

    /**
     * Emit game abandonment warning when all players disconnect
     */
    emitGameAbandonmentWarning(gameId, abandonmentDetails) {
        const event = {
            type: 'game_abandonment_warning',
            gameId,
            abandonment: {
                timestamp: Date.now(),
                timeUntilCleanup: abandonmentDetails.cleanupDelay || 1800000, // 30 minutes
                canBeRestored: true,
                playersCanReconnect: true
            },
            message: 'All players have disconnected. Game will be cleaned up if no one reconnects.'
        };

        this.io.to(gameId).emit('game_abandonment_warning', event);
        logger.warn(`Emitted game_abandonment_warning for game ${gameId}`);
    }

    /**
     * Emit reconnection available notification
     */
    emitReconnectionAvailable(socket, reconnectionInfo) {
        const event = {
            type: 'reconnection_available',
            reconnection: {
                gameId: reconnectionInfo.gameId,
                playerName: reconnectionInfo.playerName,
                lastActivity: reconnectionInfo.lastActivity,
                reconnectionCount: reconnectionInfo.reconnectionCount || 0,
                timestamp: Date.now(),
                autoReconnectAvailable: true
            },
            message: 'You can reconnect to your previous game.'
        };

        socket.emit('reconnection_available', event);
        logger.info(`Emitted reconnection_available for ${reconnectionInfo.playerName}`);
    }

    /**
     * Emit network quality update
     */
    emitNetworkQualityUpdate(socket, qualityData) {
        const event = {
            type: 'network_quality_update',
            quality: {
                status: qualityData.status, // excellent, good, fair, poor
                latency: qualityData.latency,
                packetLoss: qualityData.packetLoss || 0,
                timestamp: Date.now(),
                recommendation: qualityData.recommendation || null
            }
        };

        socket.emit('network_quality_update', event);
    }

    /**
     * Emit bulk events for efficient communication
     */
    emitBulkEvents(socket, events) {
        const bulkEvent = {
            type: 'bulk_events',
            events: events,
            timestamp: Date.now(),
            count: events.length
        };

        socket.emit('bulk_events', bulkEvent);
        logger.debug(`Emitted ${events.length} bulk events to ${socket.id}`);
    }

    /**
     * Set IO instance (for updating the reference)
     */
    setIO(io) {
        this.io = io;
    }
}

// Export both class and singleton instance
module.exports = GameEventEmitter;