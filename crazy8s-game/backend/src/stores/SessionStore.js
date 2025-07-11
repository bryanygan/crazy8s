const logger = require('../utils/logger');

class SessionStore {
    constructor() {
        // Store session data: sessionId -> { playerId, gameId, playerName, lastActivity, authId? }
        this.sessions = new Map();
        // Store player to session mapping: playerId -> sessionId  
        this.playerSessions = new Map();
        // Store authentication to session mapping: authId -> sessionId
        this.authSessions = new Map();
        // Track active operations to prevent race conditions
        this.activeOperations = new Map();
        // Cleanup interval (10 minutes)
        this.cleanupInterval = 10 * 60 * 1000;
        // Session timeout (30 minutes)
        this.sessionTimeout = 30 * 60 * 1000;
        
        this.startCleanupTimer();
    }

    /**
     * Create or update a session for a player with race condition protection
     */
    createSession(sessionId, playerId, gameId, playerName, authId = null) {
        // Prevent concurrent operations on the same player/auth
        const lockKey = authId || playerId;
        if (this.activeOperations.has(lockKey)) {
            logger.warn(`Concurrent session operation blocked for ${lockKey}`);
            return this.getSession(this.activeOperations.get(lockKey));
        }
        
        this.activeOperations.set(lockKey, sessionId);
        
        try {
            const sessionData = {
                playerId,
                gameId,
                playerName,
                authId,
                lastActivity: Date.now(),
                createdAt: Date.now(),
                reconnectionCount: 0,
                isValid: true
            };

            // Remove old session if player was already connected
            const oldSessionId = this.playerSessions.get(playerId);
            if (oldSessionId && oldSessionId !== sessionId) {
                this._safeRemoveSession(oldSessionId);
            }
            
            // Remove old auth session if exists
            if (authId) {
                const oldAuthSessionId = this.authSessions.get(authId);
                if (oldAuthSessionId && oldAuthSessionId !== sessionId) {
                    this._safeRemoveSession(oldAuthSessionId);
                }
            }

            // Store the session
            this.sessions.set(sessionId, sessionData);
            this.playerSessions.set(playerId, sessionId);
            
            if (authId) {
                this.authSessions.set(authId, sessionId);
            }

            logger.info(`Session created: ${sessionId} for player ${playerName} in game ${gameId}`);
            return sessionData;
        } finally {
            this.activeOperations.delete(lockKey);
        }
    }

