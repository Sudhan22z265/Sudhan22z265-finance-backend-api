const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting to prevent abuse and ensure fair usage.
 * Configurable limits for different endpoint groups.
 */

// Configuration from environment variables
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000; // 1000 requests per window (increased for testing)

/**
 * General API rate limiter
 * Applied to all API routes
 */
const generalRateLimit = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX_REQUESTS,
    message: {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: true, // Also include the `X-RateLimit-*` headers for compatibility
    handler: (req, res) => {
        logger.warn({
            message: 'Rate limit exceeded',
            ip: req.ip,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        // Set additional rate limiting headers
        res.set({
            'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS,
            'X-RateLimit-Remaining': 0,
            'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT_WINDOW_MS).toISOString(),
            'Retry-After': Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
        });

        res.status(429).json({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
        });
    }
});

/**
 * Strict rate limiter for authentication endpoints
 * More restrictive to prevent brute force attacks
 */
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Increased from 10 to 100 for testing
    message: {
        error: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later.',
        retryAfter: 900 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn({
            message: 'Authentication rate limit exceeded',
            ip: req.ip,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        res.status(429).json({
            error: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Too many authentication attempts, please try again later.',
            retryAfter: 900
        });
    }
});

/**
 * Lenient rate limiter for dashboard/read-only endpoints
 * Higher limits for data retrieval operations
 */
const dashboardRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Higher limit for dashboard endpoints (increased for testing)
    message: {
        error: 'DASHBOARD_RATE_LIMIT_EXCEEDED',
        message: 'Too many dashboard requests, please try again later.',
        retryAfter: 900
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn({
            message: 'Dashboard rate limit exceeded',
            ip: req.ip,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        res.status(429).json({
            error: 'DASHBOARD_RATE_LIMIT_EXCEEDED',
            message: 'Too many dashboard requests, please try again later.',
            retryAfter: 900
        });
    }
});

/**
 * Create a custom rate limiter with specific configuration
 * @param {Object} options - Rate limit options
 * @returns {Function} Rate limit middleware
 */
const createRateLimit = (options = {}) => {
    const defaultOptions = {
        windowMs: RATE_LIMIT_WINDOW_MS,
        max: RATE_LIMIT_MAX_REQUESTS,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn({
                message: 'Custom rate limit exceeded',
                ip: req.ip,
                path: req.path,
                method: req.method,
                limit: options.max || RATE_LIMIT_MAX_REQUESTS,
                timestamp: new Date().toISOString()
            });

            res.status(429).json({
                error: 'RATE_LIMIT_EXCEEDED',
                message: options.message || 'Too many requests, please try again later.',
                retryAfter: Math.ceil((options.windowMs || RATE_LIMIT_WINDOW_MS) / 1000)
            });
        }
    };

    return rateLimit({ ...defaultOptions, ...options });
};

module.exports = {
    generalRateLimit,
    authRateLimit,
    dashboardRateLimit,
    createRateLimit
};