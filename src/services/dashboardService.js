const FinancialRecord = require('../models/FinancialRecord');
const { db } = require('../config/database');

/**
 * Dashboard Service
 * 
 * Handles business logic for dashboard analytics and aggregations.
 * Provides summary calculations, trends, and category analysis.
 */
class DashboardService {
    /**
     * Get financial summary (total income, expenses, net balance)
     * @param {Object} filters - Filter options
     * @param {string} filters.dateFrom - Start date (YYYY-MM-DD)
     * @param {string} filters.dateTo - End date (YYYY-MM-DD)
     * @returns {Object} Summary data
     */
    async getSummary(filters = {}) {
        const { dateFrom, dateTo } = filters;

        // Build query
        let query = FinancialRecord.query()
            .where('is_deleted', false);

        // Apply date range filter
        if (dateFrom) {
            query = query.where('date', '>=', dateFrom);
        }
        if (dateTo) {
            query = query.where('date', '<=', dateTo);
        }

        // Get all records
        const records = await query;

        // Calculate totals
        const totalIncome = records
            .filter(r => r.transactionType === 'income')
            .reduce((sum, r) => sum + parseFloat(r.amount), 0);

        const totalExpenses = records
            .filter(r => r.transactionType === 'expense')
            .reduce((sum, r) => sum + parseFloat(r.amount), 0);

        const netBalance = totalIncome - totalExpenses;
        const recordCount = records.length;

        return {
            totalIncome: parseFloat(totalIncome.toFixed(2)),
            totalExpenses: parseFloat(totalExpenses.toFixed(2)),
            netBalance: parseFloat(netBalance.toFixed(2)),
            recordCount
        };
    }

    /**
     * Get category-wise totals
     * @param {Object} filters - Filter options
     * @returns {Array} Category totals
     */
    async getCategoryTotals(filters = {}) {
        const { dateFrom, dateTo } = filters;

        // Build query with aggregation
        let query = db('financial_records')
            .select('category', 'transaction_type')
            .sum('amount as total')
            .count('* as count')
            .where('is_deleted', false)
            .groupBy('category', 'transaction_type')
            .orderBy('total', 'desc');

        // Apply date range filter
        if (dateFrom) {
            query = query.where('date', '>=', dateFrom);
        }
        if (dateTo) {
            query = query.where('date', '<=', dateTo);
        }

        const results = await query;

        // Format results
        return results.map(row => ({
            category: row.category,
            transactionType: row.transaction_type,
            total: parseFloat(parseFloat(row.total).toFixed(2)),
            count: parseInt(row.count)
        }));
    }

    /**
     * Get recent activity (most recent records)
     * @param {number} limit - Number of records to return (default: 10)
     * @param {Object} filters - Filter options
     * @returns {Array} Recent financial records
     */
    async getRecentActivity(limit = 10, filters = {}) {
        const { dateFrom, dateTo } = filters;

        // Build query
        let query = FinancialRecord.query()
            .where('is_deleted', false)
            .orderBy('date', 'desc')
            .orderBy('created_at', 'desc')
            .limit(limit);

        // Apply date range filter
        if (dateFrom) {
            query = query.where('date', '>=', dateFrom);
        }
        if (dateTo) {
            query = query.where('date', '<=', dateTo);
        }

        const records = await query;

        return records;
    }

    /**
     * Get monthly trends (income, expenses, balance by month)
     * @param {Object} filters - Filter options
     * @returns {Array} Monthly trend data
     */
    async getMonthlyTrends(filters = {}) {
        const { dateFrom, dateTo } = filters;

        // Build query with monthly aggregation
        let query = db('financial_records')
            .select(
                db.raw("TO_CHAR(date, 'YYYY-MM') as period"),
                'transaction_type'
            )
            .sum('amount as total')
            .where('is_deleted', false)
            .groupBy(db.raw("TO_CHAR(date, 'YYYY-MM'), transaction_type"))
            .orderBy('period', 'desc');

        // Apply date range filter
        if (dateFrom) {
            query = query.where('date', '>=', dateFrom);
        }
        if (dateTo) {
            query = query.where('date', '<=', dateTo);
        }

        const results = await query;

        // Group by period and calculate balance
        const trendMap = {};

        results.forEach(row => {
            const period = row.period;
            if (!trendMap[period]) {
                trendMap[period] = { period, income: 0, expenses: 0, balance: 0 };
            }

            const amount = parseFloat(row.total);
            if (row.transaction_type === 'income') {
                trendMap[period].income = parseFloat(amount.toFixed(2));
            } else if (row.transaction_type === 'expense') {
                trendMap[period].expenses = parseFloat(amount.toFixed(2));
            }
        });

        // Calculate balance for each period
        const trends = Object.values(trendMap).map(trend => ({
            ...trend,
            balance: parseFloat((trend.income - trend.expenses).toFixed(2))
        }));

        // Sort by period descending
        trends.sort((a, b) => b.period.localeCompare(a.period));

        return trends;
    }

    /**
     * Get weekly trends (income, expenses, balance by week)
     * @param {Object} filters - Filter options
     * @returns {Array} Weekly trend data
     */
    async getWeeklyTrends(filters = {}) {
        const { dateFrom, dateTo } = filters;

        // Build query with weekly aggregation
        let query = db('financial_records')
            .select(
                db.raw("TO_CHAR(date, 'IYYY-\"W\"IW') as period"),
                'transaction_type'
            )
            .sum('amount as total')
            .where('is_deleted', false)
            .groupBy(db.raw("TO_CHAR(date, 'IYYY-\"W\"IW'), transaction_type"))
            .orderBy('period', 'desc');

        // Apply date range filter
        if (dateFrom) {
            query = query.where('date', '>=', dateFrom);
        }
        if (dateTo) {
            query = query.where('date', '<=', dateTo);
        }

        const results = await query;

        // Group by period and calculate balance
        const trendMap = {};

        results.forEach(row => {
            const period = row.period;
            if (!trendMap[period]) {
                trendMap[period] = { period, income: 0, expenses: 0, balance: 0 };
            }

            const amount = parseFloat(row.total);
            if (row.transaction_type === 'income') {
                trendMap[period].income = parseFloat(amount.toFixed(2));
            } else if (row.transaction_type === 'expense') {
                trendMap[period].expenses = parseFloat(amount.toFixed(2));
            }
        });

        // Calculate balance for each period
        const trends = Object.values(trendMap).map(trend => ({
            ...trend,
            balance: parseFloat((trend.income - trend.expenses).toFixed(2))
        }));

        // Sort by period descending
        trends.sort((a, b) => b.period.localeCompare(a.period));

        return trends;
    }
}

module.exports = new DashboardService();
