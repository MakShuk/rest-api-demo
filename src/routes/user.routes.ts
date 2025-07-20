import { Router } from 'express';
import userController from '../controllers/user.controller';
import {
  validate,
  validateContentType,
  apiRateLimit,
  adminRateLimit,
  authenticateToken,
  requireAdmin,
  canAccessOwnProfile,
  canModifyUser,
  extractUserIdFromToken,
} from '../middleware';
import { validationSets } from '../utils/validation.utils';

const router = Router();

/**
 * User Management Routes
 * Base path: /users
 */

/**
 * @route   GET /users/stats
 * @desc    Get user statistics
 * @access  Admin only
 * @note    Must be before /users/:id to avoid route conflicts
 */
router.get(
  '/stats',
  adminRateLimit, // Admin rate limiting
  authenticateToken, // Require authentication
  requireAdmin, // Admin only
  userController.getUserStats
);

/**
 * @route   GET /users/search
 * @desc    Search users by query
 * @access  Admin only
 * @query   { q: string, page?: number, limit?: number }
 * @note    Must be before /users/:id to avoid route conflicts
 */
router.get(
  '/search',
  adminRateLimit, // Admin rate limiting
  authenticateToken, // Require authentication
  requireAdmin, // Admin only
  validate(validationSets.getUsers), // Validate pagination and search params
  userController.searchUsers
);

/**
 * @route   GET /users/me
 * @desc    Get current user's own profile (alias for /users/:id with own ID)
 * @access  Private
 * @note    Must be before /users/:id to avoid route conflicts
 */
router.get(
  '/me',
  apiRateLimit, // Standard rate limiting
  authenticateToken, // Require authentication
  extractUserIdFromToken, // Replace 'me' with actual user ID
  canAccessOwnProfile, // Ensure user can access this profile
  userController.getById
);

/**
 * @route   GET /users
 * @desc    Get all users with pagination
 * @access  Admin only
 * @query   { page?: number, limit?: number, search?: string }
 */
router.get(
  '/',
  adminRateLimit, // Admin rate limiting
  authenticateToken, // Require authentication
  requireAdmin, // Admin only
  validate(validationSets.getUsers), // Validate pagination params
  userController.getAll
);

/**
 * @route   GET /users/:id
 * @desc    Get user by ID
 * @access  Private (own profile) or Admin (any profile)
 * @param   id - User UUID
 */
router.get(
  '/:id',
  apiRateLimit, // Standard rate limiting
  authenticateToken, // Require authentication
  validate(validationSets.getUserById), // Validate ID parameter
  canAccessOwnProfile, // Check if user can access this profile
  userController.getById
);

/**
 * @route   PATCH /users/:id
 * @desc    Update user profile
 * @access  Private (own profile, limited fields) or Admin (any profile, all fields)
 * @param   id - User UUID
 * @body    { fullName?, birthDate?, email?, role?, status? }
 */
router.patch(
  '/:id',
  apiRateLimit, // Standard rate limiting
  authenticateToken, // Require authentication
  validateContentType('application/json'), // Ensure JSON content type
  validate(validationSets.updateUser), // Validate update data
  canModifyUser, // Check if user can modify this profile
  userController.updateUser
);

/**
 * @route   PATCH /users/:id/block
 * @desc    Block user account
 * @access  Admin only
 * @param   id - User UUID
 */
router.patch(
  '/:id/block',
  adminRateLimit, // Admin rate limiting
  authenticateToken, // Require authentication
  requireAdmin, // Admin only
  validate(validationSets.blockUser), // Validate ID parameter
  userController.blockUser
);

/**
 * @route   PATCH /users/:id/unblock
 * @desc    Unblock user account
 * @access  Admin only
 * @param   id - User UUID
 */
router.patch(
  '/:id/unblock',
  adminRateLimit, // Admin rate limiting
  authenticateToken, // Require authentication
  requireAdmin, // Admin only
  validate(validationSets.blockUser), // Validate ID parameter (reuse blockUser validation)
  userController.unblockUser
);

/**
 * @route   DELETE /users/:id
 * @desc    Delete user account (soft delete)
 * @access  Admin only
 * @param   id - User UUID
 */
router.delete(
  '/:id',
  adminRateLimit, // Admin rate limiting
  authenticateToken, // Require authentication
  requireAdmin, // Admin only
  validate(validationSets.getUserById), // Validate ID parameter
  userController.deleteUser
);

export default router;
