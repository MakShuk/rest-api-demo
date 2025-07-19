import { Response, NextFunction } from 'express';
import { AppError } from '../types/error.types';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Permission types for different operations
 */
export enum Permission {
  // User permissions
  READ_OWN_PROFILE = 'read:own_profile',
  UPDATE_OWN_PROFILE = 'update:own_profile',
  DELETE_OWN_PROFILE = 'delete:own_profile',

  // Admin permissions
  READ_ALL_USERS = 'read:all_users',
  UPDATE_ANY_USER = 'update:any_user',
  DELETE_ANY_USER = 'delete:any_user',
  BLOCK_USER = 'block:user',
  UNBLOCK_USER = 'unblock:user',

  // System permissions
  MANAGE_SYSTEM = 'manage:system',
  VIEW_LOGS = 'view:logs',
  MANAGE_ROLES = 'manage:roles',
}

/**
 * Role-based permissions mapping
 */
const ROLE_PERMISSIONS: Record<'ADMIN' | 'USER', Permission[]> = {
  USER: [
    Permission.READ_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.DELETE_OWN_PROFILE,
  ],
  ADMIN: [
    // Admin has all user permissions plus admin-specific ones
    Permission.READ_OWN_PROFILE,
    Permission.UPDATE_OWN_PROFILE,
    Permission.DELETE_OWN_PROFILE,
    Permission.READ_ALL_USERS,
    Permission.UPDATE_ANY_USER,
    Permission.DELETE_ANY_USER,
    Permission.BLOCK_USER,
    Permission.UNBLOCK_USER,
    Permission.MANAGE_SYSTEM,
    Permission.VIEW_LOGS,
    Permission.MANAGE_ROLES,
  ],
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (
  userRole: 'ADMIN' | 'USER',
  permission: Permission
): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions.includes(permission);
};

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (permission: Permission) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Middleware to check multiple permissions (user must have ALL)
 */
export const requireAllPermissions = (...permissions: Permission[]) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const hasAllPermissions = permissions.every(permission =>
      hasPermission(req.user!.role, permission)
    );

    if (!hasAllPermissions) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Middleware to check multiple permissions (user must have ANY)
 */
export const requireAnyPermission = (...permissions: Permission[]) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const hasAnyPermission = permissions.some(permission =>
      hasPermission(req.user!.role, permission)
    );

    if (!hasAnyPermission) {
      return next(new AppError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Middleware for resource-specific permissions
 * Checks if user can perform action on specific resource
 */
export const requireResourcePermission = (
  permission: Permission,
  options: {
    resourceUserIdParam?: string;
    allowOwner?: boolean;
  } = {}
) => {
  const { resourceUserIdParam = 'id', allowOwner = true } = options;

  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Check if user has the required permission
    if (hasPermission(req.user.role, permission)) {
      return next();
    }

    // If user doesn't have permission, check if they own the resource
    if (allowOwner) {
      const resourceUserId = req.params[resourceUserIdParam];
      if (resourceUserId === req.user.userId) {
        return next();
      }
    }

    next(new AppError('Insufficient permissions', 403));
  };
};

/**
 * Middleware to check if user can access their own profile
 */
export const canAccessOwnProfile = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const targetUserId = req.params['id'];
  const currentUserId = req.user.userId;
  const isAdmin = req.user.role === 'ADMIN';

  // Allow if user is admin or accessing their own profile
  if (isAdmin || targetUserId === currentUserId || targetUserId === 'me') {
    return next();
  }

  next(new AppError('Access denied', 403));
};

/**
 * Middleware to check if user can modify user data
 */
export const canModifyUser = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const targetUserId = req.params['id'];
  const currentUserId = req.user.userId;
  const isAdmin = req.user.role === 'ADMIN';

  // Admin can modify any user
  if (isAdmin) {
    return next();
  }

  // Users can only modify their own profile
  if (targetUserId === currentUserId || targetUserId === 'me') {
    return next();
  }

  next(new AppError('Access denied', 403));
};

/**
 * Middleware to prevent users from modifying admin accounts
 */
export const preventAdminModification = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  // Only super admin can modify admin accounts
  // For now, we'll prevent any modification of admin accounts by non-admins
  if (req.user.role !== 'ADMIN' && req.body.role === 'ADMIN') {
    return next(new AppError('Cannot modify admin accounts', 403));
  }

  next();
};

/**
 * Get all permissions for a role
 */
export const getRolePermissions = (role: 'ADMIN' | 'USER'): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if role exists
 */
export const isValidRole = (role: string): role is 'ADMIN' | 'USER' => {
  return role === 'ADMIN' || role === 'USER';
};
