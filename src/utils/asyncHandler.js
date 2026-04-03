/**
 * Async Handler Wrapper
 * 
 * Wraps async route handlers to catch errors and pass them to
 * the error handling middleware automatically.
 * 
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => {
 *     // async code here
 *   }));
 */

const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = asyncHandler;
