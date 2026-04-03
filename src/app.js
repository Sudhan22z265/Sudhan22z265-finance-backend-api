const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { generalRateLimit, authRateLimit, dashboardRateLimit } = require('./middleware/rateLimit');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const recordRoutes = require('./routes/records');
const dashboardRoutes = require('./routes/dashboard');

/**
 * Express Application Setup
 * 
 * Configures middleware, routes, and error handling for the Finance Backend API.
 */

// Initialize Express app
const app = express();

// Middleware configuration
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '10mb' })); // Parse JSON request bodies with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded request bodies with size limit

// Request body validation middleware
app.use((req, res, next) => {
    // Content-Type validation for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) &&
        req.path.includes('/api/') &&
        !req.path.includes('/health')) {

        const contentType = req.get('Content-Type');
        if (contentType && !contentType.includes('application/json') && !contentType.includes('application/x-www-form-urlencoded')) {
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: 'Content-Type must be application/json or application/x-www-form-urlencoded'
            });
        }
    }

    // Check for empty body on POST/PUT/PATCH requests that require data
    if (['POST', 'PUT', 'PATCH'].includes(req.method) &&
        req.path.includes('/api/') &&
        !req.path.includes('/health') &&
        (!req.body || Object.keys(req.body).length === 0)) {

        // Allow empty body for specific endpoints that don't require it
        const allowEmptyBody = [
            '/restore'
        ].some(path => req.path.includes(path) && req.method === 'POST');

        if (!allowEmptyBody) {
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                message: 'Request body is required for this operation'
            });
        }
    }

    next();
});

// Request logging middleware
app.use((req, res, next) => {
    logger.info({
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });
    next();
});

// Health check endpoint
app.get('/health', generalRateLimit, (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Database setup endpoint (for manual migration trigger)
app.post('/setup-database', async (req, res) => {
    try {
        const { execSync } = require('child_process');
        logger.info('Manual database setup triggered');

        execSync('npm run migrate:latest', { stdio: 'inherit' });

        res.status(200).json({
            status: 'success',
            message: 'Database migrations completed successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Manual database setup failed:', error);
        res.status(500).json({
            status: 'error',
            message: 'Database setup failed',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API Routes with rate limiting
app.use('/api/auth', generalRateLimit, authRoutes);
app.use('/api/users', generalRateLimit, userRoutes);
app.use('/api/records', generalRateLimit, recordRoutes);
app.use('/api/dashboard', generalRateLimit, dashboardRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
