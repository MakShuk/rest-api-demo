// Error handling middleware
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleValidationErrors,
  handleValidationErrorsDetailed,
} from './error.middleware';

// Validation middleware
export {
  validate,
  conditionalValidate,
  sanitizeRequest,
  validateContentType,
  validateRequestSize,
  validateRequiredHeaders,
  customValidate,
  validateFileUpload,
  validateApiVersion,
} from './validation.middleware';

// Logging and security middleware
export { requestLogger, securityHeaders } from './logger.middleware';

// Future middleware exports
// export { default as authMiddleware } from './auth.middleware';
// export { default as roleMiddleware } from './role.middleware';
