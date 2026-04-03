const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ValidationError, AuthenticationError, ConflictError } = require('../utils/errors');

/**
 * Authentication Service
 * 
 * Handles user registration, login, password hashing, and JWT token generation/verification.
 */
class AuthService {
    /**
     * Register a new user
     * @param {string} username - Username
     * @param {string} email - Email address
     * @param {string} password - Plain text password
     * @param {string} role - User role (viewer, analyst, admin)
     * @returns {Object} User object and JWT token
     */
    async register(username, email, password, role = 'viewer') {
        // Validate inputs
        if (!username || !email || !password) {
            throw new ValidationError('Username, email, and password are required');
        }

        if (password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters long');
        }

        // Check if username already exists
        const existingUser = await User.query().findOne({ username });
        if (existingUser) {
            throw new ConflictError('Username already exists');
        }

        // Hash password
        const passwordHash = await this.hashPassword(password);

        // Create user
        const user = await User.query().insert({
            username,
            email,
            passwordHash,
            role,
            isActive: true
        });

        // Fetch the complete user object (insert might not return all fields)
        const completeUser = await User.query().findById(user.id);

        // Generate token
        const token = this.generateToken(completeUser);

        return {
            user: {
                id: completeUser.id,
                username: completeUser.username,
                email: completeUser.email,
                role: completeUser.role,
                isActive: completeUser.isActive,
                createdAt: completeUser.createdAt
            },
            token
        };
    }

    /**
     * Login user
     * @param {string} username - Username
     * @param {string} password - Plain text password
     * @returns {Object} User object and JWT token
     */
    async login(username, password) {
        // Validate inputs
        if (!username || !password) {
            throw new ValidationError('Username and password are required');
        }

        // Find user
        const user = await User.query()
            .findOne({ username })
            .select('id', 'username', 'email', 'password_hash', 'role', 'is_active');

        if (!user) {
            throw new AuthenticationError('Invalid username or password');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new AuthenticationError('User account is inactive');
        }

        // Verify password
        const isPasswordValid = await this.comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AuthenticationError('Invalid username or password');
        }

        // Generate token
        const token = this.generateToken(user);

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token
        };
    }

    /**
     * Hash password using bcrypt
     * @param {string} password - Plain text password
     * @returns {string} Hashed password
     */
    async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * Compare password with hash
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password
     * @returns {boolean} True if password matches
     */
    async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Generate JWT token
     * @param {Object} user - User object
     * @returns {string} JWT token
     */
    generateToken(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
        const expiresIn = process.env.JWT_EXPIRATION || '24h';

        return jwt.sign(payload, secret, { expiresIn });
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {Object} Decoded token payload
     */
    verifyToken(token) {
        try {
            const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
            return jwt.verify(token, secret);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new AuthenticationError('Token has expired');
            }
            throw new AuthenticationError('Invalid token');
        }
    }
}

module.exports = new AuthService();
