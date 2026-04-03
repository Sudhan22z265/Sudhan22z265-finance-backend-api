/**
 * Migration: Create users table
 * 
 * This migration creates the users table with the following fields:
 * - id: Primary key (auto-increment)
 * - username: Unique username (required)
 * - email: Email address (required)
 * - password_hash: Hashed password (optional, for authentication)
 * - role: User role - viewer, analyst, or admin (required)
 * - is_active: Active status (default: true)
 * - created_at: Timestamp of creation
 * - updated_at: Timestamp of last update
 */

exports.up = function (knex) {
    return knex.schema.createTable('users', (table) => {
        // Primary key
        table.increments('id').primary();

        // User credentials
        table.string('username', 255).notNullable().unique();
        table.string('email', 255).notNullable();
        table.string('password_hash', 255);

        // Role with check constraint
        table.enum('role', ['viewer', 'analyst', 'admin'], {
            useNative: true,
            enumName: 'user_role'
        }).notNullable();

        // Status
        table.boolean('is_active').defaultTo(true);

        // Timestamps
        table.timestamps(true, true);

        // Indexes for performance
        table.index('username', 'idx_users_username');
        table.index('email', 'idx_users_email');
    });
};

exports.down = function (knex) {
    return knex.schema.dropTableIfExists('users');
};
