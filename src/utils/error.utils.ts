import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  InternalServerError,
  ServiceUnavailableError,
  TooManyRequestsError,
  DatabaseError,
  AuthenticationError,
  TokenExpiredError,
  InvalidTokenError,
} from '../types/error.types';

/**
 * Error factory functions for creating standardized errors
 */
export class ErrorFactory {
  /**
   * Create a validation error with detailed field information
   */
  static validation(
    message: string,
    fields?: Record<string, string[]>
  ): ValidationError {
    return new ValidationError(message, fields);
  }

  /**
   * Create a not found error for a specific resource
   */
  static notFound(
    resource: string,
    identifier?: string | number
  ): NotFoundError {
    const message = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`;
    return new NotFoundError(message, resource);
  }

  /**
   * Create an unauthorized error with specific reason
   */
  static unauthorized(
    reason: string = 'Invalid credentials'
  ): UnauthorizedError {
    return new UnauthorizedError('Unauthorized access', reason);
  }

  /**
   * Create a forbidden error for specific action
   */
  static forbidden(action: string): ForbiddenError {
    return new ForbiddenError(`Access denied for action: ${action}`, action);
  }

  /**
   * Create a conflict error for duplicate resources
   */
  static conflict(resource: string, field?: string): ConflictError {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    return new ConflictError(message, 'DUPLICATE_RESOURCE');
  }

  /**
   * Create a bad request error with validation details
   */
  static badRequest(message: string, details?: any): BadRequestError {
    return new BadRequestError(message, details);
  }

  /**
   * Create an internal server error
   */
  static internal(
    message: string = 'Internal server error',
    details?: any
  ): InternalServerError {
    return new InternalServerError(message, details);
  }

  /**
   * Create a service unavailable error
   */
  static serviceUnavailable(service: string): ServiceUnavailableError {
    return new ServiceUnavailableError(
      `${service} is currently unavailable`,
      service
    );
  }

  /**
   * Create a rate limit error
   */
  static tooManyRequests(retryAfter?: number): TooManyRequestsError {
    return new TooManyRequestsError('Too many requests', retryAfter);
  }

  /**
   * Create a database error
   */
  static database(operation: string, details?: any): DatabaseError {
    const error = new DatabaseError(
      `Database operation failed: ${operation}`,
      operation
    );
    if (details) {
      (error as any).details = { ...error.details, ...details };
    }
    return error;
  }

  /**
   * Create an authentication error
   */
  static authentication(
    reason: string = 'Authentication failed'
  ): AuthenticationError {
    return new AuthenticationError('Authentication required', reason);
  }

  /**
   * Create a token expired error
   */
  static tokenExpired(): TokenExpiredError {
    return new TokenExpiredError('Access token has expired');
  }

  /**
   * Create an invalid token error
   */
  static invalidToken(): InvalidTokenError {
    return new InvalidTokenError('Invalid or malformed token');
  }
}

/**
 * Helper functions for common error scenarios
 */
export const createError = {
  /**
   * User not found error
   */
  userNotFound: (userId?: string | number) =>
    ErrorFactory.notFound('User', userId),

  /**
   * User already exists error
   */
  userExists: (field: string = 'email') => ErrorFactory.conflict('User', field),

  /**
   * Invalid credentials error
   */
  invalidCredentials: () =>
    ErrorFactory.unauthorized('Invalid email or password'),

  /**
   * Authentication required error
   */
  authentication: () => ErrorFactory.authentication('Authentication required'),

  /**
   * Account blocked error
   */
  accountBlocked: () => ErrorFactory.forbidden('Account is blocked'),

  /**
   * Insufficient permissions error
   */
  insufficientPermissions: (action: string) => ErrorFactory.forbidden(action),

  /**
   * Invalid input data error
   */
  invalidInput: (message: string, fields?: Record<string, string[]>) =>
    ErrorFactory.validation(message, fields),

  /**
   * Database connection error
   */
  databaseConnection: () =>
    ErrorFactory.database('connection', { type: 'CONNECTION_FAILED' }),

  /**
   * External service error
   */
  externalService: (service: string) =>
    ErrorFactory.serviceUnavailable(service),
};

/**
 * Error response formatter
 */
export const formatErrorResponse = (error: AppError) => {
  return {
    success: false,
    message: error.message,
    code: error.code,
    details: error.details,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Check if error is operational (safe to expose to client)
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Extract error message safely
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

/**
 * Extract error stack safely
 */
export const getErrorStack = (error: unknown): string | undefined => {
  if (error instanceof Error) {
    return error.stack;
  }
  return undefined;
};
