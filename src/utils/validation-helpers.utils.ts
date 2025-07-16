import { Request } from 'express';
import { ValidationChain, body, param, query } from 'express-validator';

/**
 * Helper functions for validation
 */

/**
 * Create dynamic validation based on request context
 */
export const createDynamicValidation = (
  field: string,
  location: 'body' | 'param' | 'query' = 'body'
) => {
  const validator =
    location === 'body' ? body : location === 'param' ? param : query;

  return validator(field).custom(async (_value, { req }) => {
    // Dynamic validation based on user role
    const userRole = req['user']?.role || 'user';

    if (field === 'role' && userRole !== 'admin') {
      throw new Error('Only administrators can set user roles');
    }

    if (field === 'status' && userRole !== 'admin') {
      throw new Error('Only administrators can change user status');
    }

    return true;
  });
};

/**
 * Validate file extension
 */
export const validateFileExtension = (allowedExtensions: string[]) => {
  return (filename: string): boolean => {
    if (!filename) return false;

    const extension = filename.toLowerCase().split('.').pop();
    return allowedExtensions.includes(extension || '');
  };
};

/**
 * Validate image dimensions (for future file upload features)
 */
export const validateImageDimensions = (
  maxWidth: number,
  maxHeight: number,
  minWidth: number = 0,
  minHeight: number = 0
) => {
  return (width: number, height: number): boolean => {
    return (
      width >= minWidth &&
      width <= maxWidth &&
      height >= minHeight &&
      height <= maxHeight
    );
  };
};

/**
 * Sanitize HTML content
 */
export const sanitizeHtml = (content: string): string => {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone || phone.trim() === '') {
    return false;
  }

  // Remove formatting characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // International phone number format - must be at least 7 digits
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  return phoneRegex.test(cleanPhone);
};

/**
 * Validate date range
 */
export const validateDateRange = (
  startDate: string,
  endDate: string
): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return start <= end;
};

/**
 * Create conditional validation chain
 */
export const conditionalValidation = (
  condition: (req: Request) => boolean,
  validationChain: ValidationChain
): ValidationChain => {
  return validationChain.if(condition);
};

/**
 * Validate password strength score
 */
export const calculatePasswordStrength = (
  password: string
): {
  score: number;
  feedback: string[];
} => {
  let score = 0;
  const feedback: string[] = [];

  // Handle empty password
  if (!password || password.length === 0) {
    feedback.push('Password is required');
    return { score: 0, feedback };
  }

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push('Password should be at least 8 characters long');

  if (password.length >= 12) score += 1;

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  // Complexity checks
  if (!/(.)\1{2,}/.test(password)) score += 1;
  else feedback.push('Avoid repeating characters');

  if (!/^(.{0,2})\1+$/.test(password)) score += 1;
  else feedback.push('Avoid simple patterns');

  return { score, feedback };
};

/**
 * Validate business rules
 */
export const businessRuleValidators = {
  // Check if user can be deleted
  canDeleteUser: async (
    userId: string,
    currentUserId: string
  ): Promise<boolean> => {
    // Users cannot delete themselves
    if (userId === currentUserId) {
      return false;
    }

    // Add more business logic here
    return true;
  },

  // Check if user can change role
  canChangeRole: async (
    _targetUserId: string,
    newRole: string,
    currentUserRole: string
  ): Promise<boolean> => {
    // Only admins can change roles
    if (currentUserRole !== 'admin') {
      return false;
    }

    // Cannot change role to admin if not super admin (future feature)
    if (newRole === 'admin' && currentUserRole === 'admin') {
      return false; // Regular admin cannot promote to admin
    }

    return true;
  },

  // Check rate limiting for sensitive operations
  checkRateLimit: async (
    _userId: string,
    _operation: string
  ): Promise<boolean> => {
    // Implement rate limiting logic here
    // For now, return true
    return true;
  },
};

/**
 * Custom validation messages in multiple languages
 */
export const validationMessages = {
  en: {
    required: 'This field is required',
    email: 'Please provide a valid email address',
    password: 'Password must be at least 8 characters long',
    passwordMatch: 'Passwords do not match',
    invalidFormat: 'Invalid format',
    tooShort: 'Value is too short',
    tooLong: 'Value is too long',
    invalidChoice: 'Invalid choice',
  },
  ru: {
    required: 'Это поле обязательно для заполнения',
    email: 'Пожалуйста, введите корректный email адрес',
    password: 'Пароль должен содержать минимум 8 символов',
    passwordMatch: 'Пароли не совпадают',
    invalidFormat: 'Неверный формат',
    tooShort: 'Значение слишком короткое',
    tooLong: 'Значение слишком длинное',
    invalidChoice: 'Неверный выбор',
  },
};

/**
 * Get localized validation message
 */
export const getValidationMessage = (
  key: keyof typeof validationMessages.en,
  locale: string = 'en'
): string => {
  const messages =
    validationMessages[locale as keyof typeof validationMessages] ||
    validationMessages.en;
  return messages[key] || validationMessages.en[key];
};

/**
 * Validation middleware factory for common patterns
 */
export const createValidationMiddleware = (rules: ValidationChain[]) => {
  return {
    rules,
    // Add method to get validation errors in specific format
    getErrors: (req: Request) => {
      const { validationResult } = require('express-validator');
      return validationResult(req);
    },
  };
};

/**
 * Schema validation for complex objects
 */
export const validateSchema = (
  data: any,
  schema: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Basic schema validation implementation
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    const ruleSet = rules as any;

    if (
      ruleSet.required &&
      (value === undefined || value === null || value === '')
    ) {
      errors.push(`${key} is required`);
      continue;
    }

    if (value !== undefined && value !== null) {
      if (ruleSet.type && typeof value !== ruleSet.type) {
        errors.push(`${key} must be of type ${ruleSet.type}`);
      }

      if (ruleSet.minLength && value.length < ruleSet.minLength) {
        errors.push(
          `${key} must be at least ${ruleSet.minLength} characters long`
        );
      }

      if (ruleSet.maxLength && value.length > ruleSet.maxLength) {
        errors.push(
          `${key} must be no more than ${ruleSet.maxLength} characters long`
        );
      }

      if (ruleSet.pattern && !ruleSet.pattern.test(value)) {
        errors.push(`${key} format is invalid`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
