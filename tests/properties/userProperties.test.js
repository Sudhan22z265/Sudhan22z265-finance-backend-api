const fc = require('fast-check');
const userService = require('../../src/services/userService');
const { ValidationError } = require('../../src/utils/errors');

describe('User Properties', () => {
    describe('Property 3: Email Format Validation', () => {
        it('Feature: finance-backend, Property 3: For any invalid email format, user creation should fail with HTTP 400', async () => {
            // Test specific invalid email examples first
            const invalidEmails = [
                'plaintext',
                'user@',
                '@domain.com',
                'user@@domain.com',
                'user@domain',
                'user name@domain.com',
                'user@domain..com',
                'user@.domain.com',
                '',
                ' ',
                'user@domain.com.',
                '.user@domain.com',
                'user.@domain.com',
                'user@domain-.com',
                'user@-domain.com',
                'user@domain@com',
                'user..name@domain.com'
            ];

            for (const invalidEmail of invalidEmails) {
                const userData = {
                    username: `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    email: invalidEmail,
                    role: 'viewer'
                };

                await expect(userService.createUser(userData))
                    .rejects
                    .toThrow(ValidationError);
            }

            // Property-based test with generated invalid emails
            await fc.assert(
                fc.asyncProperty(
                    // Generate invalid email formats
                    fc.oneof(
                        // Missing @ symbol
                        fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@') && s.trim() !== ''),
                        // Missing domain
                        fc.string({ minLength: 1, maxLength: 15 }).map(s => s.replace('@', '') + '@'),
                        // Missing local part
                        fc.string({ minLength: 1, maxLength: 15 }).map(s => '@' + s.replace('@', '')),
                        // Multiple @ symbols
                        fc.string({ minLength: 1, maxLength: 10 }).map(s => s.replace('@', '') + '@@' + s.replace('@', '')),
                        // Common invalid formats
                        fc.constantFrom(
                            'user@',
                            '@domain.com',
                            'user@@domain.com',
                            'user@domain',
                            'user name@domain.com',
                            'user@domain..com',
                            'user@.domain.com',
                            'plaintext',
                            'user@domain@com'
                        )
                    ),
                    fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
                    fc.constantFrom('viewer', 'analyst', 'admin'),
                    async (invalidEmail, username, role) => {
                        const userData = {
                            username: `${username}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                            email: invalidEmail,
                            role
                        };

                        // Attempt to create user with invalid email
                        await expect(userService.createUser(userData))
                            .rejects
                            .toThrow(ValidationError);
                    }
                ),
                { numRuns: 50 } // Reduced runs for faster execution
            );
        }, 30000); // 30 second timeout

        it('Feature: finance-backend, Property 3: Valid email formats should be accepted', () => {
            // Test that valid emails pass validation
            fc.assert(
                fc.property(
                    fc.emailAddress(),
                    (validEmail) => {
                        const isValid = userService.validateEmail(validEmail);
                        expect(isValid).toBe(true);
                    }
                ),
                { numRuns: 50 }
            );
        });

        it('Feature: finance-backend, Property 3: Invalid email formats should be rejected', () => {
            // Test that invalid emails fail validation
            const invalidEmailFormats = [
                fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('@') && s.trim() !== ''),
                fc.constantFrom(
                    'plaintext',
                    'user@',
                    '@domain.com',
                    'user@@domain.com',
                    'user@domain',
                    'user@domain..com',
                    'user@.domain.com',
                    '',
                    ' '
                )
            ];

            for (const invalidEmailArb of invalidEmailFormats) {
                fc.assert(
                    fc.property(
                        invalidEmailArb,
                        (invalidEmail) => {
                            const isValid = userService.validateEmail(invalidEmail);
                            expect(isValid).toBe(false);
                        }
                    ),
                    { numRuns: 20 }
                );
            }
        });
    });
});