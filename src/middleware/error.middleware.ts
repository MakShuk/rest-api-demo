import { Request, Response, NextFunction } from 'express';
import { ApiError, ErrorResponse, AppError } from '../types/error.types';
import { config } from '../config/config';

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
  // Log error details
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Check if it's an operational error (AppError)
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if ('statusCode' in error && typeof error.statusCode === 'number') {
    // Handle other API errors
    statusCode = error.statusCode;
    message = error.message;
  }

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

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
