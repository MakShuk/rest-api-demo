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
 * Handles express-validator errors
 */
export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors
      .array()
      .map((error: any) => error.msg)
      .join(', ');
    const error = new AppError(`Validation failed: ${errorMessages}`, 400);
    return next(error);
  }

  next();
};
