// Error handling middleware
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleValidationErrors,
} from './error.middleware';

// Logging and security middleware
export { requestLogger, securityHeaders } from './logger.middleware';

// Future middleware exports
// export { default as authMiddleware } from './auth.middleware';
// export { default as roleMiddleware } from './role.middleware';
