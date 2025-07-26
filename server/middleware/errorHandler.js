const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message;
    const field = Object.keys(err.keyValue)[0];
    
    switch (field) {
      case 'email':
        message = 'An account with this email already exists';
        break;
      case 'phone':
        message = 'An account with this phone number already exists';
        break;
      case 'sku':
        message = 'A product with this SKU already exists';
        break;
      default:
        message = `Duplicate field value: ${field}`;
    }
    
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ErrorResponse(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please log in again.';
    error = new ErrorResponse(message, 401);
  }

  // MongoDB connection errors
  if (err.name === 'MongoNetworkError') {
    const message = 'Database connection error. Please try again later.';
    error = new ErrorResponse(message, 500);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large. Maximum size is 5MB.';
    error = new ErrorResponse(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Too many files uploaded or unexpected field name.';
    error = new ErrorResponse(message, 400);
  }

  // Payment errors
  if (err.type === 'StripeCardError') {
    const message = err.message || 'Payment failed. Please check your card details.';
    error = new ErrorResponse(message, 400);
  }

  if (err.type === 'StripeInvalidRequestError') {
    const message = 'Invalid payment request.';
    error = new ErrorResponse(message, 400);
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests. Please try again later.';
    error = new ErrorResponse(message, 429);
  }

  // Default error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err
      })
    }
  });
};

module.exports = errorHandler;