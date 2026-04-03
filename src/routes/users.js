const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorization');
const {
    validateCreateUser,
    validateUpdateRole,
    validateUpdateStatus,
    validateUserId,
    handleValidationErrors
} = require('../middleware/validator');

/**
 * User Management Routes
 * 
 * All routes require authentication and admin role.
 * Handles CRUD operations for user management.
 */

// Apply authentication and admin authorization to all routes
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Admin only
 */
router.post(
    '/',
    validateCreateUser,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { username, email, role, password } = req.body;

        const userData = {
            username,
            email,
            role,
            passwordHash: password ? await require('../services/authService').hashPassword(password) : null
        };

        const user = await userService.createUser(userData);

        res.status(201).json(user);
    })
);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Admin only
 */
router.get(
    '/',
    asyncHandler(async (req, res) => {
        const users = await userService.getAllUsers();

        res.status(200).json({
            users,
            count: users.length
        });
    })
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Admin only
 */
router.get(
    '/:id',
    validateUserId,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const userId = parseInt(req.params.id);

        const user = await userService.getUserById(userId);

        res.status(200).json(user);
    })
);

/**
 * @route   PATCH /api/users/:id/role
 * @desc    Update user role
 * @access  Admin only
 */
router.patch(
    '/:id/role',
    validateUpdateRole,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const userId = parseInt(req.params.id);
        const { role } = req.body;

        const user = await userService.updateUserRole(userId, role);

        res.status(200).json(user);
    })
);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Update user active status
 * @access  Admin only
 */
router.patch(
    '/:id/status',
    validateUpdateStatus,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const userId = parseInt(req.params.id);
        const { isActive } = req.body;

        const user = await userService.updateUserStatus(userId, isActive);

        res.status(200).json(user);
    })
);

module.exports = router;
