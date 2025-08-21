/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Joi validation error
  if (err.isJoi) {
    error.status = 400;
    error.message = err.details[0].message;
  }

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        error.status = 409;
        error.message = 'Resource already exists';
        break;
      case '23503': // Foreign key violation
        error.status = 400;
        error.message = 'Referenced resource does not exist';
        break;
      case '23502': // Not null violation
        error.status = 400;
        error.message = 'Required field is missing';
        break;
      case '42P01': // Undefined table
        error.status = 500;
        error.message = 'Database configuration error';
        break;
      default:
        error.status = 500;
        error.message = 'Database error occurred';
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.status = 401;
    error.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    error.status = 401;
    error.message = 'Token expired';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Internal Server Error';
  }

  res.status(error.status).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
