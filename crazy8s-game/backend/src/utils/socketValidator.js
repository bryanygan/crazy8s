const logger = require('./logger');

class SocketValidator {
    constructor(sessionStore, gameStore = null) {
        this.sessionStore = sessionStore;
        this.gameStore = gameStore;
    }

    /**
     * Validate socket state before critical operations
     */
    validateSocketState(socket, operation = 'unknown') {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            socketId: socket?.id || 'undefined'
        };

        // Basic socket validation
        if (!socket) {
            validation.isValid = false;
            validation.errors.push('Socket is null or undefined');
            return validation;
        }

        if (socket.disconnected) {
            validation.isValid = false;
            validation.errors.push('Socket is disconnected');
        }

        if (!socket.id) {
            validation.isValid = false;
            validation.errors.push('Socket has no ID');
        }

        // Authentication state validation
        if (socket.isAuthenticated === undefined) {
            validation.warnings.push('Socket authentication state is undefined');
        }

        if (socket.isAuthenticated && !socket.user) {
            validation.warnings.push('Socket marked as authenticated but has no user object');
        }

        if (socket.isAuthenticated && !socket.userId) {
            validation.warnings.push('Socket marked as authenticated but has no userId');
        }

        // Game context validation
        if (socket.gameId && !socket.playerName) {
            validation.warnings.push('Socket has gameId but no playerName');
        }

        if (socket.playerName && !socket.gameId) {
            validation.warnings.push('Socket has playerName but no gameId');
        }

        // Log validation results if there are issues
        if (!validation.isValid) {
            logger.error(`Socket validation failed for ${operation}:`, {
                socketId: validation.socketId,
                errors: validation.errors,
                warnings: validation.warnings
            });
        } else if (validation.warnings.length > 0) {
            logger.warn(`Socket validation warnings for ${operation}:`, {
                socketId: validation.socketId,
                warnings: validation.warnings
            });
        }

        return validation;
    }

    /**
     * Validate session consistency
     */
    validateSessionConsistency(socket, session, operation = 'unknown') {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            canProceed: true
        };

        if (!socket || !session) {
            validation.isValid = false;
            validation.canProceed = false;
            validation.errors.push('Socket or session is missing');
            return validation;
        }

        // Check if session is marked as valid
        if (!session.isValid) {
            validation.isValid = false;
            validation.canProceed = false;
            validation.errors.push('Session is marked as invalid');
        }

        // Check session timeout
        if (!this.sessionStore.isSessionValid(socket.id)) {
            validation.isValid = false;
            validation.canProceed = false;
            validation.errors.push('Session has expired');
        }

        // Check authentication consistency
        if (socket.isAuthenticated && socket.userId && session.authId !== socket.userId) {
            validation.warnings.push('Socket userId does not match session authId');
        }

        // Check game context consistency
        if (socket.gameId && session.gameId !== socket.gameId) {
            validation.warnings.push('Socket gameId does not match session gameId');
        }

        if (socket.playerName && session.playerName !== socket.playerName) {
            validation.warnings.push('Socket playerName does not match session playerName');
        }

        // Log validation results
        if (!validation.isValid) {
            logger.error(`Session consistency validation failed for ${operation}:`, {
                socketId: socket.id,
                sessionId: session.sessionId,
                errors: validation.errors,
                warnings: validation.warnings
            });
        } else if (validation.warnings.length > 0) {
            logger.warn(`Session consistency warnings for ${operation}:`, {
                socketId: socket.id,
                sessionId: session.sessionId,
                warnings: validation.warnings
            });
        }

        return validation;
    }

    /**
     * Validate reconnection attempt data
     */
    validateReconnectionData(data, socket) {
        const validation = {
            isValid: true,
            errors: [],
            sanitizedData: {}
        };

        if (!data || typeof data !== 'object') {
            validation.isValid = false;
            validation.errors.push('Reconnection data is missing or invalid');
            return validation;
        }

        // Validate gameId
        if (!data.gameId || typeof data.gameId !== 'string') {
            validation.isValid = false;
            validation.errors.push('gameId is required and must be a string');
        } else {
            validation.sanitizedData.gameId = data.gameId.trim();
        }

        // For manual reconnection, validate playerName
        if (data.playerName !== undefined) {
            if (!data.playerName || typeof data.playerName !== 'string') {
                validation.isValid = false;
                validation.errors.push('playerName must be a non-empty string');
            } else {
                validation.sanitizedData.playerName = data.playerName.trim();
            }
        }

        // Validate consistency with socket state
        if (socket.isAuthenticated && socket.user && data.playerName) {
            const expectedName = socket.user.profile?.displayName || socket.user.username;
            if (data.playerName !== expectedName) {
                validation.errors.push(`playerName mismatch: expected ${expectedName}, got ${data.playerName}`);
            }
        }

        if (!validation.isValid) {
            logger.warn(`Reconnection data validation failed:`, {
                socketId: socket?.id,
                errors: validation.errors,
                providedData: data
            });
        }

        return validation;
    }

    /**
     * Validate game state before restoration
     */
    validateGameStateForRestoration(gameId, playerId, playerName) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            canRestore: true
        };

        if (!gameId || !playerId || !playerName) {
            validation.isValid = false;
            validation.canRestore = false;
            validation.errors.push('Missing required parameters for game state restoration');
            return validation;
        }

        // If gameStore is available, validate game exists and is in valid state
        if (this.gameStore) {
            const game = this.gameStore.findById(gameId);
            if (!game) {
                validation.isValid = false;
                validation.canRestore = false;
                validation.errors.push('Game not found');
            } else {
                // Check if game is in a state that allows reconnection
                if (game.gameState === 'finished') {
                    validation.canRestore = false;
                    validation.warnings.push('Game has finished - reconnection not useful');
                }

                // Check if player was actually in the game
                const player = game.players.find(p => p.name === playerName);
                if (!player) {
                    validation.isValid = false;
                    validation.canRestore = false;
                    validation.errors.push('Player was not found in the game');
                }
            }
        }

        if (!validation.isValid) {
            logger.error(`Game state validation failed for restoration:`, {
                gameId,
                playerId,
                playerName,
                errors: validation.errors,
                warnings: validation.warnings
            });
        }

        return validation;
    }

    /**
     * Create a safe error response for socket emissions
     */
    createSafeErrorResponse(error, code = 'UNKNOWN_ERROR', canRetry = false) {
        const response = {
            error: typeof error === 'string' ? error : error.message || 'Unknown error occurred',
            code: code,
            timestamp: Date.now(),
            canRetry: canRetry
        };

        // Add retry delay if retry is recommended
        if (canRetry) {
            response.retryDelay = this._calculateRetryDelay(code);
        }

        return response;
    }

    /**
     * Calculate appropriate retry delay based on error code
     */
    _calculateRetryDelay(code) {
        const delays = {
            'INTERNAL_ERROR': 5000,
            'SESSION_UPDATE_FAILED': 3000,
            'CONNECTION_ERROR': 2000,
            'RATE_LIMITED': 10000
        };

        return delays[code] || 3000;
    }

    /**
     * Sanitize socket data for logging (remove sensitive information)
     */
    sanitizeSocketForLogging(socket) {
        if (!socket) return null;

        return {
            id: socket.id,
            connected: socket.connected,
            isAuthenticated: socket.isAuthenticated,
            userId: socket.userId,
            username: socket.user?.username,
            gameId: socket.gameId,
            playerName: socket.playerName,
            rooms: Array.from(socket.rooms || [])
        };
    }
}

module.exports = SocketValidator;