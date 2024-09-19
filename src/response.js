// src/response.js

/**
 * A successful response looks like:
 *
 * {
 *   "status": "ok",
 *   ...
 * }
 */
module.exports.createSuccessResponse = function (data) {
    return {
      status: 'ok',
      // Use the spread operator to clone `data` into our object, see:
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax#spread_in_object_literals
      ...data,
    };
  };
  
  /**
   * An error response looks like:
   *
   * {
   *   "status": "error",
   *   "error": {
   *     "code": 400,
   *     "message": "invalid request, missing ...",
   *   }
   * }
   */
  module.exports.createErrorResponse = function (code, message) {
    return {
        status: 'error',
        error: {
            code: code || 400, // If no code is provided, default to 400
            message: message || 'invalid request', // Default message if no message is provided
        }
    };
};