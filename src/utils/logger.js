const winston = require('winston');
const path = require('path');

/**
 * Logger Utility using Winston
 * 
 * Provides structured logging with different log levels and transports.
 * Ensures sensitive data is not logged.
 */

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;

        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            // Filter out sensitive data
            const filteredMeta = filterSensitiveData(meta);
            msg += ` ${JSON.stringify(filteredMeta)}`;
        }

        return msg;
    })
);

// Filter sensitive data from logs
const filterSensitiveData = (obj) => {
    const sensitiveKeys = ['password', 'passwordHash', 'token', 'authorization', 'secret'];
    const filtered = { ...obj };

    for (const key in filtered) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
            filtered[key] = '[REDACTED]';
        }

        // Recursively filter nested objects
        if (typeof filtered[key] === 'object' && filtered[key] !== null) {
            filtered[key] = filterSensitiveData(filtered[key]);
        }
    }

    return filtered;
};

// Create transports
const transports = [];

// Console transport (always enabled)
transports.push(
    new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
        level: process.env.LOG_LEVEL || 'info'
    })
);

// File transports (only in production or if LOG_TO_FILE is set)
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
    // Error log file
    transports.push(
        new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );

    // Combined log file
    transports.push(
        new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            format: logFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );
}

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports,
    exitOnError: false
});

// Create logs directory if it doesn't exist
if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
    const fs = require('fs');
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
}

module.exports = logger;
