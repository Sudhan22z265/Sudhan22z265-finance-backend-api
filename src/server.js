require('dotenv').config();
const app = require('./app');
const { db } = require('./config/database');
const logger = require('./utils/logger');

/**
 * Server Entry Point
 * 
 * Initializes database connection and starts the Express server.
 * Handles graceful shutdown on process termination.
 */

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Server instance
let server;

/**
 * Start the server
 */
async function startServer() {
    try {
        // Test database connection
        logger.info('Testing database connection...');
        await db.raw('SELECT 1');
        logger.info('Database connection successful');

        // Check if migrations need to be run
        try {
            await db.raw('SELECT * FROM knex_migrations LIMIT 1');
            logger.info('Database tables already exist');
        } catch (error) {
            // Tables don't exist, run migrations
            logger.info('Database tables not found, running migrations...');
            const { execSync } = require('child_process');
            execSync('npm run migrate:latest', { stdio: 'inherit' });
            logger.info('Database migrations completed successfully');
        }

        // Start Express server
        server = app.listen(PORT, () => {
            logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
            logger.info(`Health check available at http://localhost:${PORT}/health`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    if (server) {
        server.close(() => {
            logger.info('HTTP server closed');
        });
    }

    try {
        // Close database connection
        await db.destroy();
        logger.info('Database connection closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
}

// Handle process termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();
