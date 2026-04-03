const User = require('../models/User');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');

/**
 * User Service
 * 
 * Handles business logic for user management operations.
 * Provides CRUD operations for users with proper validation.
 */
class UserService {
    /**
     * Create a new user
     * @param {Object} userData - User data
     * @param {string} userData.username - Username (required)
     * @param {string} userData.email - Email address (required)
     * @param {string} userData.role - User role (required)
     * @param {string} userData.passwordHash - Hashed password (optional)
     * @returns {Object} Created user
     */
    async createUser(userData) {
        const { username, email, role, passwordHash } = userData;

        // Validate required fields
        if (!username || !email || !role) {
            throw new ValidationError('Username, email, and role are required');
        }

        // Validate email format
        if (!this.validateEmail(email)) {
            throw new ValidationError('Invalid email format');
        }

        // Validate role
        const validRoles = ['viewer', 'analyst', 'admin'];
        if (!validRoles.includes(role)) {
            throw new ValidationError(`Role must be one of: ${validRoles.join(', ')}`);
        }

        // Check username uniqueness
        const existingUser = await User.query().findOne({ username });
        if (existingUser) {
            throw new ConflictError('Username already exists');
        }

        // Create user
        try {
            const user = await User.query().insert({
                username,
                email,
                role,
                passwordHash: passwordHash || null,
                isActive: true
            });

            return user;
        } catch (error) {
            // Handle database constraint violations
            if (error.code === '23505') {
                throw new ConflictError('Username already exists');
            }
            throw error;
        }
    }

    /**
     * Get user by ID
     * @param {number} userId - User ID
     * @returns {Object} User object
     */
    async getUserById(userId) {
        const user = await User.query().findById(userId);

        if (!user) {
            throw new NotFoundError('User');
        }

        return user;
    }

    /**
     * Get all users
     * @returns {Array} Array of user objects
     */
    async getAllUsers() {
        const users = await User.query()
            .select('id', 'username', 'email', 'role', 'is_active', 'created_at', 'updated_at')
            .orderBy('created_at', 'desc');

        return users;
    }

    /**
     * Update user role
     * @param {number} userId - User ID
     * @param {string} newRole - New role
     * @returns {Object} Updated user
     */
    async updateUserRole(userId, newRole) {
        // Validate role
        const validRoles = ['viewer', 'analyst', 'admin'];
        if (!validRoles.includes(newRole)) {
            throw new ValidationError(`Role must be one of: ${validRoles.join(', ')}`);
        }

        // Check if user exists
        const user = await this.getUserById(userId);

        // Update role
        const updatedUser = await User.query()
            .patchAndFetchById(userId, { role: newRole });

        return updatedUser;
    }

    /**
     * Update user status (active/inactive)
     * @param {number} userId - User ID
     * @param {boolean} isActive - Active status
     * @returns {Object} Updated user
     */
    async updateUserStatus(userId, isActive) {
        // Validate isActive is boolean
        if (typeof isActive !== 'boolean') {
            throw new ValidationError('isActive must be a boolean value');
        }

        // Check if user exists
        const user = await this.getUserById(userId);

        // Prevent deactivating the last admin
        if (!isActive && user.role === 'admin') {
            const adminCount = await User.query()
                .where('role', 'admin')
                .where('is_active', true)
                .resultSize();

            if (adminCount <= 1) {
                throw new ValidationError('Cannot deactivate the last active admin user');
            }
        }

        // Update status
        const updatedUser = await User.query()
            .patchAndFetchById(userId, { isActive });

        return updatedUser;
    }

    /**
     * Validate email format
     * @param {string} email - Email address
     * @returns {boolean} True if valid
     */
    validateEmail(email) {
        // More strict email validation regex
        // This regex ensures:
        // - Local part: starts and ends with alphanumeric, can contain dots but not consecutive
        // - @ symbol exactly once
        // - Domain part: valid domain format with proper TLD
        const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+([.][a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;

        // Additional checks for edge cases
        if (!email || typeof email !== 'string' || email.trim() === '') {
            return false;
        }

        // Check for consecutive dots
        if (email.includes('..')) {
            return false;
        }

        // Check for dots at start or end of local part
        const [localPart, domainPart] = email.split('@');
        if (!localPart || !domainPart) {
            return false;
        }

        if (localPart.startsWith('.') || localPart.endsWith('.')) {
            return false;
        }

        // Check for hyphens at start or end of domain parts
        const domainParts = domainPart.split('.');
        for (const part of domainParts) {
            if (part.startsWith('-') || part.endsWith('-') || part === '') {
                return false;
            }
        }

        // Domain must have at least one dot (for TLD)
        if (!domainPart.includes('.')) {
            return false;
        }

        // Final TLD must be at least 2 characters
        const tld = domainParts[domainParts.length - 1];
        if (tld.length < 2) {
            return false;
        }

        return emailRegex.test(email);
    }

    /**
     * Check if username is unique
     * @param {string} username - Username to check
     * @returns {boolean} True if unique
     */
    async validateUniqueUsername(username) {
        const existingUser = await User.query().findOne({ username });
        return !existingUser;
    }
}

module.exports = new UserService();
