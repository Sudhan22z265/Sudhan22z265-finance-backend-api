const FinancialRecord = require('../models/FinancialRecord');
const { ValidationError, NotFoundError } = require('../utils/errors');

/**
 * Financial Record Service
 * 
 * Handles business logic for financial record operations.
 * Provides CRUD operations and filtering capabilities.
 */
class RecordService {
    /**
     * Create a new financial record
     * @param {Object} recordData - Record data
     * @param {number} recordData.amount - Transaction amount (required)
     * @param {string} recordData.transactionType - Type: income or expense (required)
     * @param {string} recordData.category - Category (required)
     * @param {string} recordData.date - Date in YYYY-MM-DD format (required)
     * @param {string} recordData.notes - Optional notes
     * @param {number} userId - ID of user creating the record
     * @returns {Object} Created financial record
     */
    async createRecord(recordData, userId) {
        const { amount, transactionType, category, date, notes } = recordData;

        // Validate required fields
        if (!amount || !transactionType || !category || !date) {
            throw new ValidationError('Amount, transactionType, category, and date are required');
        }

        // Validate amount is positive
        if (amount <= 0) {
            throw new ValidationError('Amount must be greater than 0');
        }

        // Validate transaction type
        const validTypes = ['income', 'expense'];
        if (!validTypes.includes(transactionType)) {
            throw new ValidationError(`Transaction type must be one of: ${validTypes.join(', ')}`);
        }

        // Validate date format
        if (!this.validateDateFormat(date)) {
            throw new ValidationError('Date must be in YYYY-MM-DD format');
        }

        // Create record
        const record = await FinancialRecord.query().insert({
            amount,
            transactionType,
            category,
            date,
            notes: notes || null,
            createdBy: userId,
            isDeleted: false
        });

        return record;
    }

    /**
     * Get financial record by ID
     * @param {number} recordId - Record ID
     * @returns {Object} Financial record
     */
    async getRecordById(recordId) {
        const record = await FinancialRecord.query()
            .findById(recordId)
            .where('is_deleted', false);

        if (!record) {
            throw new NotFoundError('Financial record');
        }

        return record;
    }

    /**
     * Update a financial record (partial updates supported)
     * @param {number} recordId - Record ID
     * @param {Object} updates - Fields to update
     * @returns {Object} Updated financial record
     */
    async updateRecord(recordId, updates) {
        // Check if record exists
        const existingRecord = await this.getRecordById(recordId);

        // Validate updates
        if (updates.amount !== undefined && updates.amount <= 0) {
            throw new ValidationError('Amount must be greater than 0');
        }

        if (updates.transactionType !== undefined) {
            const validTypes = ['income', 'expense'];
            if (!validTypes.includes(updates.transactionType)) {
                throw new ValidationError(`Transaction type must be one of: ${validTypes.join(', ')}`);
            }
        }

        if (updates.date !== undefined && !this.validateDateFormat(updates.date)) {
            throw new ValidationError('Date must be in YYYY-MM-DD format');
        }

        // Remove fields that shouldn't be updated
        const { id, createdBy, createdAt, isDeleted, ...allowedUpdates } = updates;

        // Update record
        const updatedRecord = await FinancialRecord.query()
            .patchAndFetchById(recordId, allowedUpdates);

        return updatedRecord;
    }

    /**
     * Delete a financial record
     * @param {number} recordId - Record ID
     * @param {boolean} softDelete - If true, mark as deleted instead of removing
     * @returns {boolean} True if deleted
     */
    async deleteRecord(recordId, softDelete = false) {
        // Check if record exists
        await this.getRecordById(recordId);

        if (softDelete) {
            // Soft delete: mark as deleted
            await FinancialRecord.query()
                .patchAndFetchById(recordId, { isDeleted: true });
        } else {
            // Hard delete: remove from database
            await FinancialRecord.query().deleteById(recordId);
        }

        return true;
    }

    /**
     * Restore a soft-deleted record
     * @param {number} recordId - Record ID
     * @returns {Object} Restored financial record
     */
    async restoreRecord(recordId) {
        const record = await FinancialRecord.query()
            .findById(recordId)
            .where('is_deleted', true);

        if (!record) {
            throw new NotFoundError('Deleted financial record');
        }

        const restoredRecord = await FinancialRecord.query()
            .patchAndFetchById(recordId, { isDeleted: false });

        return restoredRecord;
    }

    /**
     * Validate date format (YYYY-MM-DD)
     * @param {string} date - Date string
     * @returns {boolean} True if valid
     */
    validateDateFormat(date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return false;
        }

        // Check if it's a valid date
        const dateObj = new Date(date);
        return dateObj instanceof Date && !isNaN(dateObj);
    }

    /**
     * Get financial records with filtering, pagination, and search
     * @param {Object} filters - Filter options
     * @param {string} filters.dateFrom - Start date (YYYY-MM-DD)
     * @param {string} filters.dateTo - End date (YYYY-MM-DD)
     * @param {string} filters.category - Category filter
     * @param {string} filters.transactionType - Transaction type filter (income/expense)
     * @param {string} filters.searchQuery - Search in notes
     * @param {boolean} filters.includeDeleted - Include soft-deleted records
     * @param {Object} pagination - Pagination options
     * @param {number} pagination.page - Page number (default: 1)
     * @param {number} pagination.pageSize - Items per page (default: 20)
     * @returns {Object} Records and pagination metadata
     */
    async getRecords(filters = {}, pagination = {}) {
        const {
            dateFrom,
            dateTo,
            category,
            transactionType,
            searchQuery,
            includeDeleted = false
        } = filters;

        const {
            page = 1,
            pageSize = 20
        } = pagination;

        // Validate pagination parameters
        if (page < 1 || pageSize < 1) {
            throw new ValidationError('Page and pageSize must be positive integers');
        }

        // Build query
        let query = FinancialRecord.query();

        // Filter by soft delete status
        if (!includeDeleted) {
            query = query.where('is_deleted', false);
        }

        // Apply date range filter
        if (dateFrom) {
            query = query.where('date', '>=', dateFrom);
        }
        if (dateTo) {
            query = query.where('date', '<=', dateTo);
        }

        // Apply category filter
        if (category) {
            query = query.where('category', category);
        }

        // Apply transaction type filter
        if (transactionType) {
            const validTypes = ['income', 'expense'];
            if (!validTypes.includes(transactionType)) {
                throw new ValidationError(`Transaction type must be one of: ${validTypes.join(', ')}`);
            }
            query = query.where('transaction_type', transactionType);
        }

        // Apply search filter (case-insensitive search in notes)
        if (searchQuery) {
            query = query.where('notes', 'ilike', `%${searchQuery}%`);
        }

        // Get total count for pagination
        const totalRecords = await query.resultSize();

        // Apply sorting (default: date descending)
        query = query.orderBy('date', 'desc');

        // Apply pagination
        const offset = (page - 1) * pageSize;
        query = query.limit(pageSize).offset(offset);

        // Execute query
        const records = await query;

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalRecords / pageSize);

        return {
            records,
            pagination: {
                page,
                pageSize,
                totalRecords,
                totalPages
            }
        };
    }

    /**
     * Search financial records by notes
     * @param {string} searchQuery - Search query
     * @param {Object} filters - Additional filters
     * @returns {Array} Matching financial records
     */
    async searchRecords(searchQuery, filters = {}) {
        if (!searchQuery) {
            throw new ValidationError('Search query is required');
        }

        const result = await this.getRecords(
            { ...filters, searchQuery },
            { page: 1, pageSize: 100 }
        );

        return result.records;
    }
}

module.exports = new RecordService();
