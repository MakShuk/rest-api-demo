import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { AppError } from '../types/error.types';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Rate limiting middleware for authentication endpoints
 * More restrictive limits for login/register
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
});

/**
 * General API rate limiting middleware
 * Less restrictive for general API usage
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiting for admin operations
 */
export const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 admin requests per windowMs
  message: {
    success: false,
    message: 'Too many admin requests, please try again later',
    retryAfter: '5 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Middleware to prevent access to inactive users
 */
export const requireActiveUser = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // Note: This would require additional user status check from database
  // For now, we assume the JWT payload contains status info
  // In a real implementation, you might want to check the database

  next();
};

/**
 * Middleware to check if user can perform action on specific resource
 * Combines authentication, active status, and ownership checks
 */
export const canAccessResource = (
  options: {
    requireOwnership?: boolean;
    allowAdmin?: boolean;
    resourceUserIdParam?: string;
  } = {}
) => {
  const {
    requireOwnership = true,
    allowAdmin = true,
    resourceUserIdParam = 'id',
  } = options;

  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const resourceUserId = req.params[resourceUserIdParam];
    const currentUserId = req.user.userId;
    const isAdmin = req.user.role === 'ADMIN';

    // Admin can access everything if allowed
    if (allowAdmin && isAdmin) {
      return next();
    }

    // Check ownership if required
    if (requireOwnership && resourceUserId !== currentUserId) {
      return next(new AppError('Access denied', 403));
    }

    next();
  };
};

/**
 * Middleware to validate API key for external integrations
 * Can be used alongside or instead of JWT for certain endpoints
 */
export const validateApiKey = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return next(new AppError('API key is required', 401));
  }

  // In a real implementation, you would validate against stored API keys
  // For now, we'll just check if it exists
  if (apiKey.length < 32) {
    return next(new AppError('Invalid API key format', 401));
  }

  // Add API key info to request for logging
  (req as any).apiKey = apiKey;

  next();
};

/**
 * Middleware to ensure HTTPS in production
 */
export const requireHTTPS = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (
    process.env['NODE_ENV'] === 'production' &&
    !req.secure &&
    req.get('x-forwarded-proto') !== 'https'
  ) {
    return next(new AppError('HTTPS is required', 400));
  }

  next();
};

/**
 * Middleware to validate request origin
 * Useful for preventing CSRF attacks
 */
export const validateOrigin = (allowedOrigins: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const origin = req.get('Origin') || req.get('Referer');

    if (!origin) {
      return next(new AppError('Origin header is required', 400));
    }

    const isAllowed = allowedOrigins.some(allowed =>
      origin.startsWith(allowed)
    );

    if (!isAllowed) {
      return next(new AppError('Origin not allowed', 403));
    }

    next();
  };
};

/**
 * Middleware to log security events
 */
export const logSecurityEvent = (eventType: string) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    const securityEvent = {
      type: eventType,
      userId: req.user?.userId,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      url: req.originalUrl,
      method: req.method,
    };

    // In a real implementation, you would send this to a security monitoring system
    console.log('🔒 Security Event:', securityEvent);

    next();
  };
};
