const ErrorResponse = require('../utils/errorResponse');

// Handle 404 errors
const notFound = (req, res, next) => {
  const error = new ErrorResponse(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  notFound,
  asyncHandler
};