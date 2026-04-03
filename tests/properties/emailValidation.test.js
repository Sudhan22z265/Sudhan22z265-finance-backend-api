const fc = require('fast-check');
const userService = require('../../src/services/userService');

describe('Email Validation Tests', () => {
    describe('Property 3: Email Format Validation - Unit Tests', () => {
        it('should accept valid email formats', () => {
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

        it('should reject invalid email formats', () => {
            // Test specific invalid email examples
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
                const isValid = userService.validateEmail(invalidEmail);
                expect(isValid).toBe(false);
            }
        });

        it('should reject property-based invalid email formats', () => {
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
                    'user@.domain.com'
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