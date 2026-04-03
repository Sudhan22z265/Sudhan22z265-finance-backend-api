#!/usr/bin/env node

/**
 * Database Setup Script
 * Run this after deployment to set up database tables
 */

const { execSync } = require('child_process');

console.log('🔧 Setting up database...');

try {
    // Run migrations
    console.log('📊 Running database migrations...');
    execSync('npm run migrate:latest', { stdio: 'inherit' });

    console.log('✅ Database setup completed successfully!');
    console.log('🚀 Your Finance Backend API is ready to use!');

} catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
}