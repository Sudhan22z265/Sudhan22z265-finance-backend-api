const express = require('express');
const router = express.Router();
const recordService = require('../services/recordService');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin, requireAnalyst } = require('../middleware/authorization');
const {
    validateCreateRecord,
    validateUpdateRecord,
    validateRecordId,
    validateRecordFilters,
    handleValidationErrors
} = require('../middleware/validator');

/**
 * Financial Record Routes
 * 
 * Handles CRUD operations for financial records.
 * - Admin: Full access (create, read, update, delete)
 * - Analyst: Read-only access
 * - Viewer: No access
 */

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * @route   POST /api/records
 * @desc    Create a new financial record
 * @access  Admin only
 */
router.post(
    '/',
    requireAdmin,
    validateCreateRecord,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const { amount, transactionType, category, date, notes } = req.body;
        const userId = req.user.id;

        const record = await recordService.createRecord(
            { amount, transactionType, category, date, notes },
            userId
        );

        res.status(201).json(record);
    })
);

/**
 * @route   GET /api/records
 * @desc    Get all financial records with filtering and pagination
 * @access  Analyst and Admin (Viewer should not access individual records)
 */
router.get(
    '/',
    requireAnalyst, // This correctly restricts Viewer access
    validateRecordFilters,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const filters = {
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            category: req.query.category,
            transactionType: req.query.transactionType,
            searchQuery: req.query.search
        };

        const pagination = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            pageSize: req.query.pageSize ? parseInt(req.query.pageSize) : 20
        };

        const result = await recordService.getRecords(filters, pagination);

        res.status(200).json(result);
    })
);

/**
 * @route   GET /api/records/:id
 * @desc    Get financial record by ID
 * @access  Analyst and Admin (Viewer should not access individual records)
 */
router.get(
    '/:id',
    requireAnalyst, // This correctly restricts Viewer access
    validateRecordId,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const recordId = parseInt(req.params.id);

        const record = await recordService.getRecordById(recordId);

        res.status(200).json(record);
    })
);

/**
 * @route   PUT /api/records/:id
 * @desc    Update a financial record
 * @access  Admin only
 */
router.put(
    '/:id',
    requireAdmin,
    validateUpdateRecord,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const recordId = parseInt(req.params.id);
        const updates = req.body;

        const record = await recordService.updateRecord(recordId, updates);

        res.status(200).json(record);
    })
);

/**
 * @route   DELETE /api/records/:id
 * @desc    Delete a financial record
 * @access  Admin only
 */
router.delete(
    '/:id',
    requireAdmin,
    validateRecordId,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const recordId = parseInt(req.params.id);

        await recordService.deleteRecord(recordId, true); // Use soft delete

        res.status(200).json({ message: 'Record deleted successfully' });
    })
);

/**
 * @route   POST /api/records/:id/restore
 * @desc    Restore a soft-deleted financial record
 * @access  Admin only
 */
router.post(
    '/:id/restore',
    requireAdmin,
    validateRecordId,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const recordId = parseInt(req.params.id);

        const record = await recordService.restoreRecord(recordId);

        res.status(200).json(record);
    })
);

module.exports = router;
