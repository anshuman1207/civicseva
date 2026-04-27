/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  // Log unexpected errors for debugging
  if (statusCode === 500) {
    console.error('SERVER ERROR:', err);
  }

  res.status(statusCode).json({
    status: err.status || 'error',
    message: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    isOperational: err.isOperational || false
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
