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

// Authentication and authorization middleware
export {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireUser,
  requireOwnershipOrAdmin,
  authAndRole,
  extractUserIdFromToken,
  AuthenticatedRequest,
} from './auth.middleware';

// Security middleware
export {
  authRateLimit,
  apiRateLimit,
  adminRateLimit,
  requireActiveUser,
  canAccessResource,
  validateApiKey,
  requireHTTPS,
  validateOrigin,
  logSecurityEvent,
} from './security.middleware';

// Permission-based middleware
export {
  Permission,
  hasPermission,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireResourcePermission,
  canAccessOwnProfile,
  canModifyUser,
  preventAdminModification,
  getRolePermissions,
  isValidRole,
} from './permissions.middleware';
