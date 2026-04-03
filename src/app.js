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
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

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
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
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
