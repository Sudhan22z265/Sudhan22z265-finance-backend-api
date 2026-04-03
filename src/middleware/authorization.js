const { AuthenticationError, AuthorizationError } = require('../utils/errors');

/**
 * Role-Based Authorization Middleware
 * 
 * Factory function that creates middleware to check if the authenticated user
 * has one of the allowed roles. Also checks if the user account is active.
 * 
 * Usage:
 *   router.get('/admin-only', authenticateToken, requireRole('admin'), handler);
 *   router.get('/analyst-or-admin', authenticateToken, requireRole('analyst', 'admin'), handler);
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            // Check if user is authenticated
            if (!req.user) {
                throw new AuthenticationError('Authentication required');
            }

            // Check if user account is active
            if (req.user.isActive === false) {
                throw new AuthorizationError('User account is inactive');
            }

            // Check if user role is in the allowed roles
            if (!allowedRoles.includes(req.user.role)) {
                throw new AuthorizationError(
                    `Access denied. Required role: ${allowedRoles.join(' or ')}`
                );
            }

            // User is authorized, proceed to next middleware
            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Check if user is admin
 * Convenience middleware for admin-only routes
 */
const requireAdmin = requireRole('admin');

/**
 * Check if user is analyst or admin
 * Convenience middleware for analyst+ routes
 */
const requireAnalyst = requireRole('analyst', 'admin');

/**
 * Check if user is authenticated (any role)
 * Convenience middleware for authenticated routes
 */
const requireAuth = requireRole('viewer', 'analyst', 'admin');

module.exports = {
    requireRole,
    requireAdmin,
    requireAnalyst,
    requireAuth
};
