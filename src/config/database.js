const knex = require('knex');
const { Model } = require('objection');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Initialize Knex
const db = knex(config);

// Bind Objection.js to the Knex instance
Model.knex(db);

// Test database connection
const testConnection = async () => {
    try {
        await db.raw('SELECT 1');
        console.log('Database connection established successfully');
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        return false;
    }
};

// Graceful shutdown
const closeConnection = async () => {
    try {
        await db.destroy();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error closing database connection:', error.message);
    }
};

module.exports = {
    db,
    testConnection,
    closeConnection
};
