const sessionStore = require('../stores/SessionStore');
const logger = require('./logger');

/**
 * Session persistence utilities for saving and loading session data
 */
class SessionPersistence {
    /**
     * Load session data by session ID
     * @param {string} sessionId - The session ID to load
     * @returns {Object|null} Session data or null if not found
     */
    static loadSessionData(sessionId) {
        try {
            const session = sessionStore.getSession(sessionId);
            if (session && sessionStore.isSessionValid(sessionId)) {
                logger.info(`Session data loaded: ${sessionId} for player ${session.playerName}`);
                return {
                    sessionId: session.sessionId,
                    socketId: session.socketId,
                    playerId: session.playerId,
                    gameId: session.gameId,
                    playerName: session.playerName,
                    authId: session.authId,
                    lastActivity: session.lastActivity,
                    createdAt: session.createdAt,
                    reconnectionCount: session.reconnectionCount || 0,
                    isValid: session.isValid
                };
            }
            return null;
        } catch (error) {
            logger.error(`Error loading session data for ${sessionId}:`, error);
            return null;
        }
    }

    /**
     * Save session data
     * @param {string} sessionId - The session ID to save
     * @param {Object} data - The session data to save
     * @returns {boolean} True if saved successfully, false otherwise
     */
    static saveSessionData(sessionId, data) {
        try {
            const session = sessionStore.getSession(sessionId);
            if (session) {
                // Update existing session
                return sessionStore.updateSession(sessionId, data);
            } else {
                logger.warn(`Cannot save data for non-existent session: ${sessionId}`);
                return false;
            }
        } catch (error) {
            logger.error(`Error saving session data for ${sessionId}:`, error);
            return false;
        }
    }

    /**
     * Clear session data by session ID
     * @param {string} sessionId - The session ID to clear
     * @returns {boolean} True if cleared successfully, false otherwise
     */
    static clearSessionData(sessionId) {
        try {
            const session = sessionStore.removeSession(sessionId);
            if (session) {
                logger.info(`Session data cleared: ${sessionId} for player ${session.playerName}`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error(`Error clearing session data for ${sessionId}:`, error);
            return false;
        }
    }

    /**
     * Check if session data exists and is valid
     * @param {string} sessionId - The session ID to check
     * @returns {boolean} True if session exists and is valid
     */
    static hasValidSession(sessionId) {
        try {
            return sessionStore.isSessionValid(sessionId);
        } catch (error) {
            logger.error(`Error checking session validity for ${sessionId}:`, error);
            return false;
        }
    }

    /**
     * Get all active sessions (for admin/debugging purposes)
     * @returns {Array} Array of active session data
     */
    static getAllActiveSessions() {
        try {
            return sessionStore.getAllSessions();
        } catch (error) {
            logger.error('Error getting all active sessions:', error);
            return [];
        }
    }

    /**
     * Get session statistics
     * @returns {Object} Session store statistics
     */
    static getSessionStats() {
        try {
            return sessionStore.getStats();
        } catch (error) {
            logger.error('Error getting session stats:', error);
            return {
                total: 0,
                active: 0,
                expired: 0,
                games: {},
                sessionTimeout: 0,
                cleanupInterval: 0
            };
        }
    }

    /**
     * Force cleanup of expired sessions
     * @returns {boolean} True if cleanup completed successfully
     */
    static forceCleanup() {
        try {
            sessionStore.cleanupExpiredSessions();
            logger.info('Forced session cleanup completed');
            return true;
        } catch (error) {
            logger.error('Error during forced session cleanup:', error);
            return false;
        }
    }

    /**
     * Get reconnection data for a player
     * @param {string} identifier - Player ID, auth ID, or session ID
     * @param {string} gameId - Optional game ID for guest users
     * @returns {Object} Reconnection data with success flag
     */
    static getReconnectionData(identifier, gameId = null) {
        try {
            return sessionStore.getReconnectionData(identifier, gameId);
        } catch (error) {
            logger.error(`Error getting reconnection data for ${identifier}:`, error);
            return {
                success: false,
                error: 'Internal error retrieving reconnection data'
            };
        }
    }

    /**
     * Migrate session from one socket to another (for reconnection)
     * @param {string} sessionId - The session ID to migrate
     * @param {string} newSocketId - The new socket ID
     * @returns {string|null} The updated session ID or null if failed
     */
    static migrateSession(sessionId, newSocketId) {
        try {
            return sessionStore.updateSessionSocket(sessionId, newSocketId);
        } catch (error) {
            logger.error(`Error migrating session ${sessionId} to socket ${newSocketId}:`, error);
            return null;
        }
    }
}

module.exports = SessionPersistence;