    /**
     * Get session data by session ID with validation
     */
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session && session.isValid) {
            // Update last activity only for valid sessions
            session.lastActivity = Date.now();
            return session;
        }
        return null;
    }

    /**
     * Get session data by player ID
     */
    getSessionByPlayerId(playerId) {
        const sessionId = this.playerSessions.get(playerId);
        if (sessionId) {
            return this.getSession(sessionId);
        }
        return null;
    }

    /**
     * Get session data by authenticated user ID
     */
    getSessionByAuthId(authId) {
        const sessionId = this.authSessions.get(authId);
        if (sessionId) {
            return this.getSession(sessionId);
        }
        return null;
    }

    /**
     * Find session by player name and game ID (for guest users)
     */
    findSessionByNameAndGame(playerName, gameId) {
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.playerName === playerName && session.gameId === gameId) {
                logger.info(`Found session ${sessionId} for guest player ${playerName} in game ${gameId}`);
                return session;
            }
        }
        return null;
    }

    /**
     * Update session activity timestamp
     */
    updateActivity(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = Date.now();
            return true;
        }
        return false;
    }

    /**
     * Update session with new socket ID (for reconnection) with atomic operations
     */
    updateSessionSocket(sessionId, newSocketId) {
        const lockKey = `update_${sessionId}_${newSocketId}`;
        if (this.activeOperations.has(lockKey)) {
            logger.warn(`Concurrent session update blocked for ${sessionId} -> ${newSocketId}`);
            return null;
        }
        
        this.activeOperations.set(lockKey, true);
        
        try {
            const session = this.sessions.get(sessionId);
            if (!session || !session.isValid) {
                logger.warn(`Cannot update invalid or missing session: ${sessionId}`);
                return null;
            }
            
            session.lastActivity = Date.now();
            session.reconnectionCount = (session.reconnectionCount || 0) + 1;
            
            // Move session to new socket ID if different
            if (newSocketId !== sessionId) {
                // Ensure new socket ID doesn't already have a session
                const existingNewSession = this.sessions.get(newSocketId);
                if (existingNewSession && existingNewSession.isValid) {
                    logger.warn(`Target socket ${newSocketId} already has a valid session`);
                    return null;
                }
                
                // Atomic update: remove old, add new
                this.sessions.delete(sessionId);
                this.sessions.set(newSocketId, session);
                this.playerSessions.set(session.playerId, newSocketId);
                if (session.authId) {
                    this.authSessions.set(session.authId, newSocketId);
                }
                logger.info(`Session moved from ${sessionId} to ${newSocketId} for player ${session.playerName}`);
                return newSocketId;
            }
            
            return sessionId;
        } finally {
            this.activeOperations.delete(lockKey);
        }
    }

    /**
     * Remove a session with proper cleanup
     */
    removeSession(sessionId) {
        return this._safeRemoveSession(sessionId);
    }
    
    /**
     * Internal safe session removal with race condition protection
     */
    _safeRemoveSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        
        // Mark as invalid first to prevent concurrent access
        session.isValid = false;
        
        // Remove from all mappings
        this.sessions.delete(sessionId);
        this.playerSessions.delete(session.playerId);
        if (session.authId) {
            this.authSessions.delete(session.authId);
        }
        
        logger.info(`Session removed: ${sessionId} for player ${session.playerName}`);
        return session;
    }

    /**
     * Check if a session is valid (not expired and not marked invalid)
     */
    isSessionValid(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session || !session.isValid) {
            return false;
        }
        
        const isExpired = (Date.now() - session.lastActivity) > this.sessionTimeout;
        if (isExpired) {
            // Mark as invalid but don't remove yet (cleanup will handle it)
            session.isValid = false;
            return false;
        }
        
        return true;
    }

    /**
     * Get all sessions for a specific game
     */
    getGameSessions(gameId) {
        const gameSessions = [];
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.gameId === gameId) {
                gameSessions.push({ sessionId, ...session });
            }
        }
        return gameSessions;
    }

    /**
     * Get reconnection data for a player/session
     */
    getReconnectionData(identifier, gameId = null) {
        let session = null;
        
        // Try different ways to find the session
        if (identifier.includes('socket_') || identifier.includes('_')) {
            // Looks like a session/socket ID
            session = this.getSession(identifier);
        } else {
            // Could be player name, try to find by name and game
            if (gameId) {
                session = this.findSessionByNameAndGame(identifier, gameId);
            }
        }

        if (session && this.isSessionValid(session.sessionId || identifier)) {
            return {
                success: true,
                gameId: session.gameId,
                playerId: session.playerId,
                playerName: session.playerName,
                authId: session.authId,
                reconnectionCount: session.reconnectionCount || 0,
                lastActivity: session.lastActivity,
                sessionAge: Date.now() - session.createdAt
            };
        }

        return {
            success: false,
            error: 'No valid session found for reconnection'
        };
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [sessionId, session] of this.sessions.entries()) {
            if ((now - session.lastActivity) > this.sessionTimeout) {
                logger.info(`Cleaning up expired session: ${sessionId} for player ${session.playerName}`);
                this.removeSession(sessionId);
                cleanedCount++;
            }
        }

        if (cleanedCount > 0) {
            logger.info(`Cleaned up ${cleanedCount} expired sessions`);
        }
    }

    /**
     * Start automatic cleanup timer
     */
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupExpiredSessions();
        }, this.cleanupInterval);
        
        logger.info('Session store cleanup timer started');
    }

    /**
     * Get store statistics
     */
    getStats() {
        const now = Date.now();
        let expiredCount = 0;
        let activeCount = 0;
        const gameStats = new Map();

        for (const [sessionId, session] of this.sessions.entries()) {
            if ((now - session.lastActivity) > this.sessionTimeout) {
                expiredCount++;
            } else {
                activeCount++;
            }

            // Game statistics
            const gameId = session.gameId;
            if (!gameStats.has(gameId)) {
                gameStats.set(gameId, { total: 0, active: 0, expired: 0 });
            }
            const stats = gameStats.get(gameId);
            stats.total++;
            if ((now - session.lastActivity) > this.sessionTimeout) {
                stats.expired++;
            } else {
                stats.active++;
            }
        }

        return {
            total: this.sessions.size,
            active: activeCount,
            expired: expiredCount,
            games: Object.fromEntries(gameStats),
            sessionTimeout: this.sessionTimeout,
            cleanupInterval: this.cleanupInterval
        };
    }

    /**
     * Clear all sessions (for testing)
     */
    clear() {
        this.sessions.clear();
        this.playerSessions.clear();
        this.authSessions.clear();
        logger.info('Session store cleared');
    }
}

// Create singleton instance
const sessionStore = new SessionStore();

module.exports = sessionStore;