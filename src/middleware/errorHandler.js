const logger = require('../utils/logger');

/**
 * Global Error Handler Middleware
 * 
 * Catches all errors thrown in the application and returns
 * consistent error responses to the client.
 */
const errorHandler = (err, req, res, next) => {
    // Log error details
    logger.error({
        message: err.message,
        statusCode: err.statusCode,
        errorCode: err.errorCode,
        stack: err.stack,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
    });

    // Operational errors (expected errors with known status codes)
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            error: err.errorCode || 'ERROR',
            message: err.message,
            ...(err.details && { details: err.details }),
            ...(err.resource && { resource: err.resource })
        });
    }

    // Database errors
    if (err.code) {
        // PostgreSQL unique constraint violation
        if (err.code === '23505') {
            return res.status(409).json({
                error: 'CONFLICT',
                message: 'Resource already exists'
            });
        }

        // PostgreSQL foreign key violation
        if (err.code === '23503') {
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: 'Invalid reference to related resource'
            });
        }

        // PostgreSQL check constraint violation
        if (err.code === '23514') {
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: 'Data violates database constraints'
            });
        }
    }

    // Objection.js validation errors
    if (err.name === 'ValidationError' && err.statusCode === 400) {
        return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: err.message,
            details: err.data
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'AUTHENTICATION_ERROR',
            message: 'Invalid authentication token'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'AUTHENTICATION_ERROR',
            message: 'Authentication token has expired'
        });
    }

    // Programming or unknown errors (500)
    logger.error('Unexpected error:', err);

    return res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message
    });
};

module.exports = errorHandler;
