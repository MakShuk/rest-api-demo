import { Router } from 'express';
import authController from '../controllers/auth.controller';
import {
  validate,
  validateContentType,
  authRateLimit,
  apiRateLimit,
  authenticateToken,
} from '../middleware';
import { validationSets } from '../utils/validation.utils';

const router = Router();

/**
 * Authentication Routes
 * Base path: /auth
 */

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email, password, fullName, birthDate }
 */
router.post(
  '/register',
  authRateLimit, // Rate limiting for auth endpoints
  validateContentType('application/json'), // Ensure JSON content type
  validate(validationSets.register), // Validate registration data
  authController.register
);

/**
 * @route   POST /auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 * @body    { email, password }
 */
router.post(
  '/login',
  authRateLimit, // Rate limiting for auth endpoints
  validateContentType('application/json'), // Ensure JSON content type
  validate(validationSets.login), // Validate login data
  authController.login
);

/**
 * @route   POST /auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 * @note    Since we use stateless JWT, this is mainly for consistency
 */
router.post(
  '/logout',
  apiRateLimit, // Standard rate limiting
  authenticateToken, // Require authentication
  authController.logout
);

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  apiRateLimit, // Standard rate limiting
  authenticateToken, // Require authentication
  authController.me
);

export default router;
