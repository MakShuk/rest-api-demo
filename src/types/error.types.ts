export interface ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  code?: string;
  details?: any;
  stack?: string;
  timestamp: string;
  path?: string;
  method?: string;
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (code !== undefined) {
      this.code = code;
    }
    if (details !== undefined) {
      this.details = details;
    }

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }

    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', resource?: string) {
    super(message, 404, true, 'NOT_FOUND', { resource });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', reason?: string) {
    super(message, 401, true, 'UNAUTHORIZED', { reason });
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', action?: string) {
    super(message, 403, true, 'FORBIDDEN', { action });
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', conflictType?: string) {
    super(message, 409, true, 'CONFLICT', { conflictType });
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', details?: any) {
    super(message, 400, true, 'BAD_REQUEST', details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', details?: any) {
    super(message, 500, true, 'INTERNAL_SERVER_ERROR', details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service Unavailable', service?: string) {
    super(message, 503, true, 'SERVICE_UNAVAILABLE', { service });
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too Many Requests', retryAfter?: number) {
    super(message, 429, true, 'TOO_MANY_REQUESTS', { retryAfter });
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database Error', operation?: string) {
    super(message, 500, true, 'DATABASE_ERROR', { operation });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', reason?: string) {
    super(message, 401, true, 'AUTHENTICATION_ERROR', { reason });
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired') {
    super(message, 401, true, 'TOKEN_EXPIRED');
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid token') {
    super(message, 401, true, 'INVALID_TOKEN');
  }
}
