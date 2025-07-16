import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from '../types/error.types';

/**
 * Middleware to run validation chains and handle errors
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors for response
    const formattedErrors = errors.array().map((error: any) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    const errorResponse = {
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      timestamp: new Date().toISOString(),
    };

    return res.status(400).json(errorResponse);
  };
};

/**
 * Middleware for conditional validation
 * Only runs validation if condition is met
 */
export const conditionalValidate = (
  condition: (req: Request) => boolean,
  validations: ValidationChain[]
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!condition(req)) {
      return next();
    }

    return validate(validations)(req, res, next);
  };
};

/**
 * Middleware to sanitize request data after validation
 */
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction) => {
  // Remove undefined and null values from body
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === undefined || req.body[key] === null) {
        delete req.body[key];
      }
      // Trim string values
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  // Remove undefined and null values from query
  if (req.query && typeof req.query === 'object') {
    Object.keys(req.query).forEach(key => {
      if (req.query[key] === undefined || req.query[key] === null) {
        delete req.query[key];
      }
      // Trim string values
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).trim();
      }
    });
  }

  next();
};

/**
 * Middleware to validate request content type
 */
export const validateContentType = (expectedType: string = 'application/json') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes(expectedType)) {
      const error = new AppError(
        `Invalid content type. Expected ${expectedType}`,
        400
      );
      return next(error);
    }

    next();
  };
};

/**
 * Middleware to validate request size
 */
export const validateRequestSize = (maxSize: number = 1024 * 1024) => { // 1MB default
  return (req: Request, _res: Response, next: NextFunction) => {
    const contentLength = req.get('Content-Length');
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      const error = new AppError(
        `Request too large. Maximum size is ${maxSize} bytes`,
        413
      );
      return next(error);
    }

    next();
  };
};

/**
 * Middleware to validate required headers
 */
export const validateRequiredHeaders = (requiredHeaders: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const missingHeaders: string[] = [];

    requiredHeaders.forEach(header => {
      if (!req.get(header)) {
        missingHeaders.push(header);
      }
    });

    if (missingHeaders.length > 0) {
      const error = new AppError(
        `Missing required headers: ${missingHeaders.join(', ')}`,
        400
      );
      return next(error);
    }

    next();
  };
};

/**
 * Middleware for custom validation with async support
 */
export const customValidate = (
  validator: (req: Request) => Promise<string | null> | string | null
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const error = await validator(req);
      
      if (error) {
        const appError = new AppError(error, 400);
        return next(appError);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

/**
 * Middleware to validate file uploads
 */
export const validateFileUpload = (options: {
  maxSize?: number;
  allowedTypes?: string[];
  required?: boolean;
}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = [], required = false } = options;

    // Check if file is required
    if (required && (!req.file && !req.files)) {
      const error = new AppError('File upload is required', 400);
      return next(error);
    }

    // If no file uploaded and not required, continue
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [req.file];

    for (const file of files) {
      if (!file) continue;

      // Check file size
      if (file.size > maxSize) {
        const error = new AppError(
          `File too large. Maximum size is ${maxSize} bytes`,
          400
        );
        return next(error);
      }

      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        const error = new AppError(
          `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
          400
        );
        return next(error);
      }
    }

    next();
  };
};

/**
 * Middleware to validate API version
 */
export const validateApiVersion = (supportedVersions: string[] = ['v1']) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const version = req.get('API-Version') || req.params.version || 'v1';

    if (!supportedVersions.includes(version)) {
      const error = new AppError(
        `Unsupported API version: ${version}. Supported versions: ${supportedVersions.join(', ')}`,
        400
      );
      return next(error);
    }

    // Add version to request for later use
    (req as any).apiVersion = version;
    next();
  };
};
