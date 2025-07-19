import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { AppError } from '../types/error.types';
import { JwtPayload } from '../types';

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * JWT Authentication middleware
 * Verifies JWT token and adds user info to request
 */
export const authenticateToken = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

    if (!token) {
      throw new AppError('Access token is required', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    // Add user info to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is present, but doesn't require it
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : null;

    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
      req.user = decoded;
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors for invalid tokens
    // Just continue without user info
    next();
  }
};

/**
 * Role-based authorization middleware
 * Requires user to have specific role(s)
 */
export const requireRole = (...roles: Array<'ADMIN' | 'USER'>) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Admin-only authorization middleware
 * Shorthand for requireRole('ADMIN')
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * User or Admin authorization middleware
 * Allows both USER and ADMIN roles
 */
export const requireUser = requireRole('USER', 'ADMIN');

/**
 * Resource ownership middleware
 * Allows access if user owns the resource or is admin
 */
export const requireOwnershipOrAdmin = (resourceUserIdParam: string = 'id') => {
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

    // Allow if user is admin or owns the resource
    if (isAdmin || resourceUserId === currentUserId) {
      return next();
    }

    next(new AppError('Access denied', 403));
  };
};

/**
 * Combined authentication and authorization middleware
 * Authenticates token and checks role in one step
 */
export const authAndRole = (...roles: Array<'ADMIN' | 'USER'>) => {
  return [authenticateToken, requireRole(...roles)];
};

/**
 * Middleware to extract user ID from token for route parameters
 * Useful for routes like /users/me
 */
export const extractUserIdFromToken = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // Replace 'me' with actual user ID
  if (req.params['id'] === 'me') {
    req.params['id'] = req.user.userId;
  }

  next();
};
