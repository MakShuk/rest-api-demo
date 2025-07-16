import { body, param, query } from 'express-validator';

/**
 * Common validation rules
 */
export const validationRules = {
  // Email validation
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  // Password validation
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  // Full name validation
  fullName: body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Zа-яА-Я\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),

  // Birth date validation
  birthDate: body('birthDate')
    .isISO8601()
    .withMessage('Birth date must be a valid date in ISO format (YYYY-MM-DD)')
    .custom((value) => {
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
  id: param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID'),

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
    validationRules.role,
  ],

  // User login validation
  login: [
    validationRules.email,
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],

  // Get user by ID validation
  getUserById: [
    validationRules.id,
  ],

  // Get users list validation
  getUsers: [
    validationRules.page,
    validationRules.limit,
    validationRules.search,
  ],

  // Block user validation
  blockUser: [
    validationRules.id,
  ],
};
