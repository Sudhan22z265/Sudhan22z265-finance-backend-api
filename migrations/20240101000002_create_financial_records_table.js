/**
 * Migration: Create financial_records table
 * 
 * This migration creates the financial_records table with the following fields:
 * - id: Primary key (auto-increment)
 * - amount: Transaction amount (must be positive)
 * - transaction_type: Type of transaction - income or expense
 * - category: Category of the transaction
 * - date: Date of the transaction
 * - notes: Optional notes/description
 * - created_by: Foreign key to users table
 * - is_deleted: Soft delete flag (for optional soft delete feature)
 * - created_at: Timestamp of creation
 * - updated_at: Timestamp of last update
 */

exports.up = function (knex) {
    return knex.schema.createTable('financial_records', (table) => {
        // Primary key
        table.increments('id').primary();

        // Financial data
        table.decimal('amount', 15, 2).notNullable().checkPositive();

        // Transaction type with check constraint
        table.enum('transaction_type', ['income', 'expense'], {
            useNative: true,
            enumName: 'transaction_type'
        }).notNullable();

        table.string('category', 255).notNullable();
        table.date('date').notNullable();
        table.text('notes');

        // Foreign key to users
        table.integer('created_by')
            .unsigned()
            .references('id')
            .inTable('users')
            .onDelete('SET NULL');

        // Soft delete flag (optional feature)
        table.boolean('is_deleted').defaultTo(false);

        // Timestamps
        table.timestamps(true, true);

        // Indexes for performance
        table.index('date', 'idx_financial_records_date');
        table.index('category', 'idx_financial_records_category');
        table.index('transaction_type', 'idx_financial_records_type');
        table.index('created_by', 'idx_financial_records_created_by');
        table.index('is_deleted', 'idx_financial_records_is_deleted');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('financial_records');
};
