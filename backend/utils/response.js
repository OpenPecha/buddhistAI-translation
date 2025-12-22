/**
 * Standardized response utilities for consistent API responses
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
function sendSuccess(res, data = null, message = null, statusCode = 200) {
  const response = {
    success: true,
  };

  if (data !== null) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} error - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 */
function sendError(res, error, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error: error,
  });
}

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name (e.g., "Document", "Project")
 */
function sendNotFound(res, resource = "Resource") {
  return sendError(res, `${resource} not found`, 404);
}

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Optional custom message
 */
function sendForbidden(
  res,
  message = "You do not have permission to access this resource"
) {
  return sendError(res, message, 403);
}

/**
 * Send bad request response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
function sendBadRequest(res, message) {
  return sendError(res, message, 400);
}

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Optional custom message
 */
function sendUnauthorized(res, message = "Authentication required") {
  return sendError(res, message, 401);
}

module.exports = {
  sendSuccess,
  sendError,
  sendNotFound,
  sendForbidden,
  sendBadRequest,
  sendUnauthorized,
};
