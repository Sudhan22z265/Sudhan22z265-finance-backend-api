const authService = require('../services/authService');
const { AuthenticationError } = require('../utils/errors');

/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and attaches user information to the request object.
 * Returns 401 if token is missing, invalid, or expired.
 */
const authenticateToken = (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            throw new AuthenticationError('No authentication token provided');
        }

        // Verify token
        const decoded = authService.verifyToken(token);

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            isActive: true // Token wouldn't be issued for inactive users
        };

        next();
    } catch (error) {
        // Pass authentication errors to error handler
        if (error instanceof AuthenticationError) {
            next(error);
        } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            next(new AuthenticationError(error.message));
        } else {
            next(error);
        }
    }
};

/**
 * Optional Authentication Middleware
 * 
 * Similar to authenticateToken but doesn't fail if no token is provided.
 * Useful for endpoints that work differently for authenticated vs anonymous users.
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = authService.verifyToken(token);
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                email: decoded.email,
                role: decoded.role,
                isActive: true
            };
        }

        next();
    } catch (error) {
        // For optional auth, continue without user info if token is invalid
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
};
