require('dotenv').config();
const knex = require('knex');
const { Model } = require('objection');
const knexConfig = require('../knexfile');

// Use test database configuration
const testKnex = knex(knexConfig.test);

// Initialize Objection with test database
Model.knex(testKnex);

// Global test setup
beforeAll(async () => {
    try {
        // Run migrations
        await testKnex.migrate.latest();
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}, 30000);

// Clean up after all tests
afterAll(async () => {
    await testKnex.destroy();
});

// Clean up between test suites
beforeEach(async () => {
    try {
        // Clean all tables in reverse order to handle foreign keys
        await testKnex('financial_records').del();
        await testKnex('users').del();
    } catch (error) {
        // Ignore errors if tables don't exist yet
        console.warn('Cleanup warning:', error.message);
    }
});

module.exports = testKnex;