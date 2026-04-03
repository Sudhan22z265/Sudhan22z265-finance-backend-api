const express = require('express');
const router = express.Router();
const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');
const { authenticateToken } = require('../middleware/auth');
const { requireAuth } = require('../middleware/authorization');
const { validateDashboardFilters, handleValidationErrors } = require('../middleware/validator');

/**
 * Dashboard Routes
 * 
 * Provides analytics and aggregated data for financial records.
 * All routes require authentication and are accessible to all roles (viewer, analyst, admin).
 */

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireAuth);

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get financial summary (total income, expenses, net balance, record count)
 * @access  Viewer, Analyst, Admin
 */
router.get(
    '/summary',
    validateDashboardFilters,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const filters = {
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo
        };

        const summary = await dashboardService.getSummary(filters);

        res.status(200).json(summary);
    })
);

/**
 * @route   GET /api/dashboard/categories
 * @desc    Get category-wise totals grouped by transaction type
 * @access  Viewer, Analyst, Admin
 */
router.get(
    '/categories',
    validateDashboardFilters,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const filters = {
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo
        };

        const categoryTotals = await dashboardService.getCategoryTotals(filters);

        res.status(200).json({
            categories: categoryTotals,
            count: categoryTotals.length
        });
    })
);

/**
 * @route   GET /api/dashboard/trends/monthly
 * @desc    Get monthly trends (income, expenses, balance by month)
 * @access  Viewer, Analyst, Admin
 */
router.get(
    '/trends/monthly',
    validateDashboardFilters,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const filters = {
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo
        };

        const monthlyTrends = await dashboardService.getMonthlyTrends(filters);

        res.status(200).json({
            trends: monthlyTrends,
            count: monthlyTrends.length
        });
    })
);

/**
 * @route   GET /api/dashboard/trends/weekly
 * @desc    Get weekly trends (income, expenses, balance by week)
 * @access  Viewer, Analyst, Admin
 */
router.get(
    '/trends/weekly',
    validateDashboardFilters,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const filters = {
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo
        };

        const weeklyTrends = await dashboardService.getWeeklyTrends(filters);

        res.status(200).json({
            trends: weeklyTrends,
            count: weeklyTrends.length
        });
    })
);

/**
 * @route   GET /api/dashboard/recent
 * @desc    Get recent activity (most recent financial records)
 * @access  Viewer, Analyst, Admin
 */
router.get(
    '/recent',
    validateDashboardFilters,
    handleValidationErrors,
    asyncHandler(async (req, res) => {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const filters = {
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo
        };

        const recentRecords = await dashboardService.getRecentActivity(limit, filters);

        res.status(200).json({
            records: recentRecords,
            count: recentRecords.length
        });
    })
);

module.exports = router;
