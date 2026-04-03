const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Validation Middleware
 * 
 * Provides validation rules for all API endpoints using express-validator.
 * Includes sanitization to prevent XSS attacks.
 */

/**
 * Handle validation errors
 * Extracts validation errors and throws ValidationError
 */
const handleValidationErrors = (req, res, next) => {
    // Check for null values in request body
    if (req.body && typeof req.body === 'object') {
        for (const [key, value] of Object.entries(req.body)) {
            if (value === null) {
                return res.status(400).json({
                    error: 'VALIDATION_ERROR',
                    message: 'Null values are not allowed',
                    details: [{
                        field: key,
                        message: 'Field cannot be null',
                        value: null
                    }]
                });
            }
        }
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const details = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg,
            value: err.value
        }));

        throw new ValidationError('Validation failed', details);
    }

    next();
};

// ============================================================================
// USER VALIDATION RULES
// ============================================================================

/**
 * Validation rules for creating a user
 */
const validateCreateUser = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 255 }).withMessage('Username must be between 3 and 255 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['viewer', 'analyst', 'admin']).withMessage('Role must be viewer, analyst, or admin'),

    body('password')
        .optional()
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
];

/**
 * Validation rules for user registration
 */
const validateRegister = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 255 }).withMessage('Username must be between 3 and 255 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),

    body('role')
        .optional()
        .isIn(['viewer', 'analyst', 'admin']).withMessage('Role must be viewer, analyst, or admin')
];

/**
 * Validation rules for user login
 */
const validateLogin = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required'),

    body('password')
        .notEmpty().withMessage('Password is required')
];

/**
 * Validation rules for updating user role
 */
const validateUpdateRole = [
    param('id')
        .isInt({ min: 1 }).withMessage('User ID must be a positive integer'),

    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['viewer', 'analyst', 'admin']).withMessage('Role must be viewer, analyst, or admin')
];

/**
 * Validation rules for updating user status
 */
const validateUpdateStatus = [
    param('id')
        .isInt({ min: 1 }).withMessage('User ID must be a positive integer'),

    body('isActive')
        .notEmpty().withMessage('isActive is required')
        .isBoolean().withMessage('isActive must be a boolean value')
];

/**
 * Validation rules for user ID parameter
 */
const validateUserId = [
    param('id')
        .isInt({ min: 1 }).withMessage('User ID must be a positive integer')
];

// ============================================================================
// FINANCIAL RECORD VALIDATION RULES
// ============================================================================

/**
 * Validation rules for creating a financial record
 */
const validateCreateRecord = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number greater than 0'),

    body('transactionType')
        .notEmpty().withMessage('Transaction type is required')
        .isIn(['income', 'expense']).withMessage('Transaction type must be income or expense'),

    body('category')
        .trim()
        .notEmpty().withMessage('Category is required')
        .isLength({ min: 1, max: 255 }).withMessage('Category must be between 1 and 255 characters'),

    body('date')
        .notEmpty().withMessage('Date is required')
        .isISO8601().withMessage('Date must be in valid ISO 8601 format (YYYY-MM-DD)'),

    body('notes')
        .optional()
        .trim()
        .escape() // Sanitize to prevent XSS
        .isLength({ max: 5000 }).withMessage('Notes must not exceed 5000 characters')
        .custom((value) => {
            // Additional XSS prevention - reject script tags and javascript: protocols
            if (!value) return true; // Skip validation for empty values
            const dangerousPatterns = [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /<iframe/gi,
                /<object/gi,
                /<embed/gi
            ];

            for (const pattern of dangerousPatterns) {
                if (pattern.test(value)) {
                    throw new Error('Invalid characters detected in notes field');
                }
            }
            return true;
        })
];

/**
 * Validation rules for updating a financial record
 */
const validateUpdateRecord = [
    param('id')
        .isInt({ min: 1 }).withMessage('Record ID must be a positive integer'),

    body('amount')
        .optional()
        .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number greater than 0'),

    body('transactionType')
        .optional()
        .isIn(['income', 'expense']).withMessage('Transaction type must be income or expense'),

    body('category')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 }).withMessage('Category must be between 1 and 255 characters'),

    body('date')
        .optional()
        .isISO8601().withMessage('Date must be in valid ISO 8601 format (YYYY-MM-DD)'),

    body('notes')
        .optional()
        .trim()
        .escape() // Sanitize to prevent XSS
        .isLength({ max: 5000 }).withMessage('Notes must not exceed 5000 characters')
        .custom((value) => {
            // Additional XSS prevention - reject script tags and javascript: protocols
            if (!value) return true; // Skip validation for empty values
            const dangerousPatterns = [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /<iframe/gi,
                /<object/gi,
                /<embed/gi
            ];

            for (const pattern of dangerousPatterns) {
                if (pattern.test(value)) {
                    throw new Error('Invalid characters detected in notes field');
                }
            }
            return true;
        })
];

/**
 * Validation rules for record ID parameter
 */
const validateRecordId = [
    param('id')
        .isInt({ min: 1 }).withMessage('Record ID must be a positive integer')
];

/**
 * Validation rules for record filtering query parameters
 */
const validateRecordFilters = [
    query('dateFrom')
        .optional()
        .isISO8601().withMessage('dateFrom must be in valid ISO 8601 format (YYYY-MM-DD)'),

    query('dateTo')
        .optional()
        .isISO8601().withMessage('dateTo must be in valid ISO 8601 format (YYYY-MM-DD)'),

    query('category')
        .optional()
        .trim(),

    query('transactionType')
        .optional()
        .isIn(['income', 'expense']).withMessage('Transaction type must be income or expense'),

    query('search')
        .optional()
        .trim(),

    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer')
        .toInt(),

    query('pageSize')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100')
        .toInt()
];

// ============================================================================
// DASHBOARD VALIDATION RULES
// ============================================================================

/**
 * Validation rules for dashboard query parameters
 */
const validateDashboardFilters = [
    query('dateFrom')
        .optional()
        .isISO8601().withMessage('dateFrom must be in valid ISO 8601 format (YYYY-MM-DD)'),

    query('dateTo')
        .optional()
        .isISO8601().withMessage('dateTo must be in valid ISO 8601 format (YYYY-MM-DD)'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
        .toInt()
];

module.exports = {
    handleValidationErrors,
    // User validations
    validateCreateUser,
    validateRegister,
    validateLogin,
    validateUpdateRole,
    validateUpdateStatus,
    validateUserId,
    // Record validations
    validateCreateRecord,
    validateUpdateRecord,
    validateRecordId,
    validateRecordFilters,
    // Dashboard validations
    validateDashboardFilters
};
