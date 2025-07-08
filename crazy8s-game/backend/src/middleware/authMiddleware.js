const authMiddleware = (req, res, next) => {
    // In a real application, this would verify a token (e.g., JWT)
    // For now, we'll just check for a playerId in the request body or params
    const playerId = req.body.playerId || req.params.playerId;

    if (playerId) {
        req.user = { id: playerId }; // Attach user info to request
        next();
    } else {
        res.status(401).json({ success: false, error: 'Unauthorized: Player ID missing' });
    }
};

module.exports = authMiddleware;