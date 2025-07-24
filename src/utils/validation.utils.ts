import { body, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Common validation rules
 */
export const validationRules = {
  // Email validation with uniqueness check
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
    .custom(async (value, { req }) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: value },
      });

      // For registration, email must be unique
      if (req['path'] === '/register' && existingUser) {
        throw new Error('Email already exists');
      }

      // For login, email must exist
      if (req['path'] === '/login' && !existingUser) {
        throw new Error('Invalid email or password');
      }
      return true;
    }),

  // Email validation without uniqueness check (for updates)
  emailUpdate: body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  // Password validation with strength check
  password: body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .custom(value => {
      // Check for common weak passwords
      const weakPasswords = [
        'password',
        '12345678',
        'qwerty123',
        'admin123',
        'password123',
      ];
      if (weakPasswords.includes(value.toLowerCase())) {
        throw new Error(
          'Password is too weak. Please choose a stronger password'
        );
      }
      return true;
    }),

  // Password confirmation validation
  passwordConfirm: body('passwordConfirm').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),

  // Current password validation (for password changes)
  currentPassword: body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  // Full name validation with enhanced checks
  fullName: body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Zа-яА-Я\s\-'\.]+$/)
    .withMessage(
      'Full name can only contain letters, spaces, hyphens, apostrophes, and dots'
    )
    .custom(value => {
      // Check for consecutive spaces or special characters
      if (/\s{2,}/.test(value) || /[-'\.]{2,}/.test(value)) {
        throw new Error(
          'Full name cannot contain consecutive spaces or special characters'
        );
      }

      // Check for leading/trailing special characters
      if (/^[-'\.\s]|[-'\.\s]$/.test(value)) {
        throw new Error(
          'Full name cannot start or end with special characters or spaces'
        );
      }

      return true;
    }),

  // Birth date validation
  birthDate: body('birthDate')
    .isISO8601()
    .withMessage('Birth date must be a valid date in ISO format (YYYY-MM-DD)')
    .custom(value => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 13 || age > 120) {
        throw new Error('Age must be between 13 and 120 years');
      }

      return true;
    }),

  // Role validation
  role: body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be either "admin" or "user"'),

  // Status validation
  status: body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either "active" or "inactive"'),

  // ID parameter validation
  id: param('id').isUUID().withMessage('ID must be a valid UUID'),

  // Pagination validation
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  // Search query validation
  search: query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
};

/**
 * Validation rule sets for different endpoints
 */
export const validationSets = {
  // User registration validation
  register: [
    validationRules.email,
    validationRules.password,
    validationRules.fullName,
    validationRules.birthDate,
  ],

  // User login validation
  login: [
    validationRules.email,
    body('password').notEmpty().withMessage('Password is required'),
  ],

  // Get user by ID validation
  getUserById: [validationRules.id],

  // Get users list validation
  getUsers: [
    validationRules.page,
    validationRules.limit,
    validationRules.search,
  ],

  // Block user validation
  blockUser: [validationRules.id],

  // Update user validation
  updateUser: [
    validationRules.id,
    validationRules.emailUpdate,
    body('fullName')
      .optional()
      .custom(value => {
        if (value) {
          // Reuse fullName validation logic
          if (
            typeof value !== 'string' ||
            value.trim().length < 2 ||
            value.trim().length > 100
          ) {
            throw new Error('Full name must be between 2 and 100 characters');
          }
          if (!/^[a-zA-Zа-яА-Я\s\-'\.]+$/.test(value)) {
            throw new Error(
              'Full name can only contain letters, spaces, hyphens, apostrophes, and dots'
            );
          }
        }
        return true;
      }),
    validationRules.role,
    validationRules.status,
  ],

  // Change password validation
  changePassword: [
    validationRules.id,
    validationRules.currentPassword,
    validationRules.password,
    validationRules.passwordConfirm,
  ],

  // Register with confirmation validation
  registerWithConfirm: [
    validationRules.email,
    validationRules.password,
    validationRules.passwordConfirm,
    validationRules.fullName,
    validationRules.birthDate,
  ],

  // Bulk operations validation
  bulkUsers: [
    body('userIds')
      .isArray({ min: 1, max: 100 })
      .withMessage('User IDs must be an array with 1-100 items')
      .custom(userIds => {
        if (
          !userIds.every((id: string) =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              id
            )
          )
        ) {
          throw new Error('All user IDs must be valid UUIDs');
        }
        return true;
      }),
    body('action')
      .isIn(['activate', 'deactivate', 'delete'])
      .withMessage('Action must be one of: activate, deactivate, delete'),
  ],
};
