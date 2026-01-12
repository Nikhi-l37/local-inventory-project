/**
 * Async error handler middleware
 * Wraps async route handlers to catch errors and pass them to Express error handler
 * 
 * Usage:
 * router.get('/path', asyncHandler(async (req, res) => {
 *   // Your async code here
 * }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Database error handler middleware
 * Provides user-friendly error messages for common database errors
 */
const handleDatabaseError = (err, req, res, next) => {
  // Log the full error for debugging
  console.error('Database Error:', {
    message: err.message,
    code: err.code,
    detail: err.detail,
    table: err.table,
    constraint: err.constraint
  });

  // Handle specific PostgreSQL error codes
  switch (err.code) {
    case '23505': // unique_violation
      return res.status(409).json({
        error: 'Duplicate entry',
        message: 'A record with this value already exists',
        detail: err.detail
      });
    
    case '23503': // foreign_key_violation
      return res.status(400).json({
        error: 'Invalid reference',
        message: 'Referenced record does not exist',
        detail: err.detail
      });
    
    case '23502': // not_null_violation
      return res.status(400).json({
        error: 'Missing required field',
        message: `Field '${err.column}' is required`,
        detail: err.detail
      });
    
    case '42P01': // undefined_table
      return res.status(500).json({
        error: 'Database schema error',
        message: 'Required table does not exist. Please run migrations.',
        detail: 'Contact administrator'
      });
    
    case '42703': // undefined_column
      return res.status(500).json({
        error: 'Database schema error',
        message: 'Required column does not exist. Please run migrations.',
        detail: 'Contact administrator'
      });
    
    case 'ECONNREFUSED':
    case 'ENOTFOUND':
    case 'ETIMEDOUT':
      return res.status(503).json({
        error: 'Database connection error',
        message: 'Unable to connect to database. Please try again later.',
        detail: 'Service temporarily unavailable'
      });
    
    case '57P03': // cannot_connect_now
      return res.status(503).json({
        error: 'Database busy',
        message: 'Database is currently unavailable. Please try again.',
        detail: 'Too many connections'
      });
    
    default:
      // Generic error for unknown cases
      return res.status(500).json({
        error: 'Database error',
        message: 'An unexpected database error occurred',
        detail: process.env.NODE_ENV === 'development' ? err.message : 'Please try again later'
      });
  }
};

/**
 * Global error handler middleware (must be last)
 */
const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Check if it's a database error by checking for common PostgreSQL error properties
  const isDatabaseError = err.code || err.severity || err.routine;
  
  if (isDatabaseError) {
    return handleDatabaseError(err, req, res, next);
  }

  // Generic error
  console.error('Application Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = {
  asyncHandler,
  handleDatabaseError,
  errorHandler
};
