const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { validateRegister, validateLogin, handleValidationErrors } = require('../middleware/validator');

/**
 * Authentication Routes
 * 
 * Handles user registration and login.
 * These endpoints are public (no authentication required).
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
    '/register',
    validateRegister,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { username, email, password, role } = req.body;

        const result = await authService.register(username, email, password, role);

        res.status(201).json(result);
    })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
router.post(
    '/login',
    validateLogin,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { username, password } = req.body;

        const result = await authService.login(username, password);

        res.status(200).json(result);
    })
);

module.exports = router;
