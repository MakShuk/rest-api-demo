import { Request, Response, NextFunction } from 'express';
import {
  ApiError,
  ErrorResponse,
  AppError,
  DatabaseError,
  NotFoundError,
  ConflictError,
} from '../types/error.types';
import { config } from '../config/config';
import { Prisma } from '@prisma/client';

/**
 * Handle Prisma database errors and convert them to AppError instances
 */
const handlePrismaError = (error: any): AppError => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const field = error.meta?.['target'] as string[] | undefined;
        const fieldName = field ? field[0] : 'field';
        return new ConflictError(
          `${fieldName} already exists`,
          'UNIQUE_CONSTRAINT_VIOLATION'
        );

      case 'P2025':
        // Record not found
        return new NotFoundError('Record not found', 'RECORD_NOT_FOUND');

      case 'P2003':
        // Foreign key constraint violation
        return new ConflictError(
          'Foreign key constraint violation',
          'FOREIGN_KEY_CONSTRAINT'
        );

      case 'P2014':
        // Required relation violation
        return new ConflictError(
          'Required relation violation',
          'REQUIRED_RELATION_VIOLATION'
        );

      default:
        return new DatabaseError(
          `Database error: ${error.message}`,
          'PRISMA_KNOWN_ERROR'
        );
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return new DatabaseError(
      'Unknown database error occurred',
      'PRISMA_UNKNOWN_ERROR'
    );
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return new DatabaseError('Database engine panic', 'PRISMA_PANIC_ERROR');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseError('Database connection failed', 'PRISMA_INIT_ERROR');
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new DatabaseError(
      'Database query validation failed',
      'PRISMA_VALIDATION_ERROR'
    );
  }

  // If it's not a Prisma error, return as is
  return error;
};

/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */
export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Prisma errors first
  let processedError = error;
  if (!(error instanceof AppError)) {
    processedError = handlePrismaError(error);
  }

  // Log error details
  console.error('Error occurred:', {
    message: processedError.message,
    stack: processedError.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    originalError: error.name,
  });

  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let code: string | undefined;
  let details: any;

  // Check if it's an operational error (AppError)
  if (processedError instanceof AppError) {
    statusCode = processedError.statusCode;
    message = processedError.message;
    code = processedError.code;
    details = processedError.details;
  } else if (
    'statusCode' in processedError &&
    typeof processedError.statusCode === 'number'
  ) {
    // Handle other API errors
    statusCode = processedError.statusCode;
    message = processedError.message;
    code = (processedError as ApiError).code;
    details = (processedError as ApiError).details;
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add error code if available
  if (code) {
    errorResponse.code = code;
  }

  // Add details if available
  if (details) {
    errorResponse.details = details;
  }

  // Include error details in development
  if (config.nodeEnv === 'development') {
    errorResponse.error = error.name;
    if (error.stack) {
      errorResponse.stack = error.stack;
    }
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass them to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Validation error handler
 * Handles express-validator errors with detailed formatting
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error: any) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location,
    }));

    const errorResponse = {
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
    };

    res.status(400).json(errorResponse);
    return;
  }

  next();
};

/**
 * Enhanced validation error handler with custom formatting
 * Provides more detailed error information for development
 */
export const handleValidationErrorsDetailed = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorsByField: Record<string, any[]> = {};
    const allErrors = errors.array();

    // Group errors by field
    allErrors.forEach((error: any) => {
      const field = error.path || error.param || 'unknown';
      if (!errorsByField[field]) {
        errorsByField[field] = [];
      }
      errorsByField[field].push({
        message: error.msg,
        value: error.value,
        location: error.location,
      });
    });

    const errorResponse = {
      success: false,
      message: 'Validation failed',
      errors: errorsByField,
      totalErrors: allErrors.length,
      timestamp: new Date().toISOString(),
    };

    res.status(400).json(errorResponse);
    return;
  }

  next();
};
