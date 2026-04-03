const fc = require('fast-check');
const userService = require('../../src/services/userService');
const { ValidationError } = require('../../src/utils/errors');

describe('User Validation Integration Tests', () => {
    describe('Property 3: Email Format Validation - Integration with UserService', () => {
        it('should throw ValidationError for invalid email formats when creating users', async () => {
            // Test specific invalid email examples
            const invalidEmails = [
                'plaintext',
                'user@',
                '@domain.com',
                'user@@domain.com',
                'user@domain',
                'user@domain..com',
                'user@.domain.com',
                '',
                ' '
            ];

            for (const invalidEmail of invalidEmails) {
                const userData = {
                    username: `testuser_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    email: invalidEmail,
                    role: 'viewer'
                };

                await expect(userService.createUser(userData))
                    .rejects
                    .toThrow(ValidationError);

                // Also verify the error message mentions email format
                try {
                    await userService.createUser(userData);
                } catch (error) {
                    expect(error.message).toContain('Invalid email format');
                }
            }
        }, 30000);

        it('should accept valid email formats when creating users', async () => {
            // Test a few valid emails to ensure they work
            const validEmails = [
                'user@example.com',
                'test.email@domain.co.uk',
                'user+tag@example.org'
            ];

            for (const validEmail of validEmails) {
                const userData = {
                    username: `testuser_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    email: validEmail,
                    role: 'viewer'
                };

                // This should not throw an error (though it might fail due to other reasons like DB connection)
                // We're mainly testing that email validation passes
                try {
                    const user = await userService.createUser(userData);
                    expect(user.email).toBe(validEmail);
                } catch (error) {
                    // If it fails, it should NOT be due to email validation
                    expect(error.message).not.toContain('Invalid email format');
                }
            }
        }, 30000);

        it('should use property-based testing for invalid email validation in user creation', async () => {
            // Property-based test with a smaller number of runs for integration testing
            await fc.assert(
                fc.asyncProperty(
                    fc.constantFrom(
                        'plaintext',
                        'user@',
                        '@domain.com',
                        'user@@domain.com',
                        'user@domain'
                    ),
                    fc.string({ minLength: 3, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_]+$/.test(s)),
                    fc.constantFrom('viewer', 'analyst', 'admin'),
                    async (invalidEmail, username, role) => {
                        const userData = {
                            username: `${username}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                            email: invalidEmail,
                            role
                        };

                        // Should throw ValidationError for invalid email
                        await expect(userService.createUser(userData))
                            .rejects
                            .toThrow(ValidationError);
                    }
                ),
                { numRuns: 10 } // Reduced runs for integration test
            );
        }, 30000);
    });
